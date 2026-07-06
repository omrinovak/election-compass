#!/usr/bin/env node
// Fetches current Knesset factions from the official OData v4 API
// and compares against src/data/parties.json.
// If differences are found, outputs a JSON report for GitHub Actions to use.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_URL =
  'https://knesset.gov.il/OdataV4/ParliamentInfo/KNS_Faction' +
  '?$filter=KnessetNum%20eq%2025&$select=Name,KnessetNum,StartDate,FinishDate&$format=json';

// Factions we intentionally ignore (historical splits, individual MKs, etc.)
const IGNORE_LIST = [
  'חה"כ עידן רול',
  'הימין הממלכתי',
  'כחול לבן - המחנה הממלכתי',
  'נעם - בראשות אבי מעוז',
];

// Map from Knesset API faction name → our parties.json id
const KNOWN_MAPPING = {
  'הליכוד': 'likud',
  'יש עתיד': 'yesh_atid',
  'המחנה הממלכתי': 'mahaneh_mamlahti',
  'התאחדות הספרדים שומרי תורה תנועתו של מרן הרב עובדיה יוסף זצ"ל': 'shas',
  'יהדות התורה': 'yahadut_hatorah',
  'ישראל ביתנו': 'israel_beiteinu',
  'עוצמה יהודית בראשות איתמר בן גביר': 'otzma_yehudit',
  'הציונות הדתית בראשות בצלאל סמוטריץ\'': 'hazionyut_hadatit',
  'חד"ש-תע"ל': 'hadash_taal',
  'רע"מ': 'raam',
  'העבודה': 'hademokratim',
  'מרץ': 'hademokratim',
};

async function fetchFactions() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.value;
}

function loadParties() {
  const path = join(__dirname, '../src/data/parties.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

async function main() {
  const factions = await fetchFactions();
  const parties = loadParties();
  const ourIds = new Set(parties.map(p => p.id));

  const newFactions = [];
  const removedParties = [];
  const unchanged = [];

  // Check what's in API but not mapped to our data
  for (const faction of factions) {
    if (IGNORE_LIST.includes(faction.Name)) continue;
    const mappedId = KNOWN_MAPPING[faction.Name];
    if (!mappedId) {
      newFactions.push(faction.Name);
    } else if (!ourIds.has(mappedId)) {
      newFactions.push(faction.Name);
    } else {
      unchanged.push(faction.Name);
    }
  }

  // Check what's in our data but no longer in API
  const apiMappedIds = new Set(
    factions
      .filter(f => !IGNORE_LIST.includes(f.Name))
      .map(f => KNOWN_MAPPING[f.Name])
      .filter(Boolean)
  );

  for (const party of parties) {
    // Skip new parties not in Knesset 25 (pre-election parties)
    const preElectionParties = ['beyahad', 'yisrael_yashar', 'hademokratim'];
    if (preElectionParties.includes(party.id)) continue;
    if (!apiMappedIds.has(party.id)) {
      removedParties.push(party.name);
    }
  }

  const hasChanges = newFactions.length > 0 || removedParties.length > 0;

  const report = {
    hasChanges,
    newFactions,
    removedParties,
    unchanged,
    checkedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(hasChanges ? 1 : 0);
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(2);
});
