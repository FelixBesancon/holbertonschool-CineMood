# 🎬 CinéMood

> A personal film diary and AI-powered recommendation engine.
> Log what you watch, rate it your way, and get suggestions based on your mood and streaming platforms.

---

## Table of Contents

- [1. About the Project](#about-the-project)
- [2. Features](#features)
  - [2.1. Film Logging](#film-logging)
  - [2.2. Original Rating System](#original-rating-system)
  - [2.3. Mood-Based Recommendation Engine](#mood-based-recommendation-engine)
  - [2.4. Personal Dashboard](#personal-dashboard)
- [3. Tech Stack](#tech-stack)
- [4. Project Structure](#project-structure)
- [5. Getting Started](#getting-started)
- [6. API Overview](#api-overview)
- [7. Documentation](#documentation)
- [8. Roadmap](#roadmap)
- [9. Author](#author)

---

## About the Project

CinéMood was born out of a simple frustration: choosing what to watch is harder than it should be.

Existing tools like Letterboxd or IMDb let you rate films — but they rarely combine your personal taste, your current mood, and what you actually have access to on your streaming subscriptions.

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
- Add it to your viewing history or wishlist
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
- Optionally, add a custom prompt (e.g., “I'm boycotting this director,” “I'm looking for a very gory horror movie,” etc.)
- Receive a curated list of personalised recommendations
- Filtered by the streaming platforms you actually have

### Personal Dashboard
📋 **The tool allows users to keep track of the movies they've watched and the emotional impact they had on them at the time of viewing**
- View your full watching history
- Browse your wishlist
- See your tags and tiers at a glance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Python + FastAPI |
| Database | PostgreSQL |
| Film data and streaming availability | TMDB API |
| AI recommendations | LLM API (Mistral / OpenAI) |
| Version control | Git + GitHub |

---

## Project Structure

```
holbertonschool-CineMood/
├── README.md
├── docs/
│   ├── diagrams/
│   ├── images/
│   ├── Stage 1 Report[...].pdf
│   ├── Stage 2 Report[...].pdf
│   └── Stage 3 Report[...].pdf
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
└── backend/
├── app/
│   ├── models/
│   ├── routes/
│   └── services/
└── tests/
```

---

## Getting Started

> The project is currently in the documentation and planning phase (Stage 3).
> This section will be updated once development begins.

### Prerequisites

- Node.js >= 18
- Python >= 3.11
- PostgreSQL >= 15

### Installation

```bash
# Clone the repository
git clone https://github.com/FelixBesancon/holbertonschool-CineMood.git
cd holbertonschool-CineMood

# Frontend
cd frontend
npm install
npm run dev

# Backend
cd ../backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## API Overview

> Full API documentation is available in the Stage 3 Technical Documentation.

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Create a new user account |
| POST | /auth/login | Log in and receive a token |
| GET | /films/search | Search for a film by title |
| POST | /films/log | Log a watched film with tags |
| GET | /films/history | Retrieve the user's viewing history |
| GET | /films/wishlist | Retrieve the user's wishlist |
| POST | /recommendations | Get mood-based film recommendations |

---

## Documentation

All project documentation is maintained as part of the Holberton portfolio process:

- **Portfolio Project Progress Report**:
  - [Stage 1 — Idea Development & Team Formation](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/Stage%201%20Report%20-%20Team%20Formation%2C%20Brainstorming%20and%20MVP.pdf)
  - [Stage 2 — Project Planning](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/Stage%202%20Report%20-%20Project%20Planning.pdf)
  - [Stage 3 — Technical Documentation](https://docs.google.com/document/d/1r0NgW17kEw7OtL454YLDahwGwA1swqAtHtHLQfqh7zY/edit?usp=sharing)
- **Technical Diagrams**:
  - [Architecture Diagrams](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/Architecture.md)
  - [Class Diagram](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/ClassDiagram.md)
  - [Entity Relationship Diagram](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/ERDiagram.md)
  - [High-Level Sequence Diagrams](https://github.com/FelixBesancon/holbertonschool-CineMood/blob/main/docs/diagrams/SequenceDiagrams.md)

---

## Roadmap

### MVP (current scope)
- [x] Project planning and technical documentation
- [ ] User authentication
- [ ] Film search and logging
- [ ] Tag-based rating system
- [ ] Mood questionnaire and swipe interface
- [ ] AI-powered recommendations
- [ ] Streaming availability display

### Future versions
- [ ] Social features (follow users, shared lists)
- [ ] Cinema listings and nearby showtimes
- [ ] Native mobile application
- [ ] Export viewing history

---

## Author

**Félix Besançon**
Holberton School Bordeaux — Bachelor CDA, Year 1
Specialisation: Fullstack Development & Machine Learning

- GitHub: [@FelixBesancon](https://github.com/FelixBesancon)
- LinkedIn: [@FelixBesancon](https://linkedin.com/in/felix-besancon)

---

*End-of-year portfolio project — Holberton School Bordeaux — 2026*
