#!/usr/bin/env node
/**
 * Fetches a specific Knesset plenum vote (title search + optional date range)
 * directly from the live Knesset OData v4 API, maps each MK to a party id in
 * parties.json, and prints:
 *   1. A per-party for/against tally (for manual sanity-checking against news).
 *   2. A ready-to-paste anchor-votes.json entry skeleton (axes left as TODO —
 *      picking axis/pole is an editorial judgment call, not automatable).
 *
 * Usage:
 *   node scripts/fetch-knesset-vote.mjs "לימוד תורה"
 *   node scripts/fetch-knesset-vote.mjs "שירות ביטחון" --after 2026-07-01
 *
 * Data source discovered 2026-08-06/07 — see docs/knesset-api-research.md
 * for why this endpoint (not the legacy Odata/Votes.svc v3 one) is used.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BASE = 'https://knesset.gov.il/OdataV4/ParliamentInfo';

// Same convention as sync-parties.js — keep both in sync.
const FACTION_TO_PARTY = {
  'הליכוד': 'likud',
  'יש עתיד': 'beyahad',
  'כחול לבן - המחנה הממלכתי': 'mahaneh_mamlahti',
  'התאחדות הספרדים שומרי תורה תנועתו של מרן הרב עובדיה יוסף זצ"ל': 'shas',
  'יהדות התורה': 'yahadut_hatorah',
  'ישראל ביתנו': 'israel_beiteinu',
  'עוצמה יהודית בראשות איתמר בן גביר': 'otzma_yehudit',
  'הציונות הדתית בראשות בצלאל סמוטריץ\'': 'hazionyut_hadatit',
  'חד"ש-תע"ל': 'hadash_taal',
  'רע"ם': 'raam',
  'העבודה': 'hademokratim',
  'מרץ': 'hademokratim',
};
// Factions we deliberately don't map to a party id (see sync-parties.js IGNORE_LIST).
const IGNORED_FACTIONS = ['נעם - בראשות אבי מעוז', 'הימין הממלכתי'];

async function fetchAllPages(url) {
  let all = [];
  let skip = 0;
  for (;;) {
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}$top=100&$skip=${skip}&$format=json`);
    if (!res.ok) throw new Error(`API error ${res.status} for ${url}`);
    const data = await res.json();
    all = all.concat(data.value);
    if (data.value.length < 100) break;
    skip += 100;
  }
  return all;
}

async function findFinalVote(titleSearch, after) {
  const encoded = encodeURIComponent(titleSearch);
  let filter = `contains(VoteTitle,'${encoded.replace(/%20/g, ' ')}')`;
  // Note: OData needs the raw string, not URI-encoded, inside the filter text itself.
  filter = `contains(VoteTitle,'${titleSearch}')`;
  if (after) filter += ` and VoteDateTime ge ${after}T00:00:00Z`;
  const url = `${BASE}/KNS_PlenumVote?$filter=${encodeURIComponent(filter)}&$orderby=VoteDateTime desc`;
  const votes = await fetchAllPages(url);
  if (votes.length === 0) return null;
  // Prefer the final reading vote if present, else the most recent.
  const final = votes.find(v => (v.ForOptionDesc || '').includes('קריאה שלישית'));
  return final || votes[0];
}

async function fetchVoteResults(voteId) {
  const url = `${BASE}/KNS_PlenumVoteResult?$filter=VoteID eq ${voteId}`;
  return fetchAllPages(url);
}

async function fetchFactionRoster(knessetNum) {
  const url = `${BASE}/KNS_PersonToPosition?$filter=KnessetNum eq ${knessetNum} and FactionName ne null`;
  return fetchAllPages(url);
}

async function fetchAllCurrentPersons() {
  const url = `${BASE}/KNS_Person?$filter=IsCurrent eq true`;
  return fetchAllPages(url);
}

function buildPersonFactionMap(factionRows, voteDate) {
  const map = {};
  for (const r of factionRows) {
    const start = new Date(r.StartDate);
    if (start > voteDate) continue;
    const finish = r.FinishDate ? new Date(r.FinishDate) : null;
    if (finish && finish < voteDate) continue;
    const prev = map[r.PersonID];
    if (!prev || start > prev.start) map[r.PersonID] = { faction: r.FactionName.trim(), start };
  }
  return map;
}

function norm(s) {
  return (s || '').replace(/['"׳״]/g, '').replace(/\s+/g, ' ').trim();
}

async function main() {
  const args = process.argv.slice(2);
  const titleSearch = args[0];
  if (!titleSearch) {
    console.error('Usage: node scripts/fetch-knesset-vote.mjs "<title search text>" [--after YYYY-MM-DD]');
    process.exit(1);
  }
  const afterIdx = args.indexOf('--after');
  const after = afterIdx !== -1 ? args[afterIdx + 1] : undefined;

  console.error(`Searching for vote matching "${titleSearch}"${after ? ` after ${after}` : ''}...`);
  const vote = await findFinalVote(titleSearch, after);
  if (!vote) {
    console.error('No matching vote found.');
    process.exit(1);
  }
  const voteDate = new Date(vote.VoteDateTime);
  console.error(`Found: [${vote.Id}] ${vote.VoteTitle} — ${vote.VoteDateTime} (${vote.ForOptionDesc})`);

  const [results, factionRows, persons] = await Promise.all([
    fetchVoteResults(vote.Id),
    fetchFactionRoster(25),
    fetchAllCurrentPersons(),
  ]);

  const personFaction = buildPersonFactionMap(factionRows, voteDate);
  const nameToPersonId = {};
  for (const p of persons) nameToPersonId[norm(p.FirstName) + '|' + norm(p.LastName)] = p.Id;

  const tally = {};
  const unmapped = [];
  for (const r of results) {
    const key = norm(r.FirstName) + '|' + norm(r.LastName);
    const personId = nameToPersonId[key];
    const info = personId != null ? personFaction[personId] : undefined;
    const partyId = info?.faction ? FACTION_TO_PARTY[info.faction] : undefined;
    const res = r.ResultDesc.trim();
    if (!partyId) {
      if (!info?.faction || !IGNORED_FACTIONS.includes(info.faction)) {
        unmapped.push({ name: `${r.FirstName} ${r.LastName}`, faction: info?.faction, result: res });
      }
      continue;
    }
    tally[partyId] = tally[partyId] || { for: 0, against: 0 };
    if (res === 'בעד') tally[partyId].for++; else tally[partyId].against++;
  }

  const totalFor = results.filter(r => r.ResultDesc.trim() === 'בעד').length;
  const totalAgainst = results.filter(r => r.ResultDesc.trim() === 'נגד').length;

  console.error(`\nOfficial result: ${totalFor} for / ${totalAgainst} against (${results.length} votes cast)\n`);
  console.error('Per-party tally:');
  for (const [id, t] of Object.entries(tally)) {
    console.error(`  ${id}: ${t.for} for / ${t.against} against  → majority: ${t.for >= t.against ? 'for' : 'against'}`);
  }
  if (unmapped.length) {
    console.error(`\n${unmapped.length} unmapped votes (not in any tracked party — usually fine, e.g. Noam / Sa'ar's technical bloc):`);
    for (const u of unmapped) console.error(`  ${u.name} (${u.faction || 'unknown faction'}): ${u.result}`);
  }

  const parties = JSON.parse(readFileSync(join(root, 'src/data/parties.json'), 'utf8'));
  const allPartyIds = parties.map(p => p.id);
  const factions = {};
  for (const id of allPartyIds) {
    factions[id] = tally[id] ? (tally[id].for >= tally[id].against ? 'for' : 'against') : 'absent';
  }

  console.error('\n--- anchor-votes.json entry skeleton (fill in id/description/axes) ---\n');
  const entry = {
    id: 'TODO_short_id_' + vote.Id,
    knesset: 25,
    date: vote.VoteDateTime.slice(0, 10),
    title: vote.VoteTitle,
    description: `TODO — אושר ${totalFor} בעד מול ${totalAgainst} נגד.`,
    source: `הצבעת מליאה — נמשך ואומת ישירות מ-API הכנסת (OdataV4/ParliamentInfo, VoteID ${vote.Id})`,
    weight: 'TODO (1.0-2.0 based on significance)',
    axes: ['TODO: [{ "axis": "...", "pole": "min|max" }]'],
    factions,
  };
  console.log(JSON.stringify(entry, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
