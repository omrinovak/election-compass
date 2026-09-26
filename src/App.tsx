import { useState, useCallback } from 'react';
import Welcome from './components/Welcome';
import Questionnaire from './components/Questionnaire';
import TutorialOverlay from './components/TutorialOverlay';
import Priorities from './components/Priorities';
import Loading from './components/Loading';
import Results from './components/Results';
import VotePage from './components/VotePage';
import Admin from './components/Admin';
import type { Answer, PartyResult, WeightedUserProfile } from './utils/matching';
import { calculateResultsAndProfile, calculateResultsFromProfile, axisProfileFromUserProfile } from './utils/matching';
import type { CompareLinkPayload } from './utils/compareLink';
import { decodeCompareProfile } from './utils/compareLink';
import { decodeSavedResults } from './utils/savedResultsLink';

type Screen = 'welcome' | 'tutorial' | 'questionnaire' | 'priorities' | 'loading' | 'vote' | 'results' | 'admin';

function readFriendProfileFromUrl(): CompareLinkPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('cmp');
  if (!raw) return null;
  return decodeCompareProfile(raw);
}

// Lets an emailed "save my results" link (see Results.tsx's EmailResultsBox) reopen straight
// into the full results screen — including the top party's complete candidate breakdown — without
// re-running the questionnaire, by reconstructing the same weighted per-axis profile the original
// session had.
function readSavedResultsFromUrl(): { profile: WeightedUserProfile; priorities: string[] } | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('saved');
  if (!raw) return null;
  return decodeSavedResults(raw);
}

export type QuestionnaireAnswerMap = Map<string, { value: number; confidence: number }>;

export default function App() {
  const [savedResults] = useState(() => readSavedResultsFromUrl());
  const [screen, setScreen] = useState<Screen>(() => (savedResults ? 'results' : 'welcome'));
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [priorities, setPriorities] = useState<string[]>(() => savedResults?.priorities ?? []);
  const [results, setResults] = useState<PartyResult[]>(() =>
    savedResults ? calculateResultsFromProfile(savedResults.profile) : []
  );
  const [axisProfile, setAxisProfile] = useState<Record<string, number>>(() =>
    savedResults ? axisProfileFromUserProfile(savedResults.profile) : {}
  );
  const [weightedProfile, setWeightedProfile] = useState<WeightedUserProfile>(() => savedResults?.profile ?? {});
  const [friendProfile, setFriendProfile] = useState<CompareLinkPayload | null>(() => readFriendProfileFromUrl());

  // In-progress questionnaire/priorities state lives here (not inside Questionnaire/Priorities'
  // own useState) so it survives the unmount that happens when the user navigates Priorities ->
  // back -> Questionnaire (App conditionally mounts one screen at a time by `screen`). Without
  // this, going back silently discarded every answer — see .claude/agents/data-integrity-guardian.md.
  const [questionnaireDraft, setQuestionnaireDraft] = useState<{ answers: QuestionnaireAnswerMap; index: number }>({
    answers: new Map(),
    index: 0,
  });
  const [prioritiesDraft, setPrioritiesDraft] = useState<Set<string>>(new Set());

  const handleQuestionnaireComplete = useCallback((a: Answer[]) => {
    setAnswers(a);
    setScreen('priorities');
  }, []);

  const handlePrioritiesComplete = useCallback((p: string[]) => {
    setPriorities(p);
    setScreen('loading');
    setTimeout(() => {
      const { results: r, axisProfile: ap, weightedProfile: wp } = calculateResultsAndProfile(answers, p);
      setResults(r);
      setAxisProfile(ap);
      setWeightedProfile(wp);
      setScreen('vote');
      if (r.length > 0 && typeof window !== 'undefined' && (window as any).umami) {
        (window as any).umami.track('quiz_completed', {
          top_party: r[0].id,
          top_score: Math.round(r[0].overallScore * 100),
          answers_count: answers.length,
        });
      }
    }, 1500);
  }, [answers]);

  const handleRestart = useCallback(() => {
    setAnswers([]);
    setPriorities([]);
    setResults([]);
    setAxisProfile({});
    setWeightedProfile({});
    setFriendProfile(null);
    setQuestionnaireDraft({ answers: new Map(), index: 0 });
    setPrioritiesDraft(new Set());
    setScreen('welcome');
    // Clears both restore-from-URL params (not just `saved`) — otherwise a restart after opening
    // a `?cmp=` friend-compare link left the compare banner reappearing on Welcome (friendProfile
    // had no setter before this) even though the user explicitly asked to start over.
    if (typeof window !== 'undefined' && (window.location.search.includes('saved=') || window.location.search.includes('cmp='))) {
      const url = new URL(window.location.href);
      url.searchParams.delete('saved');
      url.searchParams.delete('cmp');
      window.history.replaceState({}, '', url);
    }
  }, []);

  return (
    <>
      {screen === 'welcome' && <Welcome onStart={() => setScreen('tutorial')} onAdmin={() => setScreen('admin')} friendProfile={friendProfile} />}
      {screen === 'tutorial' && <TutorialOverlay onDone={() => setScreen('questionnaire')} />}
      {screen === 'questionnaire' && (
        <Questionnaire
          initialAnswers={questionnaireDraft.answers}
          initialIndex={questionnaireDraft.index}
          onStateChange={(a, index) => setQuestionnaireDraft({ answers: a, index })}
          onComplete={handleQuestionnaireComplete}
        />
      )}
      {screen === 'priorities' && (
        <Priorities
          initialSelected={prioritiesDraft}
          onSelectedChange={setPrioritiesDraft}
          onComplete={handlePrioritiesComplete}
          onBack={() => setScreen('questionnaire')}
        />
      )}
      {screen === 'loading' && <Loading />}
      {screen === 'vote' && <VotePage onContinue={() => setScreen('results')} />}
      {screen === 'results' && (
        <Results
          results={results}
          priorities={priorities}
          onRestart={handleRestart}
          axisProfile={axisProfile}
          weightedProfile={weightedProfile}
          friendProfile={friendProfile}
        />
      )}
      {screen === 'admin' && <Admin onClose={() => setScreen('welcome')} />}
    </>
  );
}
