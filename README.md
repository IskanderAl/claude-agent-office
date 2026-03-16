# 🏢 Claude Agent Office

Real-time visualization of Claude Code agent activity as animated workers in a virtual office.

![Claude Agent Office](https://img.shields.io/badge/Claude_Code-Live_Dashboard-f59e0b?style=for-the-badge)

## What is this?

A fun, visual dashboard that shows **what Claude Code is doing in real time** — each tool call becomes a worker running between desks in a virtual office.

- 📖 **Read/Search zone** — when Claude reads files, greps, or globs
- ✏️ **Write/Edit zone** — when Claude writes or edits code
- ⚡ **Bash zone** — when Claude runs commands
- 🌐 **Web zone** — when Claude searches the web
- 🤖 **Sub-Agents zone** — when Claude spawns sub-agents
- 💤 **Idle zone** — when a worker is thinking

Each Claude Code session = a separate animated bot. Sub-agents get their own bots too.

## Features

- 🟢 **LIVE mode** — connected to real Claude Code hooks via `events.json`
- 🟡 **DEMO mode** — simulated activity (auto-fallback when no hooks)
- 💬 **Speech bubbles** — show what each bot is actually doing
- 📊 **Stats** — workers count, events, tools used, uptime
- ✨ **Particles & animations** — walking, working spinners, connection lines
- 🔄 **Auto-detection** — tries LIVE first, falls back to DEMO

## Quick Start

### 1. Just the Demo (no setup needed)

Open `index.html` in your browser. It will start in Demo mode automatically.

### 2. Live Mode (connected to Claude Code)

#### Step 1: Serve the files

```bash
npx serve . -l 3001
```

#### Step 2: Add hooks to Claude Code

Add this to your `~/.claude/settings.json` (or project `.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/claude-office/hook-logger.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/claude-office/hook-logger.js"
          }
        ]
      }
    ]
  }
}
```

> Replace `/path/to/claude-office/` with the actual path to this project.

#### Step 3: Open the dashboard

Go to `http://localhost:3001` — you'll see the 🟢 LIVE badge and your Claude Code activity in real time!

## How it Works

```
Claude Code (you chat)
    ↓ hooks (PreToolUse / PostToolUse)
    ↓
hook-logger.js → writes events.json
    ↓
index.html → polls events.json every second
    ↓
🏢 Animated workers in the office!
```

## Files

| File | Description |
|---|---|
| `index.html` | The full dashboard (single-file, no build step) |
| `hook-logger.js` | Claude Code hook script that logs events to `events.json` |
| `events.json` | Auto-generated event log (gitignored) |

## Controls

- **+ Add Worker** — manually add a bot
- **Switch to Demo/Live** — toggle between modes

## Requirements

- A browser (Chrome, Firefox, Edge, Safari)
- Node.js (for the hook script and local server)
- Claude Code (for live mode)

## License

MIT

---

Built with ❤️ by Claude Code agents 🤖
