"""Scraper for clinic websites with structured doctor pages.

Crawls clinic team pages, extracts individual doctor profiles
including CV timeline and specializations.
"""

import re
from base_scraper import BaseScraper


KLINIKEN = [
    {
        "name": "Dorow Clinic",
        "team_url": "https://dorow-clinic.de/aerzte",
        "stadt": "Waldshut-Tiengen",
        "bundesland": "Baden-Württemberg",
    },
    {
        "name": "Klinik an der Oper",
        "team_url": "https://klinik-an-der-oper.de/team",
        "stadt": "München",
        "bundesland": "Bayern",
    },
    {
        "name": "Arteo Klinik",
        "team_url": "https://arteo-klinik.de/team",
        "stadt": "Düsseldorf",
        "bundesland": "Nordrhein-Westfalen",
    },
]

FACHARZT_PATTERN = re.compile(
    r"Fach(?:arzt|ärztin)\s+für\s+Plastische\s+und\s+Ästhetische\s+Chirurgie",
    re.IGNORECASE,
)


class KlinikScraper(BaseScraper):
    """Scrapes clinic websites for doctor profiles."""

    name = "klinik"
    min_delay = 3.0
    max_delay = 7.0

    def run(self):
        for klinik in KLINIKEN:
            self.logger.info(f"Scraping: {klinik['name']}")
            self._scrape_klinik(klinik)
            self.wait()

        self.finalize()

    def _scrape_klinik(self, klinik: dict):
        """Scrape a clinic's team page, then individual doctor pages.

        Flow:
          1. Fetch team overview page
          2. Extract individual doctor page URLs
          3. For each doctor page: extract name, title, CV, specializations
          4. Detect Facharzttitel from page text
        """
        resp = self.fetch(klinik["team_url"])
        if not resp:
            return

        # TODO: Implement clinic-specific HTML parsing.
        # Step 1: Extract doctor page URLs from team overview
        # doctor_urls = self._extract_doctor_links(resp.text, klinik["team_url"])

        # Step 2: Scrape each doctor page
        # for url in doctor_urls:
        #     self.wait()
        #     doc_resp = self.fetch(url)
        #     if not doc_resp:
        #         continue
        #     doctor = self._parse_doctor_page(doc_resp.text, klinik)
        #     if doctor:
        #         arzt_id = self.upsert_arzt(doctor)
        #         if arzt_id and "werdegang" in doctor:
        #             self._insert_werdegang(arzt_id, doctor["werdegang"])
        #         if arzt_id and "spezialisierungen" in doctor:
        #             self._insert_spezialisierungen(arzt_id, doctor["spezialisierungen"])

        self.logger.info(f"  {klinik['name']}: parsing not yet implemented")

    def _detect_facharzt(self, text: str) -> bool:
        """Check if page text contains a protected Facharzt title."""
        return bool(FACHARZT_PATTERN.search(text))

    def _insert_werdegang(self, arzt_id: int, entries: list[dict]):
        """Insert CV entries for a doctor."""
        for entry in entries:
            self.db.execute(
                """INSERT INTO werdegang (arzt_id, typ, institution, stadt, land, von_jahr, bis_jahr, beschreibung, verifiziert)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)""",
                (arzt_id, entry.get("typ", "klinik"), entry.get("institution"),
                 entry.get("stadt"), entry.get("land", "DE"),
                 entry.get("von_jahr"), entry.get("bis_jahr"),
                 entry.get("beschreibung")),
            )
        self.db.commit()

    def _insert_spezialisierungen(self, arzt_id: int, specs: list[dict]):
        """Insert specializations for a doctor."""
        for spec in specs:
            existing = self.db.execute(
                "SELECT id FROM spezialisierungen WHERE arzt_id = ? AND eingriff = ?",
                (arzt_id, spec["eingriff"]),
            ).fetchone()
            if not existing:
                self.db.execute(
                    "INSERT INTO spezialisierungen (arzt_id, kategorie, eingriff, erfahrungslevel) VALUES (?, ?, ?, ?)",
                    (arzt_id, spec.get("kategorie", "koerper"), spec["eingriff"],
                     spec.get("erfahrungslevel", "basis")),
                )
        self.db.commit()


if __name__ == "__main__":
    scraper = KlinikScraper()
    try:
        scraper.run()
    finally:
        scraper.close()
