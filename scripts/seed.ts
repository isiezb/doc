import { initDb } from "../src/lib/db";

const db = initDb();

// --- Kliniken ---
const insertKlinik = db.prepare(`
  INSERT INTO kliniken (name, typ, website_url, stadt, bundesland, latitude, longitude, tuev_zertifiziert, impressum_gmbh)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const kliniken = [
  ["Dorow Clinic", "privatklinik_30", "https://dorow-clinic.de", "Waldshut-Tiengen", "Baden-Württemberg", 47.623, 8.214, 1, 1],
  ["Klinik an der Oper", "privatklinik_30", "https://klinik-an-der-oper.de", "München", "Bayern", 48.137, 11.577, 1, 1],
  ["Arteo Klinik", "praxis", "https://arteo-klinik.de", "Düsseldorf", "Nordrhein-Westfalen", 51.227, 6.773, 0, 0],
  ["Sana Klinik Plastische Chirurgie", "privatklinik_108", "https://sana.de", "Berlin", "Berlin", 52.520, 13.405, 1, 0],
  ["Aesthetic Center Frankfurt", "praxis", "https://aesthetic-center-ffm.de", "Frankfurt am Main", "Hessen", 50.110, 8.682, 0, 1],
  ["Schönheitsklinik an der Alster", "privatklinik_30", "https://alster-aesthetik.de", "Hamburg", "Hamburg", 53.551, 9.994, 1, 0],
  ["MedBeauty Kette", "schoenheitskette", "https://medbeauty.de", "Köln", "Nordrhein-Westfalen", 50.937, 6.960, 0, 1],
  ["Universitätsklinikum Freiburg – Plastische Chirurgie", "privatklinik_108", "https://uniklinik-freiburg.de/plastische-chirurgie", "Freiburg", "Baden-Württemberg", 47.999, 7.842, 1, 0],
];

const klinikIds: number[] = [];
for (const k of kliniken) {
  const info = insertKlinik.run(...k);
  klinikIds.push(Number(info.lastInsertRowid));
}

// --- Ärzte ---
const insertArzt = db.prepare(`
  INSERT INTO aerzte (vorname, nachname, titel, geschlecht, ist_facharzt, facharzttitel, selbstbezeichnung, approbation_verifiziert, kammer_id, approbation_jahr, facharzt_seit_jahr, klinik_id, position, stadt, bundesland, plz, seo_slug, website_url, datenquelle)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

interface ArztSeed {
  vorname: string; nachname: string; titel: string; geschlecht: string;
  ist_facharzt: number; facharzttitel: string | null; selbstbezeichnung: string;
  approbation_verifiziert: number; kammer_id: string | null;
  approbation_jahr: number; facharzt_seit_jahr: number | null;
  klinik_idx: number; position: string;
  stadt: string; bundesland: string; plz: string;
  slug: string; website: string | null; quelle: string;
}

const aerzte: ArztSeed[] = [
  {
    vorname: "Andreas", nachname: "Dorow", titel: "Dr. med.", geschlecht: "m",
    ist_facharzt: 1, facharzttitel: "Facharzt für Plastische und Ästhetische Chirurgie",
    selbstbezeichnung: "Facharzt für Plastische und Ästhetische Chirurgie",
    approbation_verifiziert: 1, kammer_id: "BW-2003-14521", approbation_jahr: 1998, facharzt_seit_jahr: 2005,
    klinik_idx: 0, position: "Chefarzt",
    stadt: "Waldshut-Tiengen", bundesland: "Baden-Württemberg", plz: "79761",
    slug: "dr-andreas-dorow", website: "https://dorow-clinic.de/dr-dorow", quelle: "klinik-website"
  },
  {
    vorname: "Holger", nachname: "Pult", titel: "Prof. Dr. med.", geschlecht: "m",
    ist_facharzt: 1, facharzttitel: "Facharzt für Plastische und Ästhetische Chirurgie",
    selbstbezeichnung: "Facharzt für Plastische und Ästhetische Chirurgie",
    approbation_verifiziert: 1, kammer_id: "BY-1995-08823", approbation_jahr: 1992, facharzt_seit_jahr: 1999,
    klinik_idx: 1, position: "Niedergelassen",
    stadt: "München", bundesland: "Bayern", plz: "80331",
    slug: "prof-dr-holger-pult", website: "https://klinik-an-der-oper.de/team/pult", quelle: "klinik-website"
  },
  {
    vorname: "Lina", nachname: "Becker", titel: "Dr. med.", geschlecht: "w",
    ist_facharzt: 1, facharzttitel: "Fachärztin für Plastische und Ästhetische Chirurgie",
    selbstbezeichnung: "Fachärztin für Plastische und Ästhetische Chirurgie",
    approbation_verifiziert: 1, kammer_id: "NR-2008-33102", approbation_jahr: 2005, facharzt_seit_jahr: 2013,
    klinik_idx: 2, position: "Niedergelassen",
    stadt: "Düsseldorf", bundesland: "Nordrhein-Westfalen", plz: "40212",
    slug: "dr-lina-becker", website: "https://arteo-klinik.de/dr-becker", quelle: "klinik-website"
  },
  {
    vorname: "Markus", nachname: "Richter", titel: "Dr. med.", geschlecht: "m",
    ist_facharzt: 1, facharzttitel: "Facharzt für Plastische und Ästhetische Chirurgie",
    selbstbezeichnung: "Facharzt für Plastische Chirurgie",
    approbation_verifiziert: 1, kammer_id: "BE-2001-20445", approbation_jahr: 1999, facharzt_seit_jahr: 2006,
    klinik_idx: 3, position: "Oberarzt",
    stadt: "Berlin", bundesland: "Berlin", plz: "10117",
    slug: "dr-markus-richter", website: null, quelle: "aerztekammer"
  },
  {
    vorname: "Stefan", nachname: "Weiß", titel: "Dr. med.", geschlecht: "m",
    ist_facharzt: 0, facharzttitel: null,
    selbstbezeichnung: "Ästhetischer Chirurg",
    approbation_verifiziert: 1, kammer_id: "HE-2010-44201", approbation_jahr: 2008, facharzt_seit_jahr: null,
    klinik_idx: 4, position: "Niedergelassen",
    stadt: "Frankfurt am Main", bundesland: "Hessen", plz: "60313",
    slug: "dr-stefan-weiss", website: "https://aesthetic-center-ffm.de/dr-weiss", quelle: "klinik-website"
  },
  {
    vorname: "Julia", nachname: "Schröder", titel: "Dr. med.", geschlecht: "w",
    ist_facharzt: 1, facharzttitel: "Fachärztin für Plastische und Ästhetische Chirurgie",
    selbstbezeichnung: "Fachärztin für Plastische und Ästhetische Chirurgie",
    approbation_verifiziert: 1, kammer_id: "HH-2004-18990", approbation_jahr: 2001, facharzt_seit_jahr: 2009,
    klinik_idx: 5, position: "Chefarzt",
    stadt: "Hamburg", bundesland: "Hamburg", plz: "20354",
    slug: "dr-julia-schroeder", website: "https://alster-aesthetik.de/team/schroeder", quelle: "klinik-website"
  },
  {
    vorname: "Denis", nachname: "Yilmaz", titel: "", geschlecht: "m",
    ist_facharzt: 0, facharzttitel: null,
    selbstbezeichnung: "Schönheitschirurg",
    approbation_verifiziert: 0, kammer_id: null, approbation_jahr: 2015, facharzt_seit_jahr: null,
    klinik_idx: 6, position: "Angestellt",
    stadt: "Köln", bundesland: "Nordrhein-Westfalen", plz: "50667",
    slug: "denis-yilmaz", website: null, quelle: "klinik-website"
  },
  {
    vorname: "Carolin", nachname: "Meier", titel: "PD Dr. med.", geschlecht: "w",
    ist_facharzt: 1, facharzttitel: "Fachärztin für Plastische und Ästhetische Chirurgie",
    selbstbezeichnung: "Fachärztin für Plastische und Ästhetische Chirurgie",
    approbation_verifiziert: 1, kammer_id: "BW-2006-28813", approbation_jahr: 2003, facharzt_seit_jahr: 2011,
    klinik_idx: 7, position: "Oberärztin",
    stadt: "Freiburg", bundesland: "Baden-Württemberg", plz: "79106",
    slug: "pd-dr-carolin-meier", website: "https://uniklinik-freiburg.de/team/meier", quelle: "klinik-website"
  },
  {
    vorname: "Michael", nachname: "Braun", titel: "Dr. med.", geschlecht: "m",
    ist_facharzt: 0, facharzttitel: null,
    selbstbezeichnung: "Spezialist für ästhetische Medizin",
    approbation_verifiziert: 1, kammer_id: "BY-2012-51002", approbation_jahr: 2010, facharzt_seit_jahr: null,
    klinik_idx: 1, position: "Angestellt",
    stadt: "München", bundesland: "Bayern", plz: "80331",
    slug: "dr-michael-braun", website: null, quelle: "klinik-website"
  },
  {
    vorname: "Katharina", nachname: "Fischer", titel: "Dr. med.", geschlecht: "w",
    ist_facharzt: 1, facharzttitel: "Fachärztin für Plastische und Ästhetische Chirurgie",
    selbstbezeichnung: "Fachärztin für Plastische Chirurgie",
    approbation_verifiziert: 1, kammer_id: "NR-2003-12998", approbation_jahr: 2000, facharzt_seit_jahr: 2007,
    klinik_idx: 2, position: "Niedergelassen",
    stadt: "Düsseldorf", bundesland: "Nordrhein-Westfalen", plz: "40212",
    slug: "dr-katharina-fischer", website: "https://arteo-klinik.de/dr-fischer", quelle: "klinik-website"
  },
  {
    vorname: "Thomas", nachname: "Wagner", titel: "Prof. Dr. med.", geschlecht: "m",
    ist_facharzt: 1, facharzttitel: "Facharzt für Plastische und Ästhetische Chirurgie",
    selbstbezeichnung: "Facharzt für Plastische und Ästhetische Chirurgie",
    approbation_verifiziert: 1, kammer_id: "BE-1997-09341", approbation_jahr: 1994, facharzt_seit_jahr: 2001,
    klinik_idx: 3, position: "Chefarzt",
    stadt: "Berlin", bundesland: "Berlin", plz: "10117",
    slug: "prof-dr-thomas-wagner", website: null, quelle: "aerztekammer"
  },
  {
    vorname: "Natalie", nachname: "Hoffmann", titel: "", geschlecht: "w",
    ist_facharzt: 0, facharzttitel: null,
    selbstbezeichnung: "Beauty Doc",
    approbation_verifiziert: 0, kammer_id: null, approbation_jahr: 2018, facharzt_seit_jahr: null,
    klinik_idx: 6, position: "Angestellt",
    stadt: "Köln", bundesland: "Nordrhein-Westfalen", plz: "50667",
    slug: "natalie-hoffmann", website: null, quelle: "klinik-website"
  },
];

for (const a of aerzte) {
  insertArzt.run(
    a.vorname, a.nachname, a.titel, a.geschlecht,
    a.ist_facharzt, a.facharzttitel, a.selbstbezeichnung,
    a.approbation_verifiziert, a.kammer_id, a.approbation_jahr, a.facharzt_seit_jahr,
    klinikIds[a.klinik_idx], a.position,
    a.stadt, a.bundesland, a.plz,
    a.slug, a.website, a.quelle
  );
}

// --- Spezialisierungen ---
const insertSpez = db.prepare(`
  INSERT INTO spezialisierungen (arzt_id, kategorie, eingriff, erfahrungslevel) VALUES (?, ?, ?, ?)
`);

const spezData: [number, string, string, string][] = [
  [1, "brust", "Brustvergrößerung", "spezialist"],
  [1, "brust", "Bruststraffung", "spezialist"],
  [1, "gesicht", "Facelifting", "fortgeschritten"],
  [2, "gesicht", "Facelifting", "spezialist"],
  [2, "gesicht", "Lidstraffung", "spezialist"],
  [2, "brust", "Brustvergrößerung", "fortgeschritten"],
  [3, "brust", "Brustvergrößerung", "spezialist"],
  [3, "koerper", "Fettabsaugung", "fortgeschritten"],
  [4, "koerper", "Bauchdeckenstraffung", "spezialist"],
  [4, "brust", "Brustverkleinerung", "fortgeschritten"],
  [5, "minimal_invasiv", "Botox", "fortgeschritten"],
  [5, "minimal_invasiv", "Hyaluronsäure", "fortgeschritten"],
  [6, "brust", "Brustvergrößerung", "spezialist"],
  [6, "koerper", "Fettabsaugung", "spezialist"],
  [6, "gesicht", "Nasenkorrektur", "fortgeschritten"],
  [7, "minimal_invasiv", "Botox", "basis"],
  [7, "minimal_invasiv", "Hyaluronsäure", "basis"],
  [8, "gesicht", "Nasenkorrektur", "spezialist"],
  [8, "gesicht", "Ohrenkorrektur", "spezialist"],
  [8, "koerper", "Fettabsaugung", "fortgeschritten"],
  [9, "minimal_invasiv", "Botox", "fortgeschritten"],
  [9, "minimal_invasiv", "Hyaluronsäure", "fortgeschritten"],
  [9, "gesicht", "Lidstraffung", "basis"],
  [10, "brust", "Brustvergrößerung", "spezialist"],
  [10, "brust", "Bruststraffung", "fortgeschritten"],
  [11, "koerper", "Bauchdeckenstraffung", "spezialist"],
  [11, "gesicht", "Facelifting", "spezialist"],
  [11, "brust", "Brustverkleinerung", "spezialist"],
  [12, "minimal_invasiv", "Botox", "basis"],
  [12, "minimal_invasiv", "Hyaluronsäure", "basis"],
];
for (const s of spezData) insertSpez.run(...s);

// --- Werdegang ---
const insertWerdegang = db.prepare(`
  INSERT INTO werdegang (arzt_id, typ, institution, stadt, land, von_jahr, bis_jahr, beschreibung, verifiziert)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const werdegangData = [
  [1, "studium", "Universität Ulm", "Ulm", "DE", 1990, 1997, "Studium der Humanmedizin", 1],
  [1, "klinik", "BG Unfallklinik Ludwigshafen", "Ludwigshafen", "DE", 1998, 2003, "Weiterbildung Plastische Chirurgie", 1],
  [1, "weiterbildung", "Dorow Clinic", "Waldshut-Tiengen", "DE", 2005, null, "Gründung und Leitung", 1],
  [2, "studium", "LMU München", "München", "DE", 1985, 1992, "Studium der Humanmedizin", 1],
  [2, "klinik", "Klinikum rechts der Isar", "München", "DE", 1992, 1999, "Weiterbildung Plastische Chirurgie", 1],
  [2, "promotion", "LMU München", "München", "DE", 1993, 1995, "Promotion zum Dr. med.", 1],
  [3, "studium", "Heinrich-Heine-Universität", "Düsseldorf", "DE", 1998, 2005, "Studium der Humanmedizin", 1],
  [3, "klinik", "Universitätsklinikum Düsseldorf", "Düsseldorf", "DE", 2005, 2013, "Weiterbildung Plastische Chirurgie", 1],
  [4, "studium", "Charité Berlin", "Berlin", "DE", 1992, 1999, "Studium der Humanmedizin", 1],
  [4, "klinik", "Sana Klinikum Berlin", "Berlin", "DE", 1999, 2006, "Weiterbildung Plastische Chirurgie", 1],
  [5, "studium", "Goethe-Universität", "Frankfurt", "DE", 2002, 2008, "Studium der Humanmedizin", 1],
  [5, "klinik", "Praxis", "Frankfurt", "DE", 2010, null, "Niedergelassen ohne Facharzttitel", 0],
  [6, "studium", "Universität Hamburg", "Hamburg", "DE", 1994, 2001, "Studium der Humanmedizin", 1],
  [6, "klinik", "UKE Hamburg", "Hamburg", "DE", 2001, 2009, "Weiterbildung Plastische Chirurgie", 1],
  [7, "studium", "Universität Köln", "Köln", "DE", 2008, 2015, "Studium der Humanmedizin", 0],
  [8, "studium", "Universität Freiburg", "Freiburg", "DE", 1996, 2003, "Studium der Humanmedizin", 1],
  [8, "klinik", "Universitätsklinikum Freiburg", "Freiburg", "DE", 2003, 2011, "Weiterbildung Plastische Chirurgie", 1],
  [8, "promotion", "Universität Freiburg", "Freiburg", "DE", 2004, 2007, "Promotion zum Dr. med.", 1],
  [11, "studium", "Charité Berlin", "Berlin", "DE", 1987, 1994, "Studium der Humanmedizin", 1],
  [11, "klinik", "Charité Berlin", "Berlin", "DE", 1994, 2001, "Weiterbildung Plastische Chirurgie", 1],
  [11, "promotion", "Charité Berlin", "Berlin", "DE", 1995, 1997, "Promotion zum Dr. med.", 1],
];
for (const w of werdegangData) insertWerdegang.run(...w);

// --- Mitgliedschaften ---
const insertMitglied = db.prepare(`
  INSERT INTO mitgliedschaften (arzt_id, gesellschaft, mitglied_seit_jahr, mitgliedsstatus, verifiziert, quelle_url)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const mitgliedData = [
  [1, "DGPRÄC", 2006, "Vollmitglied", 1, "https://dgpraec.de/mitgliedersuche"],
  [1, "ISAPS", 2010, "Mitglied", 1, null],
  [2, "DGPRÄC", 2000, "Vollmitglied", 1, "https://dgpraec.de/mitgliedersuche"],
  [2, "DGÄPC", 2003, "Vollmitglied", 1, null],
  [2, "EBOPRAS", 2005, "Fellow", 1, null],
  [3, "DGPRÄC", 2014, "Vollmitglied", 1, "https://dgpraec.de/mitgliedersuche"],
  [4, "DGPRÄC", 2007, "Vollmitglied", 1, "https://dgpraec.de/mitgliedersuche"],
  [6, "DGPRÄC", 2010, "Vollmitglied", 1, "https://dgpraec.de/mitgliedersuche"],
  [6, "VDÄPC", 2012, "Mitglied", 1, null],
  [8, "DGPRÄC", 2012, "Vollmitglied", 1, "https://dgpraec.de/mitgliedersuche"],
  [8, "ISAPS", 2015, "Mitglied", 1, null],
  [10, "DGPRÄC", 2008, "Vollmitglied", 1, "https://dgpraec.de/mitgliedersuche"],
  [11, "DGPRÄC", 2002, "Vollmitglied", 1, "https://dgpraec.de/mitgliedersuche"],
  [11, "DGÄPC", 2004, "Vollmitglied", 1, null],
  [11, "ISAPS", 2006, "Mitglied", 1, null],
];
for (const m of mitgliedData) insertMitglied.run(...m);

// --- Bewertungen ---
const insertBew = db.prepare(`
  INSERT INTO bewertungen (arzt_id, plattform, score, max_score, anzahl_bewertungen) VALUES (?, ?, ?, ?, ?)
`);

const bewData = [
  [1, "jameda", 1.2, 6, 187], [1, "google", 4.7, 5, 312],
  [2, "jameda", 1.0, 6, 245], [2, "google", 4.9, 5, 198],
  [3, "jameda", 1.4, 6, 89], [3, "google", 4.6, 5, 67],
  [4, "jameda", 1.8, 6, 56], [4, "google", 4.3, 5, 42],
  [5, "jameda", 2.1, 6, 34], [5, "google", 4.0, 5, 28],
  [6, "jameda", 1.1, 6, 156], [6, "google", 4.8, 5, 203],
  [7, "google", 3.2, 5, 15],
  [8, "jameda", 1.3, 6, 112], [8, "google", 4.7, 5, 89],
  [9, "jameda", 2.0, 6, 23], [9, "google", 3.8, 5, 19],
  [10, "jameda", 1.5, 6, 78], [10, "google", 4.5, 5, 56],
  [11, "jameda", 1.1, 6, 201], [11, "google", 4.8, 5, 167],
  [12, "google", 3.5, 5, 8],
];
for (const b of bewData) insertBew.run(...b);

// --- Promotionen ---
const insertPromo = db.prepare(`
  INSERT INTO promotionen (arzt_id, titel, thema, universitaet, jahr, verifiziert) VALUES (?, ?, ?, ?, ?, ?)
`);

const promoData = [
  [2, "Dr. med.", "Mikrochirurgische Lappenplastiken bei Handverletzungen", "LMU München", 1995, 1],
  [8, "Dr. med.", "Tissue Engineering in der rekonstruktiven Chirurgie", "Universität Freiburg", 2007, 1],
  [11, "Dr. med.", "Nervenrekonstruktion nach Fazialisparese", "Charité Berlin", 1997, 1],
];
for (const p of promoData) insertPromo.run(...p);

// --- Preise ---
const insertPreis = db.prepare(`
  INSERT INTO preise (arzt_id, eingriff, preis_von, preis_bis, waehrung, quelle) VALUES (?, ?, ?, ?, ?, ?)
`);

const preisData = [
  [1, "Brustvergrößerung", 6500, 9000, "EUR", "website"],
  [1, "Facelifting", 8000, 14000, "EUR", "website"],
  [2, "Facelifting", 10000, 18000, "EUR", "website"],
  [2, "Lidstraffung", 3000, 5000, "EUR", "website"],
  [3, "Brustvergrößerung", 5800, 8500, "EUR", "website"],
  [5, "Botox", 200, 600, "EUR", "website"],
  [5, "Hyaluronsäure", 300, 800, "EUR", "website"],
  [6, "Brustvergrößerung", 7000, 9500, "EUR", "website"],
  [6, "Nasenkorrektur", 5000, 9000, "EUR", "website"],
  [8, "Nasenkorrektur", 5500, 10000, "EUR", "website"],
];
for (const p of preisData) insertPreis.run(...p);

console.log("Seed-Daten erfolgreich eingefügt!");
console.log(`  ${kliniken.length} Kliniken`);
console.log(`  ${aerzte.length} Ärzte`);
console.log(`  ${spezData.length} Spezialisierungen`);
console.log(`  ${werdegangData.length} Werdegang-Einträge`);
console.log(`  ${mitgliedData.length} Mitgliedschaften`);
console.log(`  ${bewData.length} Bewertungen`);
console.log(`  ${promoData.length} Promotionen`);
console.log(`  ${preisData.length} Preise`);
