import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "schoenheitsaerzte.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS kliniken (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      typ TEXT CHECK(typ IN ('privatklinik_108','privatklinik_30','praxis','schoenheitskette')),
      website_url TEXT,
      stadt TEXT,
      bundesland TEXT,
      latitude REAL,
      longitude REAL,
      tuev_zertifiziert INTEGER DEFAULT 0,
      fallzahlen_plastik INTEGER,
      google_rating REAL,
      google_reviews_count INTEGER,
      impressum_gmbh INTEGER DEFAULT 0,
      handelsregister_nr TEXT
    );

    CREATE TABLE IF NOT EXISTS aerzte (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      titel TEXT,
      geschlecht TEXT CHECK(geschlecht IN ('m','w','d')),
      ist_facharzt INTEGER DEFAULT 0,
      facharzttitel TEXT,
      selbstbezeichnung TEXT,
      approbation_verifiziert INTEGER DEFAULT 0,
      kammer_id TEXT,
      approbation_jahr INTEGER,
      facharzt_seit_jahr INTEGER,
      klinik_id INTEGER REFERENCES kliniken(id),
      position TEXT,
      stadt TEXT,
      bundesland TEXT,
      plz TEXT,
      latitude REAL,
      longitude REAL,
      seo_slug TEXT UNIQUE NOT NULL,
      website_url TEXT,
      datenquelle TEXT,
      letzte_aktualisierung TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS spezialisierungen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arzt_id INTEGER NOT NULL REFERENCES aerzte(id),
      kategorie TEXT CHECK(kategorie IN ('brust','gesicht','koerper','minimal_invasiv')),
      eingriff TEXT NOT NULL,
      erfahrungslevel TEXT CHECK(erfahrungslevel IN ('basis','fortgeschritten','spezialist'))
    );

    CREATE TABLE IF NOT EXISTS werdegang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arzt_id INTEGER NOT NULL REFERENCES aerzte(id),
      typ TEXT CHECK(typ IN ('studium','klinik','weiterbildung','promotion','zertifikat')),
      institution TEXT,
      stadt TEXT,
      land TEXT,
      von_jahr INTEGER,
      bis_jahr INTEGER,
      beschreibung TEXT,
      verifiziert INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS mitgliedschaften (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arzt_id INTEGER NOT NULL REFERENCES aerzte(id),
      gesellschaft TEXT NOT NULL,
      mitglied_seit_jahr INTEGER,
      mitgliedsstatus TEXT,
      verifiziert INTEGER DEFAULT 0,
      quelle_url TEXT
    );

    CREATE TABLE IF NOT EXISTS bewertungen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arzt_id INTEGER NOT NULL REFERENCES aerzte(id),
      plattform TEXT CHECK(plattform IN ('jameda','google','estheticon','doctolib')),
      score REAL,
      max_score REAL,
      anzahl_bewertungen INTEGER,
      UNIQUE(arzt_id, plattform)
    );

    CREATE TABLE IF NOT EXISTS promotionen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arzt_id INTEGER NOT NULL UNIQUE REFERENCES aerzte(id),
      titel TEXT,
      thema TEXT,
      universitaet TEXT,
      jahr INTEGER,
      repository_url TEXT,
      verifiziert INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS preise (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arzt_id INTEGER NOT NULL REFERENCES aerzte(id),
      eingriff TEXT NOT NULL,
      preis_von REAL,
      preis_bis REAL,
      waehrung TEXT DEFAULT 'EUR',
      quelle TEXT CHECK(quelle IN ('website','patient','selbstangabe'))
    );

    CREATE TABLE IF NOT EXISTS online_praesenz (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arzt_id INTEGER NOT NULL REFERENCES aerzte(id),
      plattform TEXT CHECK(plattform IN ('instagram','youtube','tiktok','doctolib')),
      handle TEXT,
      url TEXT,
      follower INTEGER,
      letzte_aktivitaet TEXT
    );

    CREATE TABLE IF NOT EXISTS scraper_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quelle TEXT NOT NULL,
      ziel_url TEXT,
      status TEXT CHECK(status IN ('ok','fehler','rate_limit','blocked')),
      eintraege_neu INTEGER DEFAULT 0,
      eintraege_aktualisiert INTEGER DEFAULT 0,
      laufzeit_ms INTEGER,
      zeitstempel TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_aerzte_slug ON aerzte(seo_slug);
    CREATE INDEX IF NOT EXISTS idx_aerzte_stadt ON aerzte(stadt);
    CREATE INDEX IF NOT EXISTS idx_aerzte_bundesland ON aerzte(bundesland);
    CREATE INDEX IF NOT EXISTS idx_aerzte_facharzt ON aerzte(ist_facharzt);
    CREATE INDEX IF NOT EXISTS idx_spez_arzt ON spezialisierungen(arzt_id);
    CREATE INDEX IF NOT EXISTS idx_spez_eingriff ON spezialisierungen(eingriff);
    CREATE INDEX IF NOT EXISTS idx_bewertungen_arzt ON bewertungen(arzt_id);
  `);

  return db;
}
