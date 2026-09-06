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
import { calculateResults, getAxisProfile } from './utils/matching';
import type { CompareLinkPayload } from './utils/compareLink';
import { decodeCompareProfile } from './utils/compareLink';

type Screen = 'welcome' | 'tutorial' | 'questionnaire' | 'priorities' | 'loading' | 'vote' | 'results' | 'admin';

function readFriendProfileFromUrl(): CompareLinkPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('cmp');
  if (!raw) return null;
  return decodeCompareProfile(raw);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [results, setResults] = useState<PartyResult[]>([]);
  const [axisProfile, setAxisProfile] = useState<Record<string, number>>({});
  const [friendProfile] = useState<CompareLinkPayload | null>(() => readFriendProfileFromUrl());

  const handleQuestionnaireComplete = useCallback((a: Answer[]) => {
    setAnswers(a);
    setScreen('priorities');
  }, []);

  const handlePrioritiesComplete = useCallback((p: string[]) => {
    setPriorities(p);
    setScreen('loading');
    setTimeout(() => {
      const r = calculateResults(answers, p);
      setResults(r);
      setAxisProfile(getAxisProfile(answers, p));
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
    setScreen('welcome');
  }, []);

  return (
    <>
      {screen === 'welcome' && <Welcome onStart={() => setScreen('tutorial')} onAdmin={() => setScreen('admin')} friendProfile={friendProfile} />}
      {screen === 'tutorial' && <TutorialOverlay onDone={() => setScreen('questionnaire')} />}
      {screen === 'questionnaire' && <Questionnaire onComplete={handleQuestionnaireComplete} />}
      {screen === 'priorities' && <Priorities onComplete={handlePrioritiesComplete} onBack={() => setScreen('questionnaire')} />}
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
