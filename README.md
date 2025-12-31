# HP Game

## Overview
<!-- Describe your game here -->

## Getting Started

### Prerequisites
<!-- List prerequisites here -->

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd hp_game

# Set up your environment
# ...
```

## Project Structure

```
hp_game/
├── .claude/           # Claude Code configuration
│   ├── commands/      # Custom slash commands
│   └── settings.local.json
├── PRPs/              # Product Requirement Plans
├── src/               # Source code (to be created)
├── tests/             # Test files (to be created)
├── CLAUDE.md          # Claude Code guidelines
├── PLANNING.md        # Architecture and planning
├── TASK.md            # Task tracking
└── README.md          # This file
```

## Development

### Using Claude Code

This project uses context engineering for AI-assisted development:

1. **Define your feature** in `INITIAL.md`
2. **Generate a PRP**: `/generate-prp INITIAL.md`
3. **Execute the PRP**: `/execute-prp PRPs/your-feature.md`

### Key Files

- `CLAUDE.md` - Guidelines for Claude Code
- `PLANNING.md` - Project architecture and design decisions
- `TASK.md` - Current and completed tasks

## License
<!-- Add your license here -->
