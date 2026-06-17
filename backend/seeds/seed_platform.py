"""
Seed script for streaming platforms.
Run once after migration: python seeds/seed_platforms.py
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.models.platform import Platform

PLATFORMS = [
    {
        "id": 8,
        "name": "Netflix",
        "logo_path": "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
        "is_free": False
    },
    {
        "id": 119,
        "name": "Amazon Prime Video",
        "logo_path": "/pvske1MyAoymrs5bguRfVqYiM9a.jpg",
        "is_free": False
    },
    {
        "id": 350,
        "name": "Apple TV",
        "logo_path": "/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg",
        "is_free": False
    },
    {
        "id": 337,
        "name": "Disney Plus",
        "logo_path": "/97yvRBw1GzX7fXprcF80er19ot.jpg",
        "is_free": False
    },
    {
        "id": 531,
        "name": "Paramount Plus",
        "logo_path": "/h5DcR0J2EESLitnhR8xLG1QymTE.jpg",
        "is_free": False
    },
    {
        "id": 11,
        "name": "MUBI",
        "logo_path": "/x570VpH2C9EKDf1riP83rYc5dnL.jpg",
        "is_free": False
    },
    {
        "id": 147,
        "name": "M6+",
        "logo_path": "/tmYzlEKeiWStvXwC1QdpXIASpN4.jpg",
        "is_free": True
    },
    {
        "id": 389,
        "name": "Sooner",
        "logo_path": "/brt7T1qjJhyKaazaHP2N9r31TRS.jpg",
        "is_free": False
    },
    {
        "id": 300,
        "name": "Pluto TV",
        "logo_path": "/dB8G41Q6tSL5NBisrIeqByfepBc.jpg",
        "is_free": True
    },
    {
        "id": 310,
        "name": "LaCinetek",
        "logo_path": "/1syoSwH2yIskHUqeOiK9re8AMJC.jpg",
        "is_free": False
    },
    {
        "id": 283,
        "name": "Crunchyroll",
        "logo_path": "/fzN5Jok5Ig1eJ7gyNGoMhnLSCfh.jpg",
        "is_free": False
    },
    {
        "id": 513,
        "name": "Shadowz",
        "logo_path": "/qwRq7klF8EijYs7XgvxSaYd6v6w.jpg",
        "is_free": False
    },
    {
        "id": 381,
        "name": "Canal+",
        "logo_path": "/geOzgeKZWpZC3lymAVEHVIk3X0q.jpg",
        "is_free": False
    },
    {
        "id": 10,
        "name": "Amazon Video",
        "logo_path": "/qR6FKvnPBx2O37FDg8PNM7efwF3.jpg",
        "is_free": False
    },
    {
        "id": 234,
        "name": "Arte",
        "logo_path": "/vPZrjHe7wvALuwJEXT2kwYLi0gV.jpg",
        "is_free": True
    },
    {
        "id": 1754,
        "name": "TF1+",
        "logo_path": "/blrBF9R2ONYu04ifGkYEb3k779N.jpg",
        "is_free": True
    },
    {
        "id": 1899,
        "name": "HBO Max",
        "logo_path": "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
        "is_free": False
    }
]

def seed():
    db = SessionLocal()
    try:
        for platform_data in PLATFORMS:
            if not db.query(Platform).filter_by(id=platform_data["id"]).first():
                db.add(Platform(**platform_data))
        db.commit()
        print(f"{len(PLATFORMS)} platforms seeded.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
