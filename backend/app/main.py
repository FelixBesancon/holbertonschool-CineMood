"""
Entry point of the CinéMood API.

This module initializes the FastAPI application instance and registers
the root health check endpoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import (
    auth, film, tag, platform, users, viewing_history, watchlist, library, recommendations
    )

# FastAPI application instance.
# This object registers all routes and is served by uvicorn.
# Metadata (title, description, version) appears in the Swagger UI at /docs.
app = FastAPI(
    title="CinéMood API",
    description="Personal film diary and AI-powered recommendation engine",
    version="0.1.0"
)

# CORS configuration for development.
# allow_origins=["*"] accepts requests from any origin — fine for local dev.
# allow_credentials is NOT set: it is only needed for cookie-based auth.
# CinéMood uses JWT in the Authorization header, not cookies, so Axios never
# sends credentials cross-origin and this option is not required.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(film.router)
app.include_router(tag.router)
app.include_router(platform.router)
app.include_router(users.router)
app.include_router(viewing_history.router)
app.include_router(watchlist.router)
app.include_router(library.router)
app.include_router(recommendations.router)


@app.get("/")
def root():
    """
    Health check endpoint.
    Returns a simple message to confirm the API is running.
    """
    return {
        "message": "CinéMood API is running"
    }
