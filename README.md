# 🎬 CinéMood

> A personal film diary and AI-powered recommendation engine.
> Log what you watch, rate it your way, and get suggestions based on your mood and streaming platforms.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Overview](#api-overview)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Author](#author)

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

### 🎞️ Film Logging
- Search for any film by title (powered by the TMDB API)
- Add it to your viewing history or wishlist
- Log it with emotional and contextual tags instead of a simple star rating

### 🏷️ Original Rating System
Rate films with tags that actually mean something:

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

### 🎭 Mood-Based Recommendation Engine
- Answer a short mood questionnaire
- Swipe through film cards (right = interested, left = not interested)
- Receive a curated list of personalised recommendations
- Filtered by the streaming platforms you actually have

### 📋 Personal Dashboard
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
| Film data | TMDB API |
| Streaming availability | Watchmode API |
| AI recommendations | LLM API (Mistral / OpenAI) |
| Version control | Git + GitHub |

---

## Project Structure

```
cinemood/
├── README.md
├── docs/
│   ├── stage1_report.pdf
│   ├── stage2_planning.pdf
│   └── stage3_technical.pdf
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

- [Stage 1 — Idea Development & Team Formation](https://docs.google.com/document/d/1FasUDL7rBWEM1wyy7Tdx2kuHnpZ7bkZwgL1AbhZAlzQ)
- [Stage 2 — Project Planning](https://docs.google.com/document/d/1I3SiKH2X2ekeTmv2lYn2jFTJYUXYhNQikRndpG9SDv4)
- [Stage 3 — Technical Documentation](https://docs.google.com/document/d/1r0NgW17kEw7OtL454YLDahwGwA1swqAtHtHLQfqh7zY/edit?usp=sharing)

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
