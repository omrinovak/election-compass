# Candidate research: נפתלי בנט (Naftali Bennett) — רשימת "ביחד"

Researched 2026-09-10. All facts below were verified via live web search/fetch against the cited URLs. Nothing below is inferred, estimated, or invented. Where a source could not be independently confirmed, it is omitted rather than guessed.

## 0. Resolution of the "who is the joint list's PM candidate" question

The party data file lists `beyahad` with a joint leader field ("נפתלי בנט ויאיר לפיד"). Multiple independent, reputable outlets confirm this is **now resolved**, not still an open joint arrangement:

- Naftali Bennett is confirmed as **#1 on the list and its Prime Minister candidate**; Yair Lapid is **#2**.
- Hebrew Wikipedia ("ביחד (רשימה)"): "ב-26 באפריל 2026 הודיעו בנט ולפיד כי ירוצו ברשימה משותפת, כאשר בנט מכהן כיו"ר ולפיד ממוקם במקום השני" — merger announced April 26, 2026, Bennett as chairman, Lapid in second place. https://he.wikipedia.org/wiki/%D7%91%D7%99%D7%97%D7%93_(%D7%A8%D7%A9%D7%99%D7%9E%D7%94)
- Corroborated by Kipa, Ynet, Mako/N12, Kore, Srugim, Maariv, Calcalist coverage of the list launch/finalization (September 2026), all describing "בנט ראשון, לפיד שני."
- Haaretz (English), Sept 6, 2026, on the list launch: Bennett quoted saying "We've learned our lessons" about the joint centrist slate. https://www.haaretz.com/israel-news/elections/2026-09-06/ty-article/.premium/former-pms-bennett-lapid-unveil-together-slate-for-israels-2026-election/000001a0-76db-d46f-a5ef-7ffb26180000

**Conclusion for the app maintainer:** the `beyahad.leader` field listing both names jointly is stale. Press coverage is consistent and unambiguous that Bennett is the top-of-list PM candidate and Lapid is #2 (not co-equal, and not the PM candidate). This is a factual/data-hygiene issue for the app owner to decide how to reflect, not something resolved in this research beyond reporting what the sources say.

## A. Substantial interviews (2025–2026)

1. **Channel 12 "פגוש את העיתונות" (Meet the Press), interviewers Amit Segal & Ben Caspit, June 28, 2025** (as republished on Maariv). Bennett: Netanyahu "must go home, the people want something new"; described military operations against Iran as building on groundwork laid during his own government; called for a comprehensive hostage deal; criticized coalition partners' ministries as "a jobs machine."
   - https://www.maariv.co.il/news/politics/article-1209646

2. **N12 (Channel 12), interviewer Keren Martziano, July 25, 2026**, "Weekend News" sit-down. Bennett: "אני לא אובססיבי לתפקיד, אני אובססיבי לתיקון" (I'm not obsessed with the position, I'm obsessed with the fix); on Haredi integration, opposed state funding for schools without core curriculum; declared the Bennett–Lapid partnership "will definitely not break" despite low joint polling; opposed a Palestinian state ("I absolutely oppose it... I don't cede territory, period") even as a possible Saudi normalization condition; said professional (non-political) security/legal officials would keep their posts under his government.
   - https://www.mako.co.il/news-israel-elections/2026_q3/Article-a25dddd91299f91027.htm

3. **N12 (Channel 12) "Meet the Press," August 1, 2026.** Bennett on Gadi Eisenkot: avoided naming him a PM candidate, framed his own mission as "להחליף את הממשלה הזאת ולתקן את ישראל עם ממשלת תיקון" (replace this government and fix Israel with a correction government); called for full Hamas dismantlement before concessions; proposed cutting state funding to Haredi men who neither serve nor work ("מי שלא משרת, לא מקבל שקל"); called Qatar "a terrible cancer threat" and urged designating it a hostile state; blamed the current security minister for a doubling of the murder rate.
   - https://www.mako.co.il/news-israel-elections/2026/Article-2a12c25fcaabf91026.htm

## B. Position papers / policy plans presented by Bennett personally

No signed op-ed or personal long-form essay authored by Bennett was found and verified for 2025–2026. However, one substantive, personally-presented policy briefing was verified:

- **Walla, September 3, 2026**: Bennett presented a foreign-policy platform to political correspondents ahead of the election. On Iran: "נמשיך את אסטרטגיית התמנון לגביית מחיר ישיר מאיראן" (we will continue the octopus strategy of direct price-collection from Iran). On Saudi Arabia's civilian nuclear enrichment ambitions: "נמנע העשרת אורניום באדמת סעודיה באמצעים מדיניים, שעלולה להוביל למירוץ חימוש גרעיני מסוכן באזור." On Gaza: proposed sidelining Qatar and Turkey from the day-after framework in favor of Egypt. Criticized Netanyahu for allowing the Saudi enrichment possibility without securing normalization in return.
  - https://news.walla.co.il/item/3865375

