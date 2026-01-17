# Auror Academy: Critical Thinking Investigation Game

> An AI-powered Harry Potter detective game teaching rationality and deductive reasoning through immersive investigations.

**Version:** 1.6.0 | **Type Safety:** Grade A | **Status:** Production Ready

---

## 🎯 Overview

**Auror Academy** is an interactive investigation game where you play as an Auror-in-training, solving magical mysteries at Hogwarts. The game combines:

- 🔍 **AI-Powered Investigations** - Dynamic LLM narrator responds to freeform actions
- 🗣️ **Witness Interrogation** - Build trust, reveal secrets, detect lies
- 🔮 **Magic System** - Cast 7 investigation spells (Revelio, Legilimency, etc.)
- 🧠 **Critical Thinking** - Detect fallacies, avoid bias, submit verdicts
- 👻 **Inner Voice (Tom)** - AI mentor who's 50/50 helpful/misleading

**Perfect for:** Educators teaching critical thinking, Harry Potter fans, detective game enthusiasts

---

## ✨ Core Features

### Investigation
- **Freeform Input**: Type any action—LLM narrator responds dynamically
- **Evidence Discovery**: Keyword triggers with 5+ variants per clue
- **Location Navigation**: Move between Library, Dormitory, Great Hall (clickable or natural language)
- **7 Investigation Spells**: Revelio, Homenum Revelio, Prior Incantato, Specialis Revelio, Legilimency, Finite Incantatem, Protego Totalum
- **Conversation History**: Full investigation transcript preserved across saves

### Witness System
- **Interrogation**: Question suspects, present evidence
- **Trust Mechanics**: 0-100% trust affects honesty (LA Noire-inspired)
- **Secret Revelation**: Evidence presentation unlocks hidden information
- **AI-Powered Dialogue**: Every witness responds with unique personality

### Verdict & Feedback
- **Detective Reasoning**: Submit suspect + explanation + evidence
- **Fallacy Detection**: Moody analyzes for 4 types of logical errors
- **Adaptive Hints**: Feedback scales with attempt count
- **Post-Verdict Confrontation**: Dialogue scene with culprit if correct

