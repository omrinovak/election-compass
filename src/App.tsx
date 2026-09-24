import { useState, useCallback } from 'react';
import Welcome from './components/Welcome';
import Questionnaire from './components/Questionnaire';
import TutorialOverlay from './components/TutorialOverlay';
import Priorities from './components/Priorities';
import Loading from './components/Loading';
import Results from './components/Results';
import VotePage from './components/VotePage';
import Admin from './components/Admin';
import type { Answer, PartyResult } from './utils/matching';
import { calculateResultsAndProfile } from './utils/matching';
import type { CompareLinkPayload } from './utils/compareLink';
import { decodeCompareProfile } from './utils/compareLink';

type Screen = 'welcome' | 'tutorial' | 'questionnaire' | 'priorities' | 'loading' | 'vote' | 'results' | 'admin';

function readFriendProfileFromUrl(): CompareLinkPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('cmp');
  if (!raw) return null;
  return decodeCompareProfile(raw);
}

export type QuestionnaireAnswerMap = Map<string, { value: number; confidence: number }>;

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [results, setResults] = useState<PartyResult[]>([]);
  const [axisProfile, setAxisProfile] = useState<Record<string, number>>({});
  const [friendProfile] = useState<CompareLinkPayload | null>(() => readFriendProfileFromUrl());

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
      const { results: r, axisProfile: ap } = calculateResultsAndProfile(answers, p);
      setResults(r);
      setAxisProfile(ap);
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
    setQuestionnaireDraft({ answers: new Map(), index: 0 });
    setPrioritiesDraft(new Set());
    setScreen('welcome');
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
          friendProfile={friendProfile}
        />
      )}
      {screen === 'admin' && <Admin onClose={() => setScreen('welcome')} />}
    </>
  );
}
