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
      return `$ ${(input.command || '').substring(0, 60)}`;
    case 'Grep':
      return `Searching: "${(input.pattern || '').substring(0, 40)}"`;
    case 'Glob':
      return `Finding: ${(input.pattern || '').substring(0, 40)}`;
    case 'Agent':
      return `Agent: ${input.description || input.subagent_type || 'sub-agent'}`;
    case 'WebSearch':
      return `Searching web: "${(input.query || '').substring(0, 40)}"`;
    case 'WebFetch':
      return `Fetching: ${(input.url || '').substring(0, 50)}`;
    default:
      return `${tool} tool`;
  }
}

function shortenPath(p) {
  if (!p) return '...';
  const parts = p.replace(/\\/g, '/').split('/');
  return parts.length > 2 ? '.../' + parts.slice(-2).join('/') : p;
}
