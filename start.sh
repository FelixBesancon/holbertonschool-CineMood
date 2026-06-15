#!/usr/bin/env bash
# Start the CinéMood development servers

# Stop the script if a command fails
set -e

echo "=== Starting CinéMood ==="

# Check that the virtual environment exists
if [ ! -f "backend/venv/bin/activate" ]; then
    echo "Error: virtual environment not found."
    echo "Run this command first to initialize the project:"
    echo "    ./setup.sh"
    exit 1
fi

# Check that node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "Error: frontend dependencies not found."
    echo "Run this command first to initialize the project."
    echo "    ./setup.sh"
    exit 1
fi

# Start PostgreSQL via Docker (safe to call if already running)
echo "Starting PostgreSQL..."
docker compose up -d

echo "Waiting for PostgreSQL to be ready..."
until docker exec cinemood_db pg_isready -U cinemood -d cinemood > /dev/null 2>&1; do
    sleep 1
done
echo "PostgreSQL ready."

# Start the backend in its own process group so all children are killed on exit
echo "Starting backend..."
cd backend
source venv/bin/activate
setsid uvicorn app.main:app --reload &
BACKEND_PID=$!
cd ..

# Start the frontend in its own process group
echo "Starting frontend..."
cd frontend
setsid npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== CinéMood is running ==="
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8000"
echo "  Swagger  : http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

_cleanup_done=0
cleanup() {
    [ "$_cleanup_done" = "1" ] && return
    _cleanup_done=1
    echo ""
    echo "Stopping servers..."
    kill -- -$BACKEND_PID 2>/dev/null || true
    kill -- -$FRONTEND_PID 2>/dev/null || true
    sleep 1
    kill -9 -- -$BACKEND_PID 2>/dev/null || true
    kill -9 -- -$FRONTEND_PID 2>/dev/null || true
    echo "Servers stopped."
}

trap cleanup INT TERM EXIT
wait $BACKEND_PID $FRONTEND_PID
