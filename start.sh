#!/usr/bin/env bash
# Start the CinéMood development servers

# Start the backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
