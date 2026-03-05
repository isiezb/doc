"""Scraper for Jameda review data.

Fetches review scores and counts for plastic surgeons,
then matches against existing database entries by last name.
"""

from base_scraper import BaseScraper


class JamedaScraper(BaseScraper):
    """Scrapes Jameda for doctor reviews and ratings."""

    name = "jameda"
    min_delay = 5.0
    max_delay = 10.0

    def run(self):
        """Scrape Jameda plastic surgery category and match to existing doctors."""
        # Get all doctors from our DB to match against
        doctors = self.db.execute(
            "SELECT id, vorname, nachname, stadt FROM aerzte"
        ).fetchall()

        self.logger.info(f"Matching against {len(doctors)} doctors in DB")

        # TODO: Implement Jameda scraping.
        # Flow:
        #   1. Fetch jameda.de listing pages for plastic surgery
        #      URL pattern: /suche/plastische-aesthetische-chirurgie/
        #   2. Parse each result: doctor name, rating, review count
        #   3. Match to DB entries by nachname + stadt
        #   4. Upsert bewertung for matches

        # Example pagination:
        # page = 1
        # while True:
        #     resp = self.fetch(
        #         f"https://www.jameda.de/suche/plastische-aesthetische-chirurgie/seite-{page}/"
        #     )
        #     if not resp:
        #         break
        #     results = self._parse_listing(resp.text)
        #     if not results:
        #         break
        #     for result in results:
        #         arzt_id = self._match_doctor(result, doctors)
        #         if arzt_id:
        #             self.upsert_bewertung(
        #                 arzt_id, "jameda",
        #                 result["score"], 6.0,  # Jameda uses 1-6 scale
        #                 result["anzahl"],
        #             )
        #     page += 1
        #     self.wait()

        self.logger.info("Jameda scraping: not yet implemented")
        self.finalize()

    def _match_doctor(self, result: dict, doctors: list) -> int | None:
        """Match a Jameda result to an existing doctor in DB."""
        for doc_id, vorname, nachname, stadt in doctors:
            if nachname.lower() == result.get("nachname", "").lower():
                if stadt and stadt.lower() == result.get("stadt", "").lower():
                    return doc_id
        return None


if __name__ == "__main__":
    scraper = JamedaScraper()
    try:
        scraper.run()
    finally:
        scraper.close()
