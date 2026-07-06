import { useState, useCallback } from 'react';
import Welcome from './components/Welcome';
import Questionnaire from './components/Questionnaire';
import Priorities from './components/Priorities';
import Loading from './components/Loading';
import Results from './components/Results';
import VotePage from './components/VotePage';
import Admin from './components/Admin';
import type { Answer, PartyResult } from './utils/matching';
import { calculateResults } from './utils/matching';

type Screen = 'welcome' | 'questionnaire' | 'priorities' | 'loading' | 'vote' | 'results' | 'admin';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [results, setResults] = useState<PartyResult[]>([]);

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
      setScreen('vote');
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
      {screen === 'welcome' && <Welcome onStart={() => setScreen('questionnaire')} onAdmin={() => setScreen('admin')} />}
      {screen === 'questionnaire' && <Questionnaire onComplete={handleQuestionnaireComplete} />}
      {screen === 'priorities' && <Priorities onComplete={handlePrioritiesComplete} onBack={() => setScreen('questionnaire')} />}
      {screen === 'loading' && <Loading />}
      {screen === 'vote' && <VotePage onContinue={() => setScreen('results')} />}
      {screen === 'results' && <Results results={results} priorities={priorities} onRestart={handleRestart} />}
      {screen === 'admin' && <Admin onClose={() => setScreen('welcome')} />}
    </>
  );
}
