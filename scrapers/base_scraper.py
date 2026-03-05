"""Base scraper with shared logic for all scrapers."""

import sqlite3
import time
import random
import re
import logging
from pathlib import Path
from abc import ABC, abstractmethod

import requests

DB_PATH = Path(__file__).parent.parent / "data" / "schoenheitsaerzte.db"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)


def generate_slug(titel: str, vorname: str, nachname: str) -> str:
    """Generate SEO slug from name: dr-max-mustermann."""
    parts = []
    if titel:
        parts.append(titel.lower().replace(".", "").replace(" ", "-"))
    parts.append(vorname.lower())
    parts.append(nachname.lower())
    slug = "-".join(parts)
    # Umlauts
    slug = slug.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    slug = slug.replace("ß", "ss")
    # Remove non-URL chars
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


class BaseScraper(ABC):
    """Abstract base scraper with rate limiting, session management, and DB helpers."""

    name: str = "base"
    min_delay: float = 3.0
    max_delay: float = 7.0

    def __init__(self):
        self.logger = logging.getLogger(self.name)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
        })
        self.db = sqlite3.connect(str(DB_PATH))
        self.db.execute("PRAGMA foreign_keys = ON")
        self.stats = {"neu": 0, "aktualisiert": 0}

    def close(self):
        self.db.close()
        self.session.close()

    def wait(self):
        """Polite delay between requests."""
        delay = random.uniform(self.min_delay, self.max_delay)
        self.logger.debug(f"Waiting {delay:.1f}s...")
        time.sleep(delay)

    def fetch(self, url: str, **kwargs) -> requests.Response | None:
        """Fetch URL with error handling and logging."""
        start = time.time()
        try:
            # Rotate user agent
            self.session.headers["User-Agent"] = random.choice(USER_AGENTS)
            resp = self.session.get(url, timeout=30, **kwargs)
            resp.raise_for_status()
            self._log_request(url, "ok", int((time.time() - start) * 1000))
            return resp
        except requests.RequestException as e:
            status = "rate_limit" if hasattr(e, "response") and e.response and e.response.status_code == 429 else "fehler"
            self._log_request(url, status, int((time.time() - start) * 1000))
            self.logger.error(f"Request failed for {url}: {e}")
            return None

    def _log_request(self, url: str, status: str, laufzeit_ms: int):
        self.db.execute(
            "INSERT INTO scraper_log (quelle, ziel_url, status, laufzeit_ms) VALUES (?, ?, ?, ?)",
            (self.name, url, status, laufzeit_ms),
        )
        self.db.commit()

    def upsert_arzt(self, data: dict) -> int | None:
        """Insert or update a doctor. Returns arzt_id."""
        slug = data.get("seo_slug") or generate_slug(
            data.get("titel", ""), data["vorname"], data["nachname"]
        )
        data["seo_slug"] = slug

        cursor = self.db.execute(
            "SELECT id FROM aerzte WHERE seo_slug = ?", (slug,)
        )
        existing = cursor.fetchone()

        if existing:
            arzt_id = existing[0]
            updates = []
            values = []
            for key in [
                "ist_facharzt", "facharzttitel", "selbstbezeichnung",
                "approbation_verifiziert", "kammer_id", "stadt", "bundesland",
                "plz", "website_url", "datenquelle",
            ]:
                if key in data and data[key] is not None:
                    updates.append(f"{key} = ?")
                    values.append(data[key])
            if updates:
                updates.append("letzte_aktualisierung = datetime('now')")
                values.append(arzt_id)
                self.db.execute(
                    f"UPDATE aerzte SET {', '.join(updates)} WHERE id = ?",
                    values,
                )
                self.db.commit()
                self.stats["aktualisiert"] += 1
            self.logger.info(f"Updated: {data.get('vorname')} {data['nachname']} (id={arzt_id})")
            return arzt_id
        else:
            columns = [
                "vorname", "nachname", "titel", "geschlecht",
                "ist_facharzt", "facharzttitel", "selbstbezeichnung",
                "approbation_verifiziert", "kammer_id", "approbation_jahr",
                "facharzt_seit_jahr", "stadt", "bundesland", "plz",
                "seo_slug", "website_url", "datenquelle",
            ]
            values = [data.get(c) for c in columns]
            placeholders = ", ".join(["?"] * len(columns))
            col_str = ", ".join(columns)
            cursor = self.db.execute(
                f"INSERT INTO aerzte ({col_str}) VALUES ({placeholders})",
                values,
            )
            self.db.commit()
            self.stats["neu"] += 1
            arzt_id = cursor.lastrowid
            self.logger.info(f"Inserted: {data.get('vorname')} {data['nachname']} (id={arzt_id})")
            return arzt_id

    def upsert_bewertung(self, arzt_id: int, plattform: str, score: float, max_score: float, anzahl: int):
        """Insert or update a review."""
        self.db.execute(
            """INSERT INTO bewertungen (arzt_id, plattform, score, max_score, anzahl_bewertungen)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(arzt_id, plattform)
               DO UPDATE SET score=excluded.score, max_score=excluded.max_score, anzahl_bewertungen=excluded.anzahl_bewertungen""",
            (arzt_id, plattform, score, max_score, anzahl),
        )
        self.db.commit()

    def upsert_mitgliedschaft(self, arzt_id: int, gesellschaft: str, **kwargs):
        """Insert membership if not already present."""
        existing = self.db.execute(
            "SELECT id FROM mitgliedschaften WHERE arzt_id = ? AND gesellschaft = ?",
            (arzt_id, gesellschaft),
        ).fetchone()
        if not existing:
            self.db.execute(
                "INSERT INTO mitgliedschaften (arzt_id, gesellschaft, mitglied_seit_jahr, mitgliedsstatus, verifiziert, quelle_url) VALUES (?, ?, ?, ?, ?, ?)",
                (arzt_id, gesellschaft, kwargs.get("seit"), kwargs.get("status", "Mitglied"), kwargs.get("verifiziert", 1), kwargs.get("quelle_url")),
            )
            self.db.commit()

    def finalize(self):
        """Log final stats for this scraper run."""
        self.db.execute(
            "UPDATE scraper_log SET eintraege_neu = ?, eintraege_aktualisiert = ? WHERE quelle = ? ORDER BY zeitstempel DESC LIMIT 1",
            (self.stats["neu"], self.stats["aktualisiert"], self.name),
        )
        self.db.commit()
        self.logger.info(f"Done: {self.stats['neu']} new, {self.stats['aktualisiert']} updated")

    @abstractmethod
    def run(self):
        """Execute the scraper logic."""
        ...
