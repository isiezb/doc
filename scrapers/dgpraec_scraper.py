"""Scraper for DGPRÄC, DGÄPC, and VDÄPC member directories.

Extracts member names and practice addresses, then creates
verified membership entries in the database.
"""

from base_scraper import BaseScraper


GESELLSCHAFTEN = [
    {
        "name": "DGPRÄC",
        "url": "https://www.dgpraec.de/patienten/arztsuche/",
    },
    {
        "name": "DGÄPC",
        "url": "https://www.dgaepc.de/arztsuche/",
    },
    {
        "name": "VDÄPC",
        "url": "https://www.vdaepc.de/arztsuche/",
    },
]


class DGPRAECScraper(BaseScraper):
    """Scrapes professional society member directories."""

    name = "dgpraec"
    min_delay = 3.0
    max_delay = 6.0

    def run(self):
        for gesellschaft in GESELLSCHAFTEN:
            self.logger.info(f"Scraping: {gesellschaft['name']}")
            self._scrape_gesellschaft(gesellschaft)
            self.wait()

        self.finalize()

    def _scrape_gesellschaft(self, gesellschaft: dict):
        """Scrape a single society's member directory.

        Template — extend with society-specific parsing.
        """
        resp = self.fetch(gesellschaft["url"])
        if not resp:
            return

        # TODO: Implement society-specific HTML parsing.
        # General flow:
        #   1. Parse member list (may require pagination)
        #   2. For each member: extract name, practice address
        #   3. Upsert arzt with ist_facharzt=1 (DGPRÄC members are verified)
        #   4. Create verified membership entry

        # Example:
        # members = self._parse_members(resp.text)
        # for member in members:
        #     arzt_id = self.upsert_arzt({
        #         "vorname": member["vorname"],
        #         "nachname": member["nachname"],
        #         "titel": member.get("titel", ""),
        #         "ist_facharzt": 1,
        #         "facharzttitel": "Facharzt für Plastische und Ästhetische Chirurgie",
        #         "selbstbezeichnung": "Facharzt für Plastische und Ästhetische Chirurgie",
        #         "stadt": member.get("stadt"),
        #         "bundesland": member.get("bundesland"),
        #         "plz": member.get("plz"),
        #         "datenquelle": gesellschaft["name"].lower(),
        #     })
        #     if arzt_id:
        #         self.upsert_mitgliedschaft(
        #             arzt_id,
        #             gesellschaft["name"],
        #             verifiziert=1,
        #             quelle_url=gesellschaft["url"],
        #         )

        self.logger.info(f"  {gesellschaft['name']}: parsing not yet implemented")


if __name__ == "__main__":
    scraper = DGPRAECScraper()
    try:
        scraper.run()
    finally:
        scraper.close()
