#!/usr/bin/env bash
# Start the CinéMood development servers

# Stop the script if a command fails
set -e

echo "=== Starting CinéMood ==="

# Start the backend in the background
echo "Starting backend..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload &
BACKEND_PID=$!
cd ..

# Start the frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== CinéMood is running ==="
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8000"
echo "  Swagger  : http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and handle Ctrl+C cleanly
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
