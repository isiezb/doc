"""Orchestrator that runs all scrapers sequentially.

Usage:
    python orchestrator.py          # Run all scrapers
    python orchestrator.py klinik   # Run specific scraper

Can be set up as a cron job: 0 3 * * * cd /path/to/scrapers && python orchestrator.py
"""

import sys
import time
import logging

from aerztekammer_scraper import AerztekammerScraper
from dgpraec_scraper import DGPRAECScraper
from klinik_scraper import KlinikScraper
from jameda_scraper import JamedaScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [orchestrator] %(levelname)s: %(message)s",
)
logger = logging.getLogger("orchestrator")

SCRAPERS = {
    "aerztekammer": AerztekammerScraper,
    "dgpraec": DGPRAECScraper,
    "klinik": KlinikScraper,
    "jameda": JamedaScraper,
}


def run_all(selected: list[str] | None = None):
    targets = selected or list(SCRAPERS.keys())
    logger.info(f"Starting scraper run: {', '.join(targets)}")

    for name in targets:
        if name not in SCRAPERS:
            logger.warning(f"Unknown scraper: {name}")
            continue

        logger.info(f"--- Running {name} ---")
        start = time.time()
        scraper = SCRAPERS[name]()
        try:
            scraper.run()
        except Exception as e:
            logger.error(f"{name} failed: {e}")
        finally:
            scraper.close()
        elapsed = time.time() - start
        logger.info(f"--- {name} finished in {elapsed:.1f}s ---")

    logger.info("All scrapers finished.")


if __name__ == "__main__":
    selected = sys.argv[1:] if len(sys.argv) > 1 else None
    run_all(selected)
