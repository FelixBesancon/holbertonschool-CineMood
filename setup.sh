#!/usr/bin/env bash
# One-time setup script for CinéMood development environment

set -e # Stops the script if a command fails

echo "=== CinéMood Setup ==="

# 1. Check for Python 3.11+
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found. Installing..."
    sudo apt update && sudo apt install python3 python3-venv python3-pip -y
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(sys.version_info.minor)')
if [ "$PYTHON_VERSION" -lt 11 ]; then
    echo "Python 3.11+ required. Found 3.$PYTHON_VERSION"
    exit 1
fi

# 2. Create the virtual environment and install the required dependencies
echo "Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "Backend ready."
cd ..

# 3. Create .env from .env.example and generate SECRET_KEY
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    sed -i "s/your_jwt_secret_key/$SECRET_KEY/" backend/.env
    echo ".env created with a generated SECRET_KEY"
else
    echo ".env already exists - skipping"
fi

# 4. Run PostgreSQL via Docker
echo "Starting PostgreSQL..."
docker compose up -d
echo "PostgreSQL running on port 5432."

echo ""
echo "=== Setup complete ==="
echo "To activate your venv each session: source backend/venv/bin/activate"