The joint party platform (education, women's status, government/constitution, "servants law" burden-sharing, cost of living, security) is documented at Polimeter but is a collectively negotiated Bennett–Lapid document, not individually authored by Bennett — treated here as background context only, not as a personal position paper.
  - https://polimeter.co.il/parties/beyahad

## C. External, named quotes about Bennett

**Positive:** Yair Golan (MK, "הדמוקרטים" leader), reacting to Bennett's public support for civil marriage, Zman Israel, April 20, 2026: "בנט, וולקאם... נישואים אזרחיים במדינה דמוקרטית ליברלית הם דבר מתבקש" (Bennett, welcome... civil marriage in a liberal democracy is the obvious thing) — Golan noted Bennett has "come a long way" from his Jewish Home roots and called this proof "only a strong liberal Israel will win."
   - https://www.zman.co.il/live/681395/

**Negative:** Gadi Eisenkot (former IDF Chief of Staff, party chair), on Channel 12's "Meet the Press," March 28, 2026, rejecting Bennett's merger overture: "לא עזבתי את בני גנץ כמספר שתיים כדי להיות מספר שתיים של בנט" (I didn't leave [as] Gantz's number two in order to be Bennett's number two) — a pointed public refusal to subordinate himself to Bennett, confirmed across multiple outlets.
   - https://www.mako.co.il/news-politics/2026_q1/Article-12887de35b33d91026.htm (primary date/quote confirmation)
   - Corroborated by: https://news.walla.co.il/item/3826878 , https://www.ice.co.il/local-news/news/article/1107743 , https://www.inn.co.il/news/693348

## D. Derived axis scores (1–7 scale, calibrated against existing `parties.json` entries)

| Axis | Score | Confidence | Basis |
|---|---|---|---|
| security | 6 | 0.6 | Opposes Palestinian statehood outright, "octopus strategy" against Iran, insists on full Hamas dismantlement before any concessions (mako, Aug 1 2026; walla, Sep 3 2026). |
| liberty_vs_security | 2.5 | 0.5 | Consistently security-first framing across all three interviews; territorial/security hawkishness outweighs liberty framing. |
| foreign_relations | 5.5 | 0.45 | Personally presented a US-relations rebuilding plan and a Saudi-normalization red line (walla, Sep 3 2026); active diplomatic engagement, but combined with confrontational stance toward Qatar/Turkey. |
| settlement | 5.5 | 0.5 | "I don't cede territory, period" (mako, Jul 25 2026); consistent with the existing party gap note that Bennett expanded settlements while PM in 2021–22. |
| religion_state | 5.5 | 0.4 | Recent public embrace of civil marriage, welcomed by Yair Golan as a shift from his religious-right origins (Zman, Apr 20 2026); one data point only, hence capped confidence. |
| rule_of_law | 5.5 | 0.45 | Pledged professional (non-political) security/legal officials keep their posts, pledged a state commission of inquiry into Oct. 7 "on day one" (mako, Jul 25/Aug 1 2026). |
| authority_vs_checks | 3 | 0.4 | Pledges to insulate professional officials from political pressure and to pursue a written constitution, but combines this with strong personal-mandate rhetoric ("my life's mission"). |
| ideology_vs_pragmatism | 6 | 0.5 | Explicitly frames himself as fix-oriented rather than office-oriented ("not obsessed with the position, obsessed with the fix"); history of cross-ideological coalition-building (2021 government). |
| experience_vs_renewal | 2 | 0.6 | Former Prime Minister (2021–22) and multiple past ministerial portfolios; unambiguously the "experience" end of the axis. |
| stability_vs_opposition | 3.5 | 0.4 | Positions himself as replacing the current government via a broad "correction government," i.e. change-oriented rather than status-quo, but seeks to govern rather than remain in permanent opposition. |
| cost_of_living | 4.5 | 0.4 | Proposes redirecting state funds via "servants law" (benefits tied to service/work) rather than a dedicated cost-of-living program of his own; less personally-authored material here than for Lapid. |

Axes with no candidate-specific (as opposed to party-platform-level) verified evidence — economy, equality_vs_free_market, individual_vs_state, tradition_vs_liberalism, education, health, welfare, environment, transport, housing — are omitted per instructions rather than guessed.

## Caveats

- The joint "servants law" / burden-sharing and education planks are Bennett–Lapid joint-party positions (Polimeter), not attributable to Bennett individually with confidence, so they were not used to score education/welfare axes for Bennett personally.
- No independently-verified signed op-ed by Bennett was found for 2025–2026; the "position paper" listed above is a reported policy briefing to journalists, not a published essay.
