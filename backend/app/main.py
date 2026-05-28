"""
Entry point of the CinéMood API.

This module initializes the FastAPI application instance and registers
the root health check endpoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# FastAPI application instance.
# This object registers all routes and is served by uvicorn.
# Metadata (title, description, version) appears in the Swagger UI at /docs.
app = FastAPI(
    title="CinéMood API",
    description="Personal film diary and AI-powered recommendation engine",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """
    Health check endpoint.
    Returns a simple message to confirm the API is running.
    """
    return {
        "message": "CinéMood API is running"
    }
