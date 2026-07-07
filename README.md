# 🎬 CinéMood

> A personal film diary and AI-powered recommendation engine.<br>
> Log what you watch, rate it your way, and get suggestions based on your mood and streaming platforms.

![Status](https://img.shields.io/badge/status-MVP%20complete-brightgreen)
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

🏷️ **The tool lets users rate films with tags that actually mean something** - 50 mood tags seeded in `backend/seeds/seed_tag.py`, each with a short, opinionated description. A few examples:
| Tag | Meaning |
|---|---|
| Hidden Gem | Better than expected and deserves more attention |
| Emotional Damage | You're fine. Totally fine. Definitely not crying |
| Perfect Cast | Everyone feels exactly right in their role |
| Slow Burn | Takes its time, but the payoff is worth it |
| So Stupid It's Good | Dumb in exactly the right way |
| Instant Classic | Feels like it will still matter years from now |

Optionally assign a prestige tier: **Platinum / Gold / Silver / Bronze / Coal / Trash**

### Mood-Based Recommendation Engine

🎭 **The tool provides personalized AI-powered recommendations through a comprehensive user experience**
- Answer a short mood questionnaire (audience, mood, desire, preferences, deal breakers, free-text note)
- Swipe through 6 AI-selected film cards (right = interested, left = not for me)
- Receive a curated shortlist: a perfect match, up to 5 suggestions, and picks from your watchlist
- Filtered by the streaming platforms you actually subscribe to
- Powered by Mistral AI (`mistral-medium-latest`) with TMDB enrichment

### Personal Dashboard
📋 **The tool allows users to keep track of the movies they've watched and the emotional impact they had on them at the time of viewing**
- View your full watching history
- Browse your watchlist
- See your tags and tiers at a glance
- Configure the streaming platforms you subscribe to from your profile (16 platforms seeded from TMDB, see `backend/seeds/seed_platform.py`) - film detail pages show casting and highlight the platforms a film is available on that you actually have

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
| AI recommendations | Mistral AI (`mistral-medium-latest`) | Two-step mood-based LLM recommendation engine |
| Testing | pytest + pytest-cov | Unit and integration tests |
| Version control | Git + GitHub | Source control and project history |

---

## Architecture

The application follows a classic three-tier architecture separating the presentation layer, business logic, and data layer.<br>
External services (TMDB and Mistral AI) are called exclusively by the backend — never directly by the frontend.

→ [View Architecture Diagrams](docs/diagrams/Architecture.md)

---

## Database

CinéMood uses PostgreSQL as its relational database. A core subset of film metadata (title, poster, year, director, synopsis, genres, runtime) 
is cached locally at save time in watchlist and history entries. Full film details (cast, live streaming availability) 
are fetched from TMDB on demand.

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
│   │   └── RevisedDiagrams.md
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
│   │   │   └── logos/                  ← logo/favicon SVG variants
│   │   ├── components/
│   │   │   ├── ui/                     ← shadcn/ui primitives
│   │   │   ├── pages/                  ← one file per route
│   │   │   │   ├── auth-page.tsx
│   │   │   │   ├── dashboard-page.tsx
│   │   │   │   ├── search-page.tsx
│   │   │   │   ├── history-page.tsx
│   │   │   │   ├── watchlist-page.tsx
│   │   │   │   ├── film-detail-page.tsx
│   │   │   │   ├── recommendation-page.tsx  ← mood questionnaire (step 1)
│   │   │   │   ├── swipe-page.tsx           ← swipe deck (step 2)
│   │   │   │   ├── results-page.tsx         ← recommendation results (step 3)
│   │   │   │   └── profile-page.tsx
│   │   │   ├── cinemood-app.tsx         ← root component + routing
│   │   │   ├── app-layout.tsx           ← navbar + page shell
│   │   │   ├── film-card.tsx            ← PosterFrame, FilmCard, TagChip
│   │   │   ├── loading-screen.tsx       ← full-page loader shown during AI calls
│   │   │   ├── log-film-dialog.tsx      ← tags + prestige + note modal
│   │   │   ├── confirm-dialog.tsx
│   │   │   └── logo.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx          ← JWT auth, session persistence
│   │   │   └── LibraryContext.tsx       ← history, watchlist, mutations
│   │   ├── services/
│   │   │   ├── api.ts                   ← Axios instance + JWT interceptors
│   │   │   └── recommendations.ts       ← discover() and refine() API calls
│   │   ├── types/
│   │   │   └── api.ts                   ← TypeScript interfaces (Film, SwipeCard, FilmRecommendation, …)
│   │   └── lib/
│   │       ├── questionnaire.ts         ← MOOD_QUESTIONS (questionnaire steps config)
│   │       ├── constants.ts             ← PRESTIGE_RECORD, PRESTIGE_TIERS, PRESTIGE_RANK
│   │       └── utils.ts                 ← cn(), formatRuntime()
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
    │   │   ├── tmdb_client.py           ← TMDB API facade
    │   │   └── mistral_ai_client.py     ← Mistral AI facade (chat_mistral_json)
    │   ├── models/
    │   │   ├── user.py
    │   │   ├── viewing_history_entry.py
    │   │   ├── watchlist_entry.py
    │   │   ├── tag.py
    │   │   ├── platform.py              ← streaming platform reference data
    │   │   └── prestige_tier.py
    │   ├── schemas/
    │   │   ├── user.py
    │   │   ├── film.py
    │   │   ├── platform.py
    │   │   ├── recommendation.py        ← DiscoverRequest/Response, RefineRequest, RecommendationResponse
    │   │   ├── viewing_history.py
    │   │   ├── watchlist.py
    │   │   └── validate.py
    │   ├── repositories/
    │   │   ├── user_repository.py
    │   │   ├── viewing_history_repository.py
    │   │   └── watchlist_repository.py
    │   ├── services/
    │   │   ├── auth_service.py
    │   │   ├── user_service.py
    │   │   ├── film_service.py
    │   │   ├── _tmdb_metadata.py        ← shared TMDB→entry metadata mapping (history/watchlist caching)
    │   │   ├── library_service.py       ← cross-domain refresh of cached TMDB metadata
    │   │   ├── recommendation_service.py ← two-step AI recommendation flow
    │   │   ├── viewing_history_service.py
    │   │   └── watchlist_service.py
    │   └── routes/
    │       ├── auth.py
    │       ├── film.py
    │       ├── platform.py              ← GET /platforms
    │       ├── library.py               ← POST /library/refresh
    │       ├── recommendations.py        ← POST /recommendations/discover and /refine
    │       ├── tag.py
    │       ├── users.py
    │       ├── viewing_history.py
    │       └── watchlist.py
    ├── seeds/
    │   ├── seed_tag.py
    │   └── seed_platform.py
    ├── tests/
    │   ├── conftest.py
    │   ├── test_auth.py
    │   ├── test_films_and_history.py
    │   ├── test_recommendations.py      ← auth + validation tests for recommendation routes
    │   └── test_watchlist.py
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
- A [Mistral AI API key](https://console.mistral.ai/) *(required for the recommendation engine)*

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

> ⚠️ **Important:** After running setup, open `backend/.env` and replace the placeholder values:
> - `TMDB_READ_ACCESS_TOKEN` — from [themoviedb.org](https://www.themoviedb.org/settings/api)
> - `MISTRAL_AI_API_KEY` — from [console.mistral.ai](https://console.mistral.ai/)
>
> Film search and the recommendation engine will not work without these keys.

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

> An interactive Swagger UI is available at `http://localhost:8000/docs` when the backend is running.

### Implemented endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create a new user account | ❌ |
| POST | `/auth/login` | Log in and receive a JWT token | ❌ |
| GET | `/tags` | List all available mood tags | ❌ |
| GET | `/films/search` | Search for a film by title (TMDB) | ❌ |
| GET | `/films/{tmdb_id}` | Get film details (incl. cast and streaming platforms) and user status | ✅ |
| GET | `/platforms` | List all available streaming platforms | ❌ |
| GET | `/users/me` | Get current user profile | ✅ |
| PATCH | `/users/me` | Update user profile (first/last name, age) | ✅ |
| GET | `/users/me/platforms` | Get the current user's selected streaming platforms | ✅ |
| PUT | `/users/me/platforms` | Replace the current user's selected streaming platforms | ✅ |
| GET | `/history` | Retrieve the user's viewing history | ✅ |
| POST | `/history` | Log a watched film with tags and prestige tier | ✅ |
| PATCH | `/history/{tmdb_id}` | Update tags, prestige tier, or note on an existing entry | ✅ |
| DELETE | `/history/{tmdb_id}` | Remove a film from history | ✅ |
| GET | `/watchlist` | Retrieve the user's watchlist | ✅ |
| POST | `/watchlist` | Add a film to the watchlist | ✅ |
| DELETE | `/watchlist/{tmdb_id}` | Remove a film from the watchlist | ✅ |
| POST | `/watchlist/{tmdb_id}/watched` | Mark a watchlist film as watched (atomic move to history) | ✅ |
| POST | `/library/refresh` | Re-sync cached TMDB metadata for all of the user's history and watchlist entries | ✅ |
| POST | `/recommendations/discover` | Generate 6 swipe cards from quiz answers (Mistral + TMDB) | ✅ |
| POST | `/recommendations/refine` | Produce final picks from quiz answers + swipe signals | ✅ |

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

**Current test files:**

| File | Coverage |
|---|---|
| `test_auth.py` | Registration, login, JWT validation edge cases |
| `test_films_and_history.py` | Tags, film search, film detail, viewing history CRUD |
| `test_watchlist.py` | Watchlist CRUD, mark-as-watched, platform caching |
| `test_recommendations.py` | Auth enforcement and input validation for recommendation routes |

Target: **minimum 50% coverage** on the backend codebase, focusing on the service layer and critical endpoints.

> The recommendation happy path (real Mistral + TMDB calls) is covered by a manual integration script and is intentionally excluded from the automated suite to avoid network dependency and API costs in CI.

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

#### [Architecture Diagrams](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/Architecture.md)
  > High-level overview and detailed component architecture showing how the frontend, backend, database, and external services interact. Includes design patterns (Repository, Facade, REST).
<details>
  <summary>Overview: High-Level Architecture</summary>

  ```mermaid
  architecture-beta
      group frontend(cloud)[Frontend React Tailwind]
          service react(server)[React Components] in frontend
          service router(server)[React Router] in frontend
  
      group backend(cloud)[Backend FastAPI]
          service api(server)[FastAPI REST API] in backend
  
      group database(cloud)[Database]
          service db(database)[PostgreSQL] in database
  
      group external(cloud)[External Services]
          service tmdb(internet)[TMDB API] in external
          service mistral(internet)[Mistral AI] in external
  
      react:R --> L:router
      router:R --> L:api
      api{group}:B --> T:db{group}
      api{group}:R --> L:tmdb
      api:R --> L:mistral
  ```

  | From | To | Description |
  |---|---|---|
  | React Components | React Router | User actions trigger client-side navigation |
  | React Router | FastAPI REST API | HTTP/HTTPS requests with JSON payloads |
  | FastAPI REST API | PostgreSQL | SQL queries for all persistent data (users, films, watchlist, tags) |
  | FastAPI REST API | TMDB API | Fetches film metadata (title, poster, synopsis, cast) and streaming availability |
  | FastAPI REST API | Mistral AI | Sends mood and viewing history as a prompt, receives film recommendations in JSON |
</details>
<details>
  <summary>Overview: High-Level Architecture Overview</summary>

  ```mermaid
  flowchart TD
      User(["User\n(Browser)"])
  
      subgraph Frontend["Frontend: React + Tailwind CSS"]
          React["React Components"]
          Router["React Router"]
      end
  
      Calls(["REST calls"])
  
      subgraph Backend["Backend: Python + FastAPI"]
          subgraph Routes["API Routes"]
              AuthR["/auth/*"]
              FilmR["/films/*"]
              UserR["/users/*"]
              RecoR["/recommendations/*"]
          end
          subgraph Services["Services"]
              AuthS["Auth Service (JWT)"]
              FilmS["Film Service"]
              UserS["User Service"]
              RecoF["Recommendation Facade"]
          end
          subgraph Repos["Repositories"]
              UserRepo["User\nRepository"]
              ViewingHistoryRepo["Viewing history\nRepository"]
              WatchlistRepo["Watchlist\nRepository"]
          end
      end
  
      subgraph Database["Database"]
          DB[("PostgreSQL")]
      end
  
      subgraph External["External Services"]
          TMDB["TMDB API"]
          Mistral["Mistral AI"]
      end
  
      User -->|"Uses app"| Frontend
      React --> Router
      Router --- Calls
      Calls -->|"HTTP/HTTPS – JSON"| AuthR & FilmR & UserR & RecoR
  
      AuthR --> AuthS
      FilmR --> FilmS
      UserR --> UserS
      RecoR --> RecoF
  
      AuthS & UserS --> UserRepo
      FilmS --> ViewingHistoryRepo & WatchlistRepo
      FilmS -->|"Film metadata"| TMDB
      RecoF -->|"Streaming availability"| TMDB
      RecoF -->|"Mood-based prompt"| Mistral
  
      UserRepo & ViewingHistoryRepo & WatchlistRepo -->|"SQL queries"| DB
  
      TMDB ~~~ Mistral
  ```
  
  | From | To | Description |
  |---|---|---|
  | User | React Components | The user interacts with the app through the browser |
  | React Components | React Router | Navigation between pages is handled client-side without full page reloads |
  | React Router | API Routes | All backend communication goes through HTTP/HTTPS calls with JSON payloads |
  | /auth/* | Auth Service | Handles registration, login, and JWT token generation and validation |
  | /films/* | Film Service | Handles film search, logging, tagging, and watchlist management |
  | /users/* | User Service | Handles user profile and streaming platform preferences |
  | /recommendations/* | Recommendation Facade | Orchestrates the full recommendation flow (mood + swipe + LLM) |
  | Auth Service | User Repository | Reads and writes user authentication data |
  | Film Service | Viewing History Repository | Reads and writes film logging and tag data |
  | Film Service | Watchlist Repository | Reads and writes watchlist entries |
  | Film Service | TMDB API | Fetches film metadata (poster, synopsis, cast, genres, runtime) and streaming availability |
  | Recommendation Facade | TMDB API | Fetches streaming availability for recommended films |
  | Recommendation Facade | Mistral AI | Sends a structured prompt with mood and viewing history, receives film suggestions in JSON |
  | All Repositories | PostgreSQL | All persistent data is stored and retrieved via SQL queries |
</details>

#### [Class Diagram](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/ClassDiagram.md)
  > Backend business logic layer: all persistent entities (User, WatchlistEntry, ViewingHistoryEntry), the Film DTO, Tag, Platform, and PrestigeTier enumeration with attributes, methods, and UML relationships.
<details>
  <summary>Overview: Class Diagram</summary>

  ```mermaid
  classDiagram
  direction LR
  
  class BaseModel {
      <<abstract>>
      #id: UUID4
      #created_at: datetime
      #updated_at: datetime
  }
  
  class User {
      <<entity>>
      -first_name: str
      -last_name: str
      +username: str
      -email: str
      -hashed_password: str
      -is_admin: bool = False
      +age: int
      +verify_password()
      +get_watchlist()
      +get_viewing_history()
      +get_platforms()
  }
  
  class WatchlistEntry {
      <<entity>>
      -user_id: UUID
      +tmdb_id: int
      +add()
      +remove()
      +mark_as_watched()
      +get_film_details() Film
  }
  
  class Film {
      <<DTO>>
      +tmdb_id: int
      +title: str
      +year: int
      +genres: list
      +poster_url: str
      +synopsis: str
      +director: str
      +cast: list
      +runtime: int
      +streaming_platforms: list
  }
  
  class ViewingHistoryEntry {
      <<entity>>
      -user_id: UUID
      +tmdb_id: int
      +tags: list
      +prestige_tier: PrestigeTier
      +personal_note: str
      +add_tag()
      +remove_tag()
      +update_prestige_tier()
      +get_film_details() Film
  }
  
  class Tag {
      <<entity>>
      +id: int
      +name: str
      +description: str
  }
  
  class Platform {
      <<entity>>
      +id: int
      +name: str
      +logo_url: str
  }
  
  class PrestigeTier {
      <<enumeration>>
      PLATINUM
      GOLD
      SILVER
      BRONZE
      TRASH
  }
  
  BaseModel <|-- User : extends
  User "1" --> "0..*" WatchlistEntry : owns
  
  BaseModel <|-- ViewingHistoryEntry : extends
  User "1" --> "0..*" ViewingHistoryEntry : owns
  ViewingHistoryEntry --> PrestigeTier : uses
  ViewingHistoryEntry ..> Film : fetches via TMDB
  
  BaseModel <|-- WatchlistEntry : extends
  WatchlistEntry ..> Film : fetches via TMDB
  WatchlistEntry ..> ViewingHistoryEntry : mark_as_watched
  
  User "0..*" <--> "0..*" Platform : subscribes to
  ViewingHistoryEntry "0..*" <--> "0..*" Tag : labeled with
  ```
  
  | Relationship | Type | Description |
  |---|---|---|
  | BaseModel → User / WatchlistEntry / ViewingHistoryEntry | Inheritance | Shared attributes (`id`, `created_at`, `updated_at`) and CRUD methods (`save`, `delete`) |
  | User → WatchlistEntry | One-to-many | A user owns zero or more watchlist entries |
  | User → ViewingHistoryEntry | One-to-many | A user owns zero or more viewing history entries |
  | User ↔ Platform | Many-to-many | A user subscribes to multiple platforms; each platform can have many users. Managed via `user_platforms` join table. |
  | ViewingHistoryEntry ↔ Tag | Many-to-many | An entry can have multiple tags; each tag can be used across many entries. Managed via `viewing_history_tags` join table. |
  | ViewingHistoryEntry → PrestigeTier | Association | Each entry optionally uses one value from the PrestigeTier enumeration |
  | WatchlistEntry → Film | Dependency (DTO) | Fetches film data from TMDB on demand - not a database relationship |
  | ViewingHistoryEntry → Film | Dependency (DTO) | Fetches film data from TMDB on demand - not a database relationship |
  | WatchlistEntry → ViewingHistoryEntry | Dependency | `mark_as_watched()` creates a ViewingHistoryEntry and deletes the WatchlistEntry |
</details>

#### [Entity Relationship Diagram](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/ERDiagram.md)
  > PostgreSQL database schema with all tables, columns, primary/foreign keys, and relationship summary. Includes design notes on UUID vs integer IDs and the absence of a local films table.
<details>
  <summary>Overview: High-Level Architecture Overview</summary>

  ```mermaid
  erDiagram
      users {
          uuid id PK
          varchar first_name
          varchar last_name
          varchar username
          varchar email UK
          varchar hashed_password
          boolean is_admin
          integer age
          timestamptz created_at
          timestamptz updated_at
      }
  
      watchlist_entries {
          uuid id PK
          uuid user_id FK
          integer tmdb_id
          timestamptz created_at
          timestamptz updated_at
      }
  
      viewing_history_entries {
          uuid        id               PK
          uuid        user_id          FK
          integer     tmdb_id
          prestige_tier prestige_tier     "nullable"
          text        personal_note    "nullable"
          timestamptz created_at
          timestamptz updated_at
      }
  
      tags {
          integer id PK
          varchar name UK
          text description
      }
  
      platforms {
          integer id PK
          varchar name UK
          text logo_url
      }
  
      viewing_history_tags {
          uuid viewing_history_entry_id FK
          integer tag_id FK
      }
  
      user_platforms {
          uuid user_id FK
          integer platform_id FK
      }
  
      users ||--o{ watchlist_entries : owns
      users ||--o{ viewing_history_entries : owns
  
      viewing_history_entries ||--o{ viewing_history_tags : has
      tags ||--o{ viewing_history_tags : labels
  
      users ||--o{ user_platforms : subscribes
      platforms ||--o{ user_platforms : selected_by
  ```

  | Relationship | Entity A | Entity B | Type | Join table |
  |---|---|---|---|---|
  | A user owns watchlist entries | `users` | `watchlist_entries` | One-to-many | - |
  | A user owns viewing history entries | `users` | `viewing_history_entries` | One-to-many | - |
  | A user subscribes to platforms | `users` | `platforms` | Many-to-many | `user_platforms` |
  | A viewing history entry is labeled with tags | `viewing_history_entries` | `tags` | Many-to-many | `viewing_history_tags` |
</details>

#### [Sequence Diagrams](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/SequenceDiagrams.md)
  > Step-by-step interaction flows for the 5 key use cases: user registration, user login, film search, film logging, and the full mood-based recommendation experience.
<details>
  <summary>Overview: User Registration</summary>

  **Actors:**
  
  - `User` - user interacting through the React frontend
  - `Backend` - the `/auth/register` route of the `FastAPI`
  - `Business Logic` - the  User Service of the `FastAPI`
  - `Database` - the PostgreSQL database
  
  **Key steps:**
  
  1. The user submits the registration form via the frontend
  2. The frontend sends a POST request to /auth/register
  3. The backend routes the request to the User Service
  4. The User Service validates the input data (name, email, password format)
  5. The User Service hashes the password using bcrypt
  6. The User Service inserts the new user record into the database
  7. If the email already exists, a 409 Conflict is returned
  8. If the insert fails, a 500 Internal Server Error is returned
  9. If successful, a JWT token is generated and returned with a 201 Created response
  10. The frontend redirects the authenticated user to the dashboard
  
  ```mermaid
  sequenceDiagram
      actor User as User (Frontend)
      participant Back as Backend<br>(FastAPI<br>/auth/register)
      participant BL as Business Logic<br>(User Service)
      participant DB as PostgreSQL<br>Database
  
      User->>Back: Register account
      Note over User,Back: Fills in registration form<br>first name, last name,<br>email, password
  
      Back->>BL: Validate and process registration
      Note over Back,BL: POST /auth/register<br>{first_name, last_name,<br>email, password}
  
      BL->>BL: Validate user data
      Note over BL: validate_name()<br>validate_email()<br>validate_password()
  
      alt Invalid input data
          BL-->>Back: Reject registration
          Note over BL,Back: 400 Bad Request<br>Validation error details
  
          Back-->>User: Display error message
          Note over Back,User: Invalid name, email,<br>or password format
  
      else Valid input data
          BL->>BL: Hash password
          Note over BL: bcrypt hash<br>Password is never stored<br>in plain text
  
          BL->>DB: Create user
          Note over BL,DB: INSERT INTO users<br>(first_name, last_name,<br>email, hashed_password, ...)
          DB->>DB: Execute INSERT
  
          alt Email already exists
              DB-->>BL: Reject insert
              Note over DB,BL: Unique constraint violation<br>on users.email
  
              BL-->>Back: Email conflict
              Note over BL,Back: 409 Conflict<br>"email already in use"
  
              Back-->>User: Display error message
              Note over Back,User: Account cannot be created<br>with this email address
  
          else Insert fails
              DB-->>BL: Database error
              Note over DB,BL: Unexpected database<br>or server error
  
              BL-->>Back: Server error
              Note over BL,Back: 500 Internal Server Error
  
              Back-->>User: Display generic error
              Note over Back,User: Registration failed<br>Please try again later
  
          else Insert successful
              DB-->>BL: User created
              Note over DB,BL: New user record<br>returned from database
  
              BL->>BL: Generate JWT
              Note over BL: Create access token<br>linked to user_id
  
              BL-->>Back: Return success response
              Note over BL,Back: 201 Created<br>{jwt_token, user_id}
  
              Back-->>User: Redirect to dashboard
              Note over Back,User: User is authenticated<br>and redirected
          end
      end
  ```
</details>
<details>
  <summary>Overview: User Login</summary>

  **Actors:**
  
  - `User` - user interacting through the React frontend
  - `Backend` - the `/auth/login` route of the `FastAPI`
  - `Business Logic` - the User Service of the `FastAPI`
  - `Database` - the PostgreSQL database
  
  **Key steps:**
  
  1. The user submits their email and password via the frontend
  2. The frontend sends a POST request to /auth/login
  3. The backend routes the request to the User Service
  4. The User Service queries the database for the user by email
  5. If the user is not found, a 401 Unauthorized is returned
  6. The User Service verifies the password against the stored bcrypt hash
  7. If the password is incorrect, a 401 Unauthorized is returned
  8. If valid, a JWT token is generated and returned with a 200 OK response
  9. The frontend stores the token and redirects to the dashboard
  
  ```mermaid
  sequenceDiagram
      actor User as User (Frontend)
      participant Back as Backend<br>(FastAPI<br>/auth/login)
      participant BL as Business Logic<br>(User Service)
      participant DB as PostgreSQL<br>Database
  
      User->>Back: Log in
      Note over User,Back: Submits login form<br>email, password
  
      Back->>BL: Route login request
      Note over Back,BL: POST /auth/login<br>{email, password}
  
      BL->>DB: Fetch user by email
      Note over BL,DB: SELECT * FROM users<br>WHERE email = ?
  
      DB->>DB: Execute SELECT
  
      alt User not found
          DB-->>BL: Empty result
          Note over DB,BL: No user matching<br>this email address
          BL-->>Back: User not found
          Note over BL,Back: 401 Unauthorized<br>"invalid credentials"
          Back-->>User: Display error message
          Note over Back,User: Intentionally vague to prevent<br>email enumeration attacks
      else User found
          DB-->>BL: User record
          Note over DB,BL: Returns user including<br>hashed_password
  
          BL->>BL: Verify password
          Note over BL: verify_password()<br>Compare input with<br>bcrypt hash
  
          alt Password incorrect
              BL-->>Back: Invalid password
              Note over BL,Back: 401 Unauthorized<br>"invalid credentials"
              Back-->>User: Display error message
              Note over Back,User: Same message as user not found<br>to prevent enumeration
          else Password correct
              BL->>BL: Generate JWT
              Note over BL: Create access token<br>linked to user_id
              BL-->>Back: Return success response
              Note over BL,Back: 200 OK<br>{jwt_token, user_id}
              Back-->>User: Return success
              Note over Back,User: User is authenticated<br>and redirected to dashboard
          end
      end
  ```
</details>
<details>
  <summary>Overview: Searching for a Movie</summary>

  **Actors:**
  
  - `User` - user interacting through the React frontend
  - `Backend` - the `/films/search` route of the `FastAPI`
  - `Business Logic` - the Film Service of the `FastAPI`
  - `API` - the TMDB API
  
  **Key steps:**
  
  0. The user navigates through the app to the movie search page
  1. The user types a movie title in the search bar and confirms
  2. The frontend sends a GET request to `/films/search?query=...`
  3. The backend routes the request to the Film Service
  4. The Film Service calls the TMDB search endpoint
  5. TMDB returns a list of matching films (multilingual search by default)
  6. The backend returns the results to the frontend
  7. The user selects a film from the results
  
  ```mermaid
  sequenceDiagram
      actor User as User (Frontend)
      participant Back as Backend<br>(FastAPI<br>/films/search)
      participant BL as Business Logic<br>(Film Service)
      participant API as TMDB API
  
      User->>Back: Search for a movie
      Note over User,Back: Submits search query<br>movie title
  
      Back->>BL: Route search request
      Note over Back,BL: GET /films/search<br>?query=title
  
      BL->>API: Search movie catalog
      Note over BL,API: GET /search/movie<br>?query=title
  
      alt TMDB unavailable
          API-->>BL: Error or timeout
          Note over API,BL: External service<br>unreachable
          BL-->>Back: Service error
          Note over BL,Back: 503 Service Unavailable
          Back-->>User: Display error message
          Note over Back,User: Movie search is temporarily<br>unavailable
      else No results found
          API-->>BL: Empty results list
          Note over API,BL: No movie matches<br>the search query
          BL-->>Back: Empty response
          Note over BL,Back: 200 OK<br>{results: []}
          Back-->>User: Display no results message
          Note over Back,User: No movie found<br>for this search
      else Results found
          API-->>BL: List of matching movies
          Note over API,BL: tmdb_id, title, year,<br>poster_url for each result
          BL-->>Back: Return search results
          Note over BL,Back: 200 OK<br>{results: [{tmdb_id, title,<br>year, poster_url}]}
          Back-->>User: Display search results
          Note over Back,User: User sees matching<br>movie cards
      end
  ```
</details>
<details>
  <summary>Overview: Log a Film</summary>

  **Actors:**
  
  - `User` - user interacting through the React frontend
  - `Backend` - the `/films/*` routes of the `FastAPI`
  - `Business Logic - Film Service` - the Film Service of the `FastAPI`
  - `Business Logic - User Service` - the User Service of the `FastAPI`
  - `API` - the TMDB API
  - `Database` - the PostgreSQL database
  
  **Key steps:**
  
  0. The user navigates through the app to a film's details page (from search results)
  1. The backend fetches full film details from TMDB
  2. The backend checks if the film is already in the user's viewing history or watchlist
  3. The frontend displays the film details and adapts the action buttons accordingly
  4. The user clicks "Log this film" and selects tags
  5. The backend creates a viewing history entry and links the selected tags
  6. A `201 Created` response confirms the film has been logged
  
  ```mermaid
  sequenceDiagram
      actor User as User (Frontend)
      participant Back as Backend<br>(FastAPI /films)
      participant BLF as Business Logic<br>(Film Service)
      participant BLU as Business Logic<br>(User Service)
      participant API as TMDB API
      participant DB as PostgreSQL<br>Database
  
      User->>Back: Open film details page
      Note over User,Back: Navigates from search results<br>GET /films/{tmdb_id}
  
      Back->>BLF: Fetch film details
      Note over Back,BLF: tmdb_id from URL
  
      BLF->>API: Get full film data
      Note over BLF,API: GET /movie/{tmdb_id}<br>?append_to_response=credits
  
      API-->>BLF: Film details
      Note over API,BLF: title, synopsis, cast,<br>genres, runtime, poster
  
      BLF->>BLU: Check film status for user
      Note over BLF,BLU: Is this film already in<br>viewing history or watchlist?
  
      BLU->>DB: Query user film status
      Note over BLU,DB: SELECT FROM viewing_history_entries<br>AND watchlist_entries<br>WHERE user_id = ? AND tmdb_id = ?
  
      DB-->>BLU: Film status
      Note over DB,BLU: {in_viewing_history: bool,<br>in_watchlist: bool}
  
      BLU-->>BLF: Return status
      BLF-->>Back: Film details + status
      Back-->>User: Display film page
      Note over Back,User: Film details displayed
      Note over DB,User: Buttons adapt to film status:<br>"Log this film" or "Remove from history"<br>"Add to watchlist" or "Remove from watchlist"
  
      alt User clicks "Log this film"
          User->>Back: Log film with tags
          Note over User,Back: POST /films/log<br>{tmdb_id, tag_ids[]}
  
          Back->>BLF: Create viewing history entry
          BLF->>DB: Insert entry
          Note over BLF,DB: INSERT INTO viewing_history_entries<br>(user_id, tmdb_id, ...)
  
          DB->>DB: Execute INSERT
  
          alt Insert fails
              DB-->>BLF: Database error
              BLF-->>Back: Server error
              Note over BLF,Back: 500 Internal Server Error
              Back-->>User: Display error message
  
          else Insert successful
              DB-->>BLF: Entry created
              BLF->>DB: Link selected tags
              Note over BLF,DB: INSERT INTO viewing_history_tags<br>(entry_id, tag_id) for each tag
              DB-->>BLF: Tags linked
              BLF-->>Back: Success
              Note over BLF,Back: 201 Created<br>{entry_id}
              Back-->>User: Confirm film logged
              Note over Back,User: Film added to viewing history<br>Button switches to "Remove from history"
          end
  
      else User clicks "Remove from history"
          User->>Back: Remove film from history
          Note over User,Back: DELETE /films/log/{entry_id}
  
          Back->>BLF: Delete viewing history entry
          BLF->>DB: Delete entry
          Note over BLF,DB: DELETE FROM viewing_history_entries<br>WHERE id = entry_id<br>CASCADE removes linked tags
  
          DB-->>BLF: Entry deleted
          BLF-->>Back: Success
          Note over BLF,Back: 200 OK
          Back-->>User: Display confirmation removal message
          Note over Back,User: Film removed from history<br>Button switches back to "Log this film"
      end
  ```
</details>
<details>
  <summary>Overview: Film Recommendation</summary>

  **Actors:**
  
  - `User` - user interacting through the React frontend
  - `Backend` - the `/recommendation/*` routes of the `FastAPI`
  - `Business Logic - Recommendation Facade` - the Recommendation Facade of the `FastAPI`
  - `Business Logic - User Service` - the User Service of the `FastAPI`
  - `API` - the TMDB API
  - `LLM` - the Mistral AI API
  - `Database` - the PostgreSQL database
  
  **Key steps:**
  
  0. The user navigates from the home screen to the Recommendation experience
  1. The user starts the recommendation experience
  2. The user completes a mood questionnaire (handled entirely on the frontend)
  3. The user swipes through film cards (right = interested, left = not interested)
  4. The user optionally adds a free-text prompt before final submission
  5. The backend retrieves the user's viewing history and platform preferences
  6. The backend sends a structured prompt to the LLM
  7. The LLM returns film suggestions
  8. The backend enriches the suggestions with TMDB data and streaming availability
  9. The frontend displays the final recommendation list
  
  ```mermaid
  sequenceDiagram
      actor User as User (Frontend)
      participant Back as Backend<br>(FastAPI<br>/recommendations)
      participant BLR as Business Logic<br>(Recommendation Facade)
      participant BLU as Business Logic<br>(User Service)
      participant DB as PostgreSQL<br>Database
      participant LLM as Mistral AI
      participant API as TMDB API
  
      User->>Back: Start recommendation experience
  
      Note over User: Mood questionnaire<br>(handled on frontend)
      Note over User: Film card swiping session<br>(swipe data held in memory)
      Note over User: Optional free-text prompt<br>("I want something like...")
  
      User->>Back: Submit recommendation request
      Note over User,Back: POST /recommendations/start<br>{mood, swipe_results[], optional_prompt}
  
      Back->>BLR: Process recommendation request
      BLR->>BLU: Fetch user context
      BLU->>DB: Get viewing history + platform preferences
      Note over BLU,DB: SELECT viewing_history + user_platforms<br>WHERE user_id = ?
      DB-->>BLU: User data
      BLU-->>BLR: Viewing history + platforms
  
      BLR->>BLR: Build structured prompt
      Note over BLR: Combines mood, swipe results,<br>optional prompt, history,<br>and platform preferences
  
      BLR->>LLM: Send prompt
      Note over BLR,LLM: POST to Mistral API<br>Structured JSON output requested
  
      alt LLM unavailable
          LLM-->>BLR: Error or timeout
          BLR-->>Back: Service error
          Note over BLR,Back: 503 Service Unavailable
          Back-->>User: Display error message
          Note over Back,User: Recommendation service<br>temporarily unavailable
      else LLM responds
          LLM-->>BLR: Film suggestions
          Note over LLM,BLR: [{tmdb_id, title, reason}]
  
          BLR->>API: Fetch film details + streaming availability
          Note over BLR,API: GET /movie/{tmdb_id}<br>GET /movie/{tmdb_id}/watch/providers<br>for each suggested film
  
          API-->>BLR: Enriched film data
          BLR->>BLR: Filter by user platform preferences
          BLR-->>Back: Final recommendations
          Note over BLR,Back: 200 OK<br>[{film, platform, reason}]
  
          Back-->>User: Display recommendation list
          Note over Back,User: Curated film suggestions<br>with streaming availability
  
          opt User adds film to watchlist
              User->>Back: Add to watchlist
              Note over User,Back: POST /films/watchlist<br>{tmdb_id}
              Back->>DB: INSERT INTO watchlist_entries
              DB-->>Back: 201 Created
              Back-->>User: Confirm film added
          end
      end
  ```
</details>

> **All of the preceding diagrams were created before development began, so they no longer reflect the current state of the project; however, they are being retained to preserve documentation of the project's evolution.**

#### [Revised Diagrams](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/RevisedDiagrams.md)
  > Includes architecture, class, and database diagrams that are up to date with the project at the time of deployment
<details>
  <summary>Overview: Revised High-Level Architecture Diagram</summary>

  ```mermaid
  architecture-beta
      group frontend(cloud)[Frontend React Tailwind]
          service react(server)[React Components] in frontend
          service router(server)[React Router] in frontend
  
      group backend(cloud)[Backend FastAPI]
          service api(server)[FastAPI REST API] in backend
  
      group database(cloud)[Database]
          service db(database)[PostgreSQL] in database
  
      group external(cloud)[External Services]
          service tmdb(internet)[TMDB API] in external
          service mistral(internet)[Mistral AI] in external
  
      react:R --> L:router
      router:R --> L:api
      api{group}:B --> T:db{group}
      api{group}:R --> L:tmdb
      api:R --> L:mistral
  ```
  
  | From | To | Description |
  |---|---|---|
  | React Components | React Router | User actions trigger client-side navigation |
  | React Router | FastAPI REST API | HTTP/HTTPS requests with JSON payloads |
  | FastAPI REST API | PostgreSQL | SQL queries for all persistent data (users, watchlist, history, tags, platforms) |
  | FastAPI REST API | TMDB API | Fetches film metadata (title, poster, synopsis, cast, streaming availability) and resolves AI suggestions |
  | FastAPI REST API | Mistral AI | Sends mood context and viewing history as a structured prompt, receives film recommendations in JSON |
</details>
<details>
  <summary>Overview: Revised Detailed Component Architecture</summary>

  ```mermaid
  flowchart TD
      User(["User\n(Browser)"])
  
      subgraph Frontend["Frontend: React + Tailwind CSS"]
          React["React Components"]
          Router["React Router"]
      end
  
      Calls(["REST calls"])
  
      subgraph Backend["Backend: Python + FastAPI"]
          subgraph Routes["API Routes"]
              AuthR["/auth/*"]
              FilmR["/films/*"]
              UserR["/users/*"]
              RecoR["/recommendations/*"]
          end
          subgraph Services["Services"]
              AuthS["Auth Service (JWT)"]
              FilmS["Film Service"]
              UserS["User Service"]
              RecoF["Recommendation Facade"]
          end
          subgraph Repos["Repositories"]
              UserRepo["User\nRepository"]
              ViewingHistoryRepo["Viewing History\nRepository"]
              WatchlistRepo["Watchlist\nRepository"]
          end
      end
  
      subgraph Database["Database"]
          DB[("PostgreSQL")]
      end
  
      subgraph External["External Services"]
          TMDB["TMDB API"]
          Mistral["Mistral AI"]
      end
  
      User -->|"Uses app"| Frontend
      React --> Router
      Router --- Calls
      Calls -->|"HTTP/HTTPS – JSON"| AuthR & FilmR & UserR & RecoR
  
      AuthR --> AuthS
      FilmR --> FilmS
      UserR --> UserS
      RecoR --> RecoF
  
      AuthS & UserS --> UserRepo
      FilmS --> ViewingHistoryRepo & WatchlistRepo
      FilmS -->|"Film metadata + streaming availability"| TMDB
      RecoF -->|"Streaming availability"| TMDB
      RecoF -->|"Mood-based structured prompt"| Mistral
  
      UserRepo & ViewingHistoryRepo & WatchlistRepo -->|"SQL queries"| DB
  
      TMDB ~~~ Mistral
  ```
  
  | From | To | Description |
  |---|---|---|
  | User | React Components | The user interacts with the app through the browser |
  | React Components | React Router | Navigation between pages is handled client-side without full page reloads |
  | React Router | API Routes | All backend communication goes through HTTP/HTTPS calls with JSON payloads |
  | /auth/* | Auth Service | Handles registration, login, and JWT token generation and validation |
  | /films/* | Film Service | Handles film search, logging, tagging, and watchlist management |
  | /users/* | User Service | Handles user profile and streaming platform preferences |
  | /recommendations/* | Recommendation Facade | Orchestrates the full recommendation flow (mood questionnaire + swipe deck + LLM) |
  | Auth Service | User Repository | Reads and writes user authentication data |
  | Film Service | Viewing History Repository | Reads and writes film logging, tag, and prestige tier data |
  | Film Service | Watchlist Repository | Reads and writes watchlist entries |
  | Film Service | TMDB API | Fetches and caches film metadata (poster, synopsis, director, genres, runtime) and streaming availability at save time |
  | Recommendation Facade | TMDB API | Resolves Mistral title+year suggestions to real TMDB IDs; fetches streaming availability for recommended films |
  | Recommendation Facade | Mistral AI | Sends a structured prompt with mood, age, viewing history, and watchlist context; receives film suggestions and match scores in JSON |
  | All Repositories | PostgreSQL | All persistent data is stored and retrieved via SQL queries |
</details>
<details>
  <summary>Overview: Revised Class Diagram</summary>

  ```mermaid
  classDiagram
  direction LR
  
  class BaseModel {
      <<abstract>>
      #id: UUID4
      #created_at: datetime
      #updated_at: datetime
  }
  
  class User {
      <<entity>>
      -first_name: str
      -last_name: str
      +username: str
      -email: str
      -hashed_password: str
      -is_admin: bool = False
      +age: int | None
      +platforms: list[Platform]
      +verify_password(plain_password str) bool
  }
  
  class WatchlistEntry {
      <<entity>>
      -user_id: UUID
      +tmdb_id: int
      +title: str | None
      +poster_url: str | None
      +year: int | None
      +director: str | None
      +synopsis: str | None
      +genres: list[str] | None
      +runtime: int | None
  }
  
  class Film {
      <<DTO>>
      +tmdb_id: int
      +title: str
      +year: int
      +genres: list[str]
      +poster_url: str
      +synopsis: str
      +director: str
      +cast: list[str]
      +runtime: int
      +streaming_platforms: list[str]
  }
  
  class ViewingHistoryEntry {
      <<entity>>
      -user_id: UUID
      +tmdb_id: int
      +title: str | None
      +poster_url: str | None
      +year: int | None
      +director: str | None
      +synopsis: str | None
      +genres: list[str] | None
      +runtime: int | None
      +tags: list[Tag]
      +prestige_tier: PrestigeTier | None
      +personal_note: str | None
  }
  
  class Tag {
      <<entity>>
      +id: int
      +name: str
      +description: str
  }
  
  class Platform {
      <<entity>>
      +id: int
      +name: str
      +logo_path: str
      +is_free: bool
      +logo_url: str
  }
  
  class PrestigeTier {
      <<enumeration>>
      PLATINUM
      GOLD
      SILVER
      BRONZE
      COAL
      TRASH
  }
  
  BaseModel          <|-- User                : extends
  User "1" --> "0..*" WatchlistEntry       : owns
  
  BaseModel          <|-- ViewingHistoryEntry : extends
  User "1" --> "0..*" ViewingHistoryEntry  : owns
  ViewingHistoryEntry --> PrestigeTier          : uses
  ViewingHistoryEntry ..> Film                  : enriched via TMDB
  
  BaseModel          <|-- WatchlistEntry      : extends
  WatchlistEntry      ..> Film                  : enriched via TMDB
  User "0..*" <--> "0..*" Platform         : subscribes to
  
  ViewingHistoryEntry "0..*" <--> "0..*" Tag   : labeled with
  ```
  
  | Relationship | Type | Description |
  |---|---|---|
  | BaseModel → User / WatchlistEntry / ViewingHistoryEntry | Inheritance | Shared attributes (`id`, `created_at`, `updated_at`) |
  | User → WatchlistEntry | One-to-many | A user owns zero or more watchlist entries |
  | User → ViewingHistoryEntry | One-to-many | A user owns zero or more viewing history entries |
  | User ↔ Platform | Many-to-many | A user subscribes to multiple platforms; managed via `user_platforms` join table |
  | ViewingHistoryEntry ↔ Tag | Many-to-many | An entry can have multiple tags; managed via `viewing_history_tags` join table |
  | ViewingHistoryEntry → PrestigeTier | Association | Each entry optionally holds one value from the PrestigeTier enumeration |
  | WatchlistEntry → Film | Dependency (DTO) | Core metadata cached at save time; full Film DTO fetched from TMDB on demand for enriched display |
  | ViewingHistoryEntry → Film | Dependency (DTO) | Same caching strategy as WatchlistEntry |
</details>
<details>
  <summary>Overview: Revised Entity Relationship Diagram</summary>

  ```mermaid
  erDiagram
      users {
          uuid        id               PK
          varchar     first_name
          varchar     last_name
          varchar     username
          varchar     email            UK
          varchar     hashed_password
          boolean     is_admin
          integer     age              "nullable"
          timestamptz created_at
          timestamptz updated_at
      }
  
      watchlist_entries {
          uuid        id               PK
          uuid        user_id          FK
          integer     tmdb_id
          varchar     title            "nullable - cached from TMDB"
          varchar     poster_url       "nullable - cached from TMDB"
          integer     year             "nullable - cached from TMDB"
          varchar     director         "nullable - cached from TMDB"
          text        synopsis         "nullable - cached from TMDB"
          json        genres           "nullable - cached from TMDB"
          integer     runtime          "nullable - cached from TMDB"
          timestamptz created_at
          timestamptz updated_at
      }
  
      viewing_history_entries {
          uuid          id               PK
          uuid          user_id          FK
          integer       tmdb_id
          varchar       title            "nullable - cached from TMDB"
          varchar       poster_url       "nullable - cached from TMDB"
          integer       year             "nullable - cached from TMDB"
          varchar       director         "nullable - cached from TMDB"
          text          synopsis         "nullable - cached from TMDB"
          json          genres           "nullable - cached from TMDB"
          integer       runtime          "nullable - cached from TMDB"
          prestige_tier prestige_tier    "nullable"
          text          personal_note    "nullable"
          timestamptz   created_at
          timestamptz   updated_at
      }
  
      tags {
          integer id          PK
          varchar name        UK
          varchar description
      }
  
      platforms {
          integer id        PK "TMDB watch-provider ID"
          varchar name      UK
          varchar logo_path
          boolean is_free
      }
  
      viewing_history_tags {
          uuid    viewing_history_entry_id FK
          integer tag_id                  FK
      }
  
      user_platforms {
          uuid    user_id     FK
          integer platform_id FK
      }
  
      users                   ||--o{ watchlist_entries       : owns
      users                   ||--o{ viewing_history_entries : owns
  
      viewing_history_entries ||--o{ viewing_history_tags    : has
      tags                    ||--o{ viewing_history_tags    : labels
  
      users                   ||--o{ user_platforms          : subscribes
      platforms               ||--o{ user_platforms          : selected_by
  ```
  
  | Term | Meaning |
  |---|---|
  | `PK` | **Primary Key** - unique identifier of a table row |
  | `FK` | **Foreign Key** - column referencing the primary key of another table |
  | `UK` | **Unique Key** - ensures that a value cannot appear twice in the same column |
  | `uuid` | **Universally Unique Identifier** - used for user-owned entities to avoid predictable IDs |
  | `integer` | **Whole number** - used for reference tables such as tags and platforms |
  | `varchar` | **Variable-length text field** - short strings with a defined maximum length |
  | `text` | **Longer text field** - used when content length may vary significantly |
  | `boolean` | **True/false value** |
  | `json` | **JSON column** - stores a list of values (e.g. genres) as a structured JSON array |
  | `timestamptz` | **PostgreSQL timestamp with time zone** - ensures dates are stored consistently across time zones |
  | `prestige_tier` | **PostgreSQL enum** - limits the rating column to the six allowed PrestigeTier values |
</details>

### UI Prototype

#### [Figma Interactive Prototype](https://www.figma.com/make/0wZvyA1aYW8MHzXm31lNvD/CinéMood-UI-Prototype?fullscreen=1)
  > Navigable mockup covering all main screens: dashboard, authentication, film catalog, mood questionnaire, swipe interface, recommendation results, and user profile.

---

## Roadmap

### MVP (current scope)
- [x] Project planning and technical documentation
- [x] User authentication (Sprint 1)
- [x] Film search and logging with tags (Sprint 2)
- [x] Watchlist, mark-as-watched, and personal dashboard (Sprint 3)
- [x] Streaming platform selection and frontend fully connected to backend API (Sprint 4)
- [x] Mood questionnaire and AI-powered recommendations via Mistral AI (Sprint 5)
- [x] Film detail casting/streaming-platform enrichment and a full responsive design pass (mobile navigation, questionnaire, swipe deck)

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
