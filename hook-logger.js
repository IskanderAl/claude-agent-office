#!/usr/bin/env node
// Claude Code Hook — logs real agent activity to events.json
// Triggered on every tool use (PreToolUse / PostToolUse / Notification)

const fs = require('fs');
const path = require('path');

const EVENTS_FILE = path.join(__dirname, 'events.json');
const MAX_EVENTS = 200;

// Read hook input from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(input);

    // Debug: dump all hook keys to see if tokens/cost data exists
    const debugFile = path.join(__dirname, 'hook-debug.json');
    try {
      const debugData = {
        timestamp: Date.now(),
        all_keys: Object.keys(hookData),
        hook_type: hookData.hook_type,
        tool_name: hookData.tool_name,
        // Log everything except tool_input content (too large)
        has_tool_output: !!hookData.tool_output,
        has_usage: !!hookData.usage,
        has_tokens: !!hookData.tokens,
        has_cost: !!hookData.cost,
        has_metadata: !!hookData.metadata,
        has_stats: !!hookData.stats,
        raw_extra: Object.fromEntries(
          Object.entries(hookData).filter(([k]) =>
            !['tool_input', 'tool_output'].includes(k)
          )
        ),
      };
      fs.writeFileSync(debugFile, JSON.stringify(debugData, null, 2));
    } catch(e) {}

    // Build event object
    const event = {
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: hookData.hook_type || 'unknown',       // PreToolUse, PostToolUse, Notification
      tool: hookData.tool_name || 'unknown',         // Read, Write, Bash, Edit, Grep, Glob, Agent, etc.
      session: hookData.session_id || 'main',
      // Extract useful info from tool input
      detail: extractDetail(hookData),
      // Sub-agent info
      is_subagent: !!(hookData.tool_name === 'Agent' || hookData.session_id !== hookData.parent_session_id),
      agent_name: hookData.tool_input?.subagent_type || hookData.tool_input?.description || null,
    };

    // Read existing events
    let events = [];
    try {
      if (fs.existsSync(EVENTS_FILE)) {
        events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
      }
    } catch (e) {
      events = [];
    }

    // Append and trim
    events.push(event);
    if (events.length > MAX_EVENTS) {
      events = events.slice(-MAX_EVENTS);
    }

    // Write back
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));

    // Output empty JSON (no hook override)
    process.stdout.write(JSON.stringify({}));
  } catch (e) {
    // Don't break Claude Code on hook errors
    process.stdout.write(JSON.stringify({}));
  }
});

function extractDetail(hookData) {
  const input = hookData.tool_input || {};
  const tool = hookData.tool_name || '';

  switch (tool) {
    case 'Read':
      return `Reading ${shortenPath(input.file_path)}`;
    case 'Write':
      return `Writing ${shortenPath(input.file_path)}`;
    case 'Edit':
      return `Editing ${shortenPath(input.file_path)}`;
    case 'Bash':
      return `$ ${redact((input.command || '').substring(0, 60))}`;
    case 'Grep':
      return `Searching: "${redact((input.pattern || '').substring(0, 40))}"`;
    case 'Glob':
      return `Finding: ${(input.pattern || '').substring(0, 40)}`;
    case 'Agent':
      return `Agent: ${redact((input.description || input.subagent_type || 'sub-agent').substring(0, 60))}`;
    case 'WebSearch':
      return `Searching web: "${redact((input.query || '').substring(0, 40))}"`;
    case 'WebFetch':
      return `Fetching: ${redact((input.url || '').substring(0, 50))}`;
    default:
      return `${(tool || 'unknown').substring(0, 40)} tool`;
  }
}

// Redact sensitive patterns from logged strings
function redact(str) {
  if (!str) return '';
  return str
    .replace(/(?:Bearer|token|key|password|secret|auth)[=:\s]+\S{4,}/gi, '[REDACTED]')
    .replace(/sk-[a-zA-Z0-9]{8,}/g, '[REDACTED]')
    .replace(/ghp_[a-zA-Z0-9]{8,}/g, '[REDACTED]')
    .replace(/glpat-[a-zA-Z0-9]{8,}/g, '[REDACTED]')
    .replace(/(?:api[_-]?key|apikey)[=:\s]+\S{4,}/gi, '[REDACTED]');
}

function shortenPath(p) {
  if (!p) return '...';
  const parts = p.replace(/\\/g, '/').split('/');
  return parts.length > 2 ? '.../' + parts.slice(-2).join('/') : p;
}