### Educational Components
- **Briefing System**: Moody teaches rationality concepts (base rates, evidence strength)
- **Tom's Guidance**: Ghost mentor provides 50% helpful, 50% misleading advice
- **Critical Thinking**: Learn to evaluate evidence objectively

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** with [uv](https://github.com/astral-sh/uv)
- **Bun** (not npm/yarn)
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/Roderick111/hp-game.git
   cd hp-game
   ```

2. **Backend setup**
   ```bash
   cd backend
   uv venv
   uv sync
   cp .env.example .env
   # Add your ANTHROPIC_API_KEY to .env
   uv run uvicorn src.main:app --reload
   ```
   Backend runs at `http://localhost:8000`

3. **Frontend setup** (new terminal)
   ```bash
   cd frontend
   bun install
   ~/.bun/bin/bun run dev
   ```
   Frontend runs at `http://localhost:5173`

4. **Play!**
   - Open browser to `http://localhost:5173`
   - Select a case from landing page
   - Complete Moody's briefing
   - Start investigating!

---

## 🎮 How to Play

### 1. Briefing Phase
- Moody explains the case (WHO/WHAT/WHERE/WHEN)
- Ask follow-up questions to clarify details
- Learn a rationality concept (e.g., base rates, evidence strength)

### 2. Investigation Phase
- **Navigate**: Click locations or type "go to dormitory"
- **Investigate**: Type freeform actions ("search the desk", "examine the wand")
- **Cast Spells**: "revelio hidden objects", "legilimens on Hermione"
- **Talk to Tom**: "Tom, should I trust this witness?" (but beware—he's sometimes wrong!)
- **Evidence Board**: Automatically tracks discovered clues

### 3. Interrogation Phase
- **Question Witnesses**: Ask anything, AI responds in character
- **Build Trust**: Empathetic questions (+5%), aggressive (-10%)
- **Present Evidence**: Show contradictions to reveal secrets

### 4. Verdict Phase
- **Submit Accusation**: Choose suspect + reasoning + evidence
- **Moody's Analysis**: Fallacy detection and scoring (0-100)
- **Confrontation**: Dialogue scene with culprit if correct
- **10 Attempts**: Educational focus—learn from mistakes

### Controls
- **ESC**: Open main menu (New Game, Save, Load, Settings, Exit)
- **1-3**: Quick-select locations
- **Ctrl+Enter**: Submit investigation action
- **Cmd+H**: View Auror's Handbook (spell reference)

---

## 🏗️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Python + FastAPI | 3.13.3 |
| **Frontend** | React + TypeScript + Vite | 18.3 / 5.6 / 6.0 |
| **LLM** | Anthropic Claude (Haiku 4.5) | 0.76.0 |
| **Validation** | Pydantic v2 (backend) + Zod (frontend) | 4.3.5 |
| **Styling** | Tailwind CSS | 3.4 |
| **Testing** | pytest / Vitest | - |
| **Package Mgmt** | uv / Bun | - |

---

## 📖 Documentation

### Getting Started
- [Game Design Document](docs/game-design/AUROR_ACADEMY_GAME_DESIGN.md) - Complete game design
- [Case Design Guide](docs/CASE_DESIGN_GUIDE.md) - Create your own cases
- [Developer Guide](CLAUDE.md) - Coding standards & agent orchestration

### Project Status
- [Current Status](STATUS.md) - Phase completion, metrics, recent activity
- [Planning & Roadmap](PLANNING.md) - What's next, priorities, backlog
- [Changelog](CHANGELOG.md) - Version history

### Technical Details
- [Type System Audit](docs/TYPE_SYSTEM_AUDIT.md) - TypeScript architecture
- [Validation Report](VALIDATION-GATES-ZOD-REPORT.md) - Zod implementation

---

## 🧪 Development

### Run Tests
```bash
# Backend (154 tests, 100% coverage)
cd backend && uv run pytest

# Frontend (377/565 tests)
cd frontend && bun test
```

### Type Checking
```bash
# Backend
cd backend && uv run mypy src/

# Frontend
cd frontend && bun run type-check
```

### Linting
```bash
# Backend
cd backend && uv run ruff check .

# Frontend
cd frontend && bun run lint
```

### Build
```bash
# Frontend (production build)
cd frontend && bun run build
```

---

## 📊 Project Metrics

**Current Version:** 1.6.0 (Phase 6 Complete)

| Metric | Status |
|--------|--------|
| Type Safety | ✅ Grade A (compile-time + runtime) |
| Security | ✅ 0 vulnerabilities (audited 2026-01-17) |
| Backend Tests | ✅ 154/154 (100%) |
| Frontend Tests | ⚠️ 377/565 (66.7% - pre-existing) |
| Bundle Size | ✅ 104.67 KB gzipped |
| Cases Complete | ✅ 2 playable cases |
| Production Ready | ✅ Yes |

See [STATUS.md](STATUS.md) for detailed current state.

---

## 🗂️ Project Structure

```
hp_game/
├── backend/                # Python FastAPI + Claude LLM
│   ├── src/
│   │   ├── case_store/     # YAML case files + loader
│   │   ├── context/        # LLM context builders (narrator, witness, mentor)
│   │   ├── api/            # FastAPI routes + Claude client
│   │   └── state/          # Player state + persistence
│   ├── tests/              # pytest tests (154, 100% coverage)
│   └── pyproject.toml
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # React hooks
│   │   ├── api/            # Backend client + Zod schemas
│   │   └── types/          # TypeScript types
│   ├── tests/              # Vitest tests
│   └── package.json
├── docs/                   # Documentation
│   ├── game-design/        # Game design documents
│   ├── case-files/         # Case specifications
│   └── research/           # Research & analysis
├── PLANNING.md             # Roadmap & priorities
├── STATUS.md               # Current status & metrics
├── CLAUDE.md               # Developer guide
└── README.md               # This file
```

---

## 🤝 Contributing

This is an educational project. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Coding Standards:** See [CLAUDE.md](CLAUDE.md)

---

## 📜 License

[Add license information]

---

## 🙏 Acknowledgments

- Built with [Anthropic Claude](https://www.anthropic.com/)
- Harry Potter universe © J.K. Rowling
- Inspired by *Return of the Obra Dinn*, *LA Noire*, and rationality education

---

**Questions?** See [STATUS.md](STATUS.md) or open an issue.
