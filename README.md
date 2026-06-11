# 🎬 CinéMood

> A personal film diary and AI-powered recommendation engine.<br>
> Log what you watch, rate it your way, and get suggestions based on your mood and streaming platforms.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal?logo=fastapi)
![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql)
![Holberton](https://img.shields.io/badge/Holberton-Bordeaux-red)

---

## Table of Contents

- [1. About the Project](#about-the-project)
- [2. Features](#features)
  - [2.1. Film Logging](#film-logging)
  - [2.2. Original Rating System](#original-rating-system)
  - [2.3. Mood-Based Recommendation Engine](#mood-based-recommendation-engine)
  - [2.4. Personal Dashboard](#personal-dashboard)
- [3. Tech Stack](#tech-stack)
- [4. Architecture](#architecture)
- [5. Database](#database)
- [6. Project Structure](#project-structure)
- [7. Getting Started](#getting-started)
  - [7.1. Prerequisites](#prerequisites)
  - [7.2. One time installation](#one-time-installation)
    - [7.2.1. Clone the repository](#clone-the-repository)
    - [7.2.2. Run the setup script](#run-the-setup-script)
  - [7.3. Each working session](#each-working-session)
  - [7.4. Cleaning the project](#cleaning-the-project)
- [8. API Overview](#api-overview)
- [9. Git Workflow](#git-workflow)
  - [9.1. Branch Strategy](#branch-strategy)
  - [9.2. Step-by-step workflow for each issue](#step-by-step-workflow-for-each-issue)
    - [9.2.1. Start a new issue](#start-a-new-issue)
    - [9.2.2. Work and commit regularly](#work-and-commit-regularly)
    - [9.2.3. Before opening a Pull Request](#before-opening-a-pull-request)
    - [9.2.4. Open a Pull Request on GitHub](#open-a-pull-request-on-github)
    - [9.2.5. After the merge](#after-the-merge)
  - [9.3. Commit Convention](#commit-convention)
  - [9.4. Closing Issues via Commits](#closing-issues-via-commits)
- [10. Testing](#testing)
- [11. Documentation](#documentation)
  - [11.1. Portfolio Project Progress Reports](#portfolio-project-progress-reports)
  - [11.2. Technical Diagrams](#technical-diagrams)
  - [11.3. UI Prototype](#ui-prototype)
- [12. Roadmap](#roadmap)
  - [12.1. MVP (current scope)](#mvp-current-scope)
  - [12.2. Future versions](#future-versions)
- [13. Author](#author)

---

## About the Project

CinéMood was born out of a simple frustration: choosing what to watch is harder than it should be.

Existing tools like Letterboxd or IMDb let you rate films - but they rarely combine your personal taste, your current mood, and what you actually have access to on your streaming subscriptions.

CinéMood is different. It acts as a personal film companion that:
- Remembers everything you have watched and how you felt about it
- Uses your mood as a starting point, not an afterthought
- Only recommends films you can actually watch tonight

This project is the end-of-year portfolio project for the Bachelor CDA program at Holberton School Bordeaux.

---

## Features

### Film Logging

🎞️ **The tool lets users add movies to personal "watched" or "to-watch" lists**
- Search for any film by title (powered by the TMDB API)
- Add it to your viewing history or watchlist
- Log it with emotional and contextual tags instead of a simple star rating

### Original Rating System

🏷️ **The tool lets users rate films with tags that actually mean something**:
| Tag | Meaning |
|---|---|
| Great with a group | Best experienced with others |
| Perfect background watch | Can scroll while it's on |
| Emotional wreck | Unexpectedly moving |
| Guilty pleasure | Bad but you loved it |
| Mind blowing | Changed how you think |
| Needs full attention | Do not disturb |
| Would rewatch immediately | Says it all |
| Instant classic | Timeless |

Optionally assign a prestige tier: **Platinum / Gold / Silver / Bronze / Trash**

### Mood-Based Recommendation Engine

🎭 **The tool provides personalized AI-powered recommendations through a comprehensive user experience**
- Answer a short mood questionnaire
- Swipe through film cards (right = interested, left = not interested)
- Optionally add a custom prompt
- Receive a curated list of personalised recommendations
- Filtered by the streaming platforms you actually have

### Personal Dashboard
📋 **The tool allows users to keep track of the movies they've watched and the emotional impact they had on them at the time of viewing**
- View your full watching history
- Browse your watchlist
- See your tags and tiers at a glance

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 | Component-based UI, type-safe, responsive design |
| UI Components | shadcn/ui (New York style) | Accessible, composable component library |
| Routing | React Router v7 | Client-side navigation |
| Backend | Python 3.12 + FastAPI | REST API, business logic, async support |
| Database | PostgreSQL 16 | Relational data persistence |
| ORM | SQLAlchemy 2.0 + Alembic | Database models and migrations |
| Authentication | JWT | Stateless user authentication |
| Film data | TMDB API | Film metadata, posters, streaming availability |
| AI recommendations | Mistral AI | Mood-based LLM recommendation engine *(Sprint 5)* |
| Testing | pytest + pytest-cov | Unit and integration tests |
| Version control | Git + GitHub | Source control and project history |

---

## Architecture

The application follows a classic three-tier architecture separating the presentation layer, business logic, and data layer.<br>
External services (TMDB and Mistral AI) are called exclusively by the backend — never directly by the frontend.

→ [View Architecture Diagrams](docs/diagrams/Architecture.md)

---

## Database

CinéMood uses PostgreSQL as its relational database. Film metadata is not stored locally — only the `tmdb_id` is persisted, and full film details are fetched from TMDB on demand.

→ [View Entity Relationship Diagram](docs/diagrams/ERDiagram.md)

---

## Project Structure

```
holbertonschool-CineMood/
├── README.md
├── docker-compose.yml
├── setup.sh                    ← one-time environment setup
├── start.sh                    ← start both servers
├── clean.sh                    ← remove caches and build artifacts
├── test.sh                     ← run backend test suite with coverage
├── pyrightconfig.json          ← Pyright/Pylance config for backend venv
├── docs/
│   ├── diagrams/
│   │   ├── Architecture.md
│   │   ├── ClassDiagram.md
│   │   ├── ERDiagram.md
│   │   └── SequenceDiagrams.md
│   ├── images/
│   ├── Stage 1 Report - Team Formation, Brainstorming and MVP.pdf
│   ├── Stage 2 Report - Project Planning.pdf
│   └── Stage 3 Report - Technical Documentation.pdf
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.tsx                    ← app entry point
│   │   ├── index.css                   ← global styles (Tailwind v4)
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/                     ← shadcn/ui primitives
│   │   │   ├── pages/                  ← one file per route
│   │   │   │   ├── auth-page.tsx
│   │   │   │   ├── dashboard-page.tsx
│   │   │   │   ├── search-page.tsx
│   │   │   │   ├── history-page.tsx
│   │   │   │   ├── watchlist-page.tsx
│   │   │   │   ├── film-detail-page.tsx
│   │   │   │   ├── recommendation-page.tsx
│   │   │   │   ├── swipe-page.tsx
│   │   │   │   ├── results-page.tsx
│   │   │   │   └── profile-page.tsx
│   │   │   ├── cinemood-app.tsx         ← root component + routing
│   │   │   ├── app-layout.tsx           ← navbar + page shell
│   │   │   ├── auth-context.tsx         ← mock auth context (dev)
│   │   │   ├── library-context.tsx      ← mock library state (dev)
│   │   │   ├── film-card.tsx
│   │   │   ├── log-film-dialog.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   └── logo.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx          ← real auth context (backend-ready)
│   │   ├── services/
│   │   │   └── api.ts                   ← Axios instance + JWT interceptors
│   │   └── lib/
│   │       ├── mock-data.ts             ← fixture data (dev only)
│   │       └── utils.ts                 ← cn() class helper
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
└── backend/
    ├── alembic/                         ← database migrations
    │   └── versions/
    ├── app/
    │   ├── main.py                      ← FastAPI app + CORS + routers
    │   ├── config.py                    ← settings (env vars)
    │   ├── database.py                  ← SQLAlchemy engine + session
    │   ├── dependencies.py              ← get_db, get_current_user
    │   ├── external/
    │   │   └── tmdb_client.py           ← TMDB API facade
    │   ├── models/
    │   │   ├── user.py
    │   │   ├── viewing_history_entry.py
    │   │   ├── watchlist_entry.py
    │   │   ├── tag.py
    │   │   └── prestige_tier.py
    │   ├── schemas/
    │   │   ├── user.py
    │   │   ├── film.py
    │   │   ├── viewing_history.py
    │   │   ├── watchlist.py
    │   │   └── validate.py
    │   ├── repositories/
    │   │   ├── user_repository.py
    │   │   ├── viewing_history_repository.py
    │   │   └── watchlist_repository.py
    │   ├── services/
    │   │   ├── auth_service.py
    │   │   ├── film_service.py
    │   │   ├── viewing_history_service.py
    │   │   └── watchlist_service.py
    │   └── routes/
    │       ├── auth.py
    │       ├── film.py
    │       ├── tag.py
    │       ├── viewing_history.py
    │       └── watchlist.py
    ├── seeds/
    │   └── seed_tag.py
    ├── tests/
    │   ├── conftest.py
    │   ├── test_auth.py
    │   └── test_films_and_history.py
    ├── requirements.txt
    └── .env.example
```

---

## Getting Started

### Prerequisites

Before running the setup script, make sure the following tools are installed:

- Python >= 3.12
- Node.js >= 18
- Docker Engine with Docker Compose v2
- A [TMDB Read Access Token](https://www.themoviedb.org/settings/api) *(required for film search and detail)*
- A [Mistral AI API key](https://console.mistral.ai/) *(required from Sprint 5)*

> The setup script checks that Python, Node.js, Docker, and Docker Compose are available.  
> It also creates the virtual environment, installs project dependencies, creates local `.env` files, starts the PostgreSQL container, runs all Alembic migrations, and seeds the tag reference data.

If Docker is not installed on Ubuntu, you can install it with:
```bash
sudo apt update
sudo apt install ca-certificates curl -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Then log out and log back in before running:
```bash
./setup.sh
```

### One time installation

#### Clone the repository

```bash
git clone https://github.com/FelixBesancon/holbertonschool-CineMood.git
cd holbertonschool-CineMood
```

#### Run the setup script

Run **`setup.sh`** to initialize the project in one command.<br>
This script handles everything for Frontend and Backend initialization:
- Checks Python 3.12+, Node.js 18+, Docker, and Docker Compose are available
- Creates the Python virtual environment in the backend directory
- Installs all backend and frontend dependencies
- Creates your `.env` files from `.env.example` with a generated `SECRET_KEY`
- Starts the PostgreSQL container via Docker
- Runs all Alembic database migrations
- Seeds reference data (mood tags)

```bash
./setup.sh
```

> ⚠️ **Important:** After running setup, open `backend/.env` and replace the placeholder `TMDB_READ_ACCESS_TOKEN` with your real token from [themoviedb.org](https://www.themoviedb.org/settings/api). Film search and detail pages will not work without it.

### Each working session

- **Activate the virtual environment**
```bash
source backend/venv/bin/activate
```

- **Start both servers (frontend + backend)**
```bash
./start.sh
```

The frontend will be available at `http://localhost:5173`  
The API will be available at `http://localhost:8000`  
The API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

### Cleaning the project

From time to time, you can run the clean script to remove generated files and temporary caches:
```bash
./clean.sh
```

This script removes common development artifacts such as:
- Python cache files (`__pycache__`, `.pyc`, `.pyo`)
- pytest cache and coverage reports
- frontend build and cache artifacts (`dist`, `dist-ssr`, `.vite`)
- OS-generated files (`.DS_Store`, `Thumbs.db`)

For a complete reset of the local development environment, use:
```bash
./clean.sh --hard
```

**Caution: hard mode removes reinstallable local files**:
- `backend/venv`
- `frontend/node_modules`
- backend and frontend `.env` / `.env.local` files

> ⚠️ **Note:** Do not run `./clean.sh --hard` while the virtual environment is active.<br>
Run `deactivate` first.

---

## API Overview

> Full API specification is available in the [Stage 3 Technical Documentation](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/develop/docs/Stage%203%20Report%20-%20Technical%20Documentation.pdf).  
> An interactive Swagger UI is available at `http://localhost:8000/docs` when the backend is running.

### Implemented endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create a new user account | ❌ |
| POST | `/auth/login` | Log in and receive a JWT token | ❌ |
| GET | `/tags` | List all available mood tags | ❌ |
| GET | `/films/search` | Search for a film by title (TMDB) | ❌ |
| GET | `/films/{tmdb_id}` | Get film details and user status | ✅ |
| GET | `/history` | Retrieve the user's viewing history | ✅ |
| POST | `/history` | Log a watched film with tags and prestige tier | ✅ |
| DELETE | `/history/{tmdb_id}` | Remove a film from history | ✅ |
| GET | `/watchlist` | Retrieve the user's watchlist | ✅ |
| POST | `/watchlist` | Add a film to the watchlist | ✅ |
| DELETE | `/watchlist/{tmdb_id}` | Remove a film from the watchlist | ✅ |
| POST | `/watchlist/{tmdb_id}/watched` | Mark a watchlist film as watched (atomic move to history) | ✅ |

### Planned endpoints *(not yet implemented)*

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users/me` | Get current user profile | ✅ |
| PATCH | `/users/me` | Update user profile | ✅ |
| POST | `/recommendations` | Get mood-based AI recommendations | ✅ |

> ✅ Requires authentication — a valid JWT token must be included in the `Authorization: Bearer <token>` header.<br>
> ❌ Public endpoint — no authentication required.

---

## Git Workflow

### Branch Strategy

```
main        → stable, production-ready code
develop     → integration branch
feature/*   → one branch per issue, created from develop
fix/*       → bug fixes, created from develop
```

### Step-by-step workflow for each issue

#### Start a new issue

Always start from an up-to-date develop:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/s1-2-frontend-setup
```

#### Work and commit regularly

```bash
# Stage your changes
git add .

# Commit with a conventional message
git commit -m "chore(frontend): initialize React project with Vite"
```

#### Before opening a Pull Request

Sync with develop to catch any changes made in the meantime:

```bash
git fetch origin
git merge origin/develop
# If nano opens for the merge commit message: Ctrl+X then Enter
```

Then push your branch:

```bash
git push origin feature/s1-2-frontend-setup
```

#### Open a Pull Request on GitHub

- Go to your repository on GitHub
- Click **New Pull Request**
- Set `base: develop` ← `compare: feature/s1-2-frontend-setup`
- Add a title and description
- Click **Merge Pull Request**

#### After the merge

Back in your terminal — never merge locally, always pull:

```bash
git checkout develop
git pull origin develop

# Delete the feature branch locally
git branch -d feature/s1-2-frontend-setup

# Delete it on GitHub
git push origin --delete feature/s1-2-frontend-setup
```

### Commit Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

| Type | Usage |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `refactor` | Code change without feature or fix |
| `chore` | Setup, config, dependencies |
| `style` | Formatting, missing semicolons, etc... |

**Examples:**
```bash
feat(auth): add JWT token generation on registration
fix(films): correct TMDB search query encoding
docs(readme): update setup instructions
test(users): add unit tests for validate_email
chore(backend): add alembic migration for users table
```

### Closing Issues via Commits

Each commit that completes an issue should reference it:

```bash
git commit -m "feat(auth): add user registration endpoint (closes #3)"
```

This automatically closes the issue and moves it to `Done` on the GitHub Projects board.

---

## Testing

The backend test suite uses **pytest** with coverage reporting. Use the provided script from the project root:

```bash
./test.sh
```

Or run manually from the `backend/` directory:

```bash
cd backend
source venv/bin/activate

# Run all tests with coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Run a specific test file
pytest tests/test_auth.py -v
```

**Current coverage:** 79 tests across `test_auth.py` and `test_films_and_history.py`.

Target: **minimum 50% coverage** on the backend codebase, focusing on the service layer and critical endpoints.

---

## Documentation

All project documentation is maintained as part of the Holberton portfolio process:

### Portfolio Project Progress Reports

- [Stage 1 - Team Formation, Brainstorming and MVP](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/Stage%201%20Report%20-%20Team%20Formation%2C%20Brainstorming%20and%20MVP.pdf)
  > Solo project definition, brainstorming session (Mind Mapping, SCAMPER, How Might We), idea evaluation using MoSCoW, and final MVP selection with scope, SMART goals, and risk analysis.
- [Stage 2 - Project Planning](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/Stage%202%20Report%20-%20Project%20Planning.pdf)
  > High-level project plan with 5 stages, detailed phase breakdown, summary timeline, SMART objectives recap, and key risk summary.
- [Stage 3 - Technical Documentation](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/Stage%203%20Report%20-%20Technical%20Documentation.pdf)
  > Complete technical blueprint: user stories (MoSCoW), system architecture, class diagram, ER diagram, API specifications (internal and external), React component architecture, UI mockups, sequence diagrams, SCM and QA strategy, and full tech stack justifications.

### Technical Diagrams

- [Architecture Diagrams](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/Architecture.md)
  > High-level overview and detailed component architecture showing how the frontend, backend, database, and external services interact. Includes design patterns (Repository, Facade, REST).
- [Class Diagram](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/ClassDiagram.md)
  > Backend business logic layer: all persistent entities (User, WatchlistEntry, ViewingHistoryEntry), the Film DTO, Tag, Platform, and PrestigeTier enumeration with attributes, methods, and UML relationships.
- [Entity Relationship Diagram](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/ERDiagram.md)
  > PostgreSQL database schema with all tables, columns, primary/foreign keys, and relationship summary. Includes design notes on UUID vs integer IDs and the absence of a local films table.
- [Sequence Diagrams](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/SequenceDiagrams.md)
  > Step-by-step interaction flows for the 5 key use cases: user registration, user login, film search, film logging, and the full mood-based recommendation experience.

### UI Prototype

- [Figma Interactive Prototype](https://www.figma.com/make/0wZvyA1aYW8MHzXm31lNvD/CinéMood-UI-Prototype?fullscreen=1)
  > Navigable mockup covering all main screens: dashboard, authentication, film catalog, mood questionnaire, swipe interface, recommendation results, and user profile.

---

## Roadmap

### MVP (current scope)
- [x] Project planning and technical documentation
- [x] User authentication (Sprint 1)
- [x] Film search and logging with tags (Sprint 2)
- [x] Watchlist, mark-as-watched, and personal dashboard (Sprint 3)
- [ ] Frontend connected to backend API (Sprint 4)
- [ ] Mood questionnaire and AI-powered recommendations via Mistral AI (Sprint 5)

### Future versions
- [ ] Guest mode - full navigation (search, recommendations) without an account, with a sign-up prompt at the end of the recommendation flow to save results
- [ ] French language support
- [ ] Social features (follow users, shared lists)
- [ ] Cinema listings and nearby showtimes
- [ ] Native mobile application
- [ ] Export viewing history

---

## Author

**Félix Besançon**
Holberton School Bordeaux - Bachelor CDA, Year 1
Specialisation: Fullstack Development & Machine Learning

- GitHub: [@FelixBesancon](https://github.com/FelixBesancon)
- LinkedIn: [@FelixBesancon](https://linkedin.com/in/felix-besancon)

---

*End-of-year portfolio project - Holberton School Bordeaux - 2026*
