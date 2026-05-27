# 🎬 CinéMood

> A personal film diary and AI-powered recommendation engine.<br>
> Log what you watch, rate it your way, and get suggestions based on your mood and streaming platforms.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal?logo=fastapi)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)
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
  - [7.2. Installation](#installation)
    - [7.2.1. Backend](#backend)
    - [7.2.2. Frontend](#frontend)
- [8. API Overview](#api-overview)
- [9. Git Workflow](#git-workflow)
  - [9.1. Branch Strategy](#branch-strategy)
  - [9.2. Commit Convention](#commit-convention)
  - [9.3. Closing Issues via Commits](#closing-issues-via-commits)
  - [9.4. Pull Request Process](#pull-request-process)
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

🎞️ **The tool lets users add movies to personal “watched” or “to-watch” lists**
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
| Frontend | React 18 + Tailwind CSS | Component-based UI, responsive design |
| Routing | React Router | Client-side navigation |
| Backend | Python 3.11 + FastAPI | REST API, business logic, async support |
| Database | PostgreSQL 15 | Relational data persistence |
| Authentication | JWT | Stateless user authentication |
| Film data | TMDB API | Film metadata, posters, streaming availability |
| AI recommendations | Mistral AI | Mood-based LLM recommendation engine |
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
│   └── src/
│       ├── components/
│       │   ├── FilmCard/
│       │   ├── TagSelector/
│       │   ├── PlatformSelector/
│       │   ├── SwipeDeck/
│       │   └── NavBar/
│       ├── pages/
│       │   ├── AuthPage/
│       │   ├── DashboardPage/
│       │   ├── CatalogPage/
│       │   ├── FilmDetailPage/
│       │   ├── RecommendationPage/
│       │   └── ProfilePage/
│       └── services/
│           └── api.js
└── backend/
    ├── app/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   └── repositories/
    └── tests/
        ├── test_auth.py
        ├── test_films.py
        ├── test_users.py
        └── test_recommendations.py
```

---

## Getting Started

> The project is currently in the documentation and planning phase (Stage 3).<br>
> This section will be updated once development begins.

### Prerequisites

- Node.js >= 18
- Python >= 3.11
- PostgreSQL >= 15
- A [TMDB API key](https://www.themoviedb.org/settings/api)
- A [Mistral AI API key](https://console.mistral.ai/)

### Installation

```bash
# Clone the repository
git clone https://github.com/FelixBesancon/holbertonschool-CineMood.git
cd holbertonschool-CineMood
```

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`
The API will be available at `http://localhost:8000`
The API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

---

## API Overview

> Full API specification is available in the [Stage 3 Technical Documentation](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/develop/docs/Stage%203%20Report%20-%20Technical%20Documentation.pdf).

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /auth/register | Create a new user account | ❌ |
| POST | /auth/login | Log in and receive a JWT token | ❌ |
| GET | /films/search | Search for a film by title | ✅ |
| GET | /films/{tmdb_id} | Get film details and user status | ✅ |
| POST | /films/log | Log a watched film with tags | ✅ |
| DELETE | /films/log/{entry_id} | Remove a film from history | ✅ |
| GET | /films/history | Retrieve the user's viewing history | ✅ |
| POST | /films/watchlist | Add a film to the watchlist | ✅ |
| DELETE | /films/watchlist/{tmdb_id} | Remove a film from the watchlist | ✅ |
| GET | /films/watchlist | Retrieve the user's watchlist | ✅ |
| GET | /users/me | Get current user profile | ✅ |
| PATCH | /users/me | Update user profile | ✅ |
| GET | /users/me/platforms | Get platform preferences | ✅ |
| PUT | /users/me/platforms | Update platform preferences | ✅ |
| POST | /recommendations/start | Get mood-based recommendations | ✅ |

> ✅ Requires authentication — a valid JWT token must be included in the `Authorization: Bearer <token>` header.<br>
> ❌ Public endpoint — no authentication required.

---

## Git Workflow

### Branch Strategy

```
main          → stable, production-ready code
develop       → integration branch
feature/s1-1-backend-setup      → one branch per issue
fix/s6-1-auth-bug               → bug fixes
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
| `style` | Formatting, missing semicolons, etc. |

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

### Pull Request Process

All merges into `develop` go through a pull request with:
- A description of what was implemented
- Reference to the related issue
- Confirmation that tests pass

---

## Testing

```bash
cd backend

# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run a specific test file
pytest tests/test_auth.py -v
```

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
- [ ] User authentication (Sprint 1)
- [ ] Film search and logging with tags (Sprint 2)
- [ ] Watchlist and personal dashboard (Sprint 3)
- [ ] Mood questionnaire and swipe interface (Sprint 4)
- [ ] AI-powered recommendations via Mistral AI (Sprint 5)
- [ ] Streaming availability display (Sprint 5)

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
