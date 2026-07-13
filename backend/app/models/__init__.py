from app.models.base_model import BaseModel
from app.models.platform import Platform
from app.models.user import User
from app.models.tag import Tag
from app.models.viewing_history_entry import ViewingHistoryEntry
from app.models.watchlist_entry import WatchlistEntry
from app.models.prestige_tier import PrestigeTier

__all__ = [
    "BaseModel",
    "Platform",
    "User",
    "Tag",
    "ViewingHistoryEntry",
    "WatchlistEntry",
    "PrestigeTier",
]
