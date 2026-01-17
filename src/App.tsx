import { useState, useEffect, useMemo, useRef } from 'react';
import { format, addDays, differenceInDays } from 'date-fns';
import { Thread, UserFocus, Decision, LearningState } from './types';
import { mockThreads } from './data/mockThreads';
import { loadLearningState, handleFeedback, resetDemo } from './logic/learning';
import { makeDecision, computeTimingState } from './logic/decision';
import { FocusPanel } from './components/FocusPanel';
import { ThreadList } from './components/ThreadList';
import { DecisionCard } from './components/DecisionCard';
import { RestraintMetrics } from './components/RestraintMetrics';
import { NormsTable } from './components/NormsTable';
import { AddThreadModal } from './components/AddThreadModal';
import { NotificationBanner } from './components/NotificationBanner';
import { Toast } from './components/Toast';
import { NotificationCenter } from './components/NotificationCenter';
import { hasAIKey } from './ai/client';
import { aiNormalizeFit } from './ai/fit';
import { aiPolishNudge } from './ai/tone';
import { FitAIOutput, PolishOutput } from './ai/types';
import { computeFitScoreDetailed } from './logic/fit';

const FOCUS_STORAGE_KEY = 'coffeechatted_focus';
const USER_THREADS_KEY = 'coffeechatted_userThreads';

function loadUserFocus(): UserFocus {
  const stored = localStorage.getItem(FOCUS_STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { }
  }
  return {
    targetIndustry: 'Investment Banking',
    targetRole: 'TMT',
    recruitingStage: 'Networking',
  };
}

function loadUserThreads(): Thread[] {
  const stored = localStorage.getItem(USER_THREADS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { }
  }
  return [];
}

const START_DATE = new Date('2024-01-01');

export default function App() {
  const [userFocus, setUserFocus] = useState<UserFocus>(loadUserFocus);
  const [learningState, setLearningState] = useState<LearningState>(loadLearningState);
  const [userThreads, setUserThreads] = useState<Thread[]>(loadUserThreads);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [daysOffset, setDaysOffset] = useState<number>(20); // Slider control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastThread, setToastThread] = useState<{ thread: Thread; decision: Decision } | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [aiFitCache, setAiFitCache] = useState<Map<string, FitAIOutput>>(new Map());
  const [aiToneCache, setAiToneCache] = useState<Map<string, PolishOutput>>(new Map());
  const aiFitLoadingRef = useRef<Set<string>>(new Set());
  const aiToneLoadingRef = useRef<Set<string>>(new Set());
  const [prevNudgeId, setPrevNudgeId] = useState<string | null>(null);

  // Always-on features
  const aiAssistEnabled = true;
  const notificationMode = true;

  const simulatedToday = useMemo(() => addDays(START_DATE, daysOffset), [daysOffset]);

  useEffect(() => {
    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(userFocus));
  }, [userFocus]);

  useEffect(() => {
    localStorage.setItem(USER_THREADS_KEY, JSON.stringify(userThreads));
  }, [userThreads]);

  const effectiveThreads = useMemo(() => {
    const allThreads = [...mockThreads, ...userThreads];
    return allThreads.map(thread => {
      const override = learningState.threadOverrides[thread.id] || {};
      return { ...thread, ...override };
    });
  }, [learningState.threadOverrides, userThreads]);

  // Selected thread helper
  const selectedThread = useMemo(() => {
    return effectiveThreads.find(t => t.id === selectedThreadId) || effectiveThreads[0];
  }, [effectiveThreads, selectedThreadId]);

  // AI Fit result for selected thread
  const selectedThreadAiFit = useMemo(() => {
    if (!selectedThread || !aiAssistEnabled) return null;
    const cacheKey = `${selectedThread.id}-${userFocus.targetIndustry}-${userFocus.targetRole}`;
    return aiFitCache.get(cacheKey) || null;
  }, [selectedThread, aiFitCache, userFocus, aiAssistEnabled]);

  // Compute decisions for all threads (with AI fit for selected thread)
  const decisions = useMemo(() => {
    return effectiveThreads.map(thread => {
      const aiFit = (thread.id === selectedThread?.id) ? selectedThreadAiFit : null;
      return makeDecision(thread, userFocus, simulatedToday, learningState, aiFit);
    });
  }, [effectiveThreads, userFocus, simulatedToday, learningState, selectedThread?.id, selectedThreadAiFit]);

  // Fetch AI fit for selected thread when enabled
  useEffect(() => {
    if (!aiAssistEnabled || !selectedThread || !hasAIKey()) return;
    const cacheKey = `${selectedThread.id}-${userFocus.targetIndustry}-${userFocus.targetRole}`;
    if (aiFitCache.has(cacheKey) || aiFitLoadingRef.current.has(cacheKey)) return;

    aiFitLoadingRef.current.add(cacheKey);

    aiNormalizeFit({ thread: selectedThread, userFocus })
      .then(result => {
        if (result) setAiFitCache(prev => new Map(prev).set(cacheKey, result));
      })
      .finally(() => {
        aiFitLoadingRef.current.delete(cacheKey);
      });
  }, [selectedThread, userFocus, aiAssistEnabled, aiFitCache]);

  const activeNudge = useMemo(() => {
    const nudgeIndex = decisions.findIndex(d => d.shouldNudge);
    if (nudgeIndex !== -1) {
      return { thread: effectiveThreads[nudgeIndex], decision: decisions[nudgeIndex] };
    }
    return null;
  }, [decisions, effectiveThreads]);

  // Toast logic
  useEffect(() => {
    if (notificationMode && activeNudge && activeNudge.thread.id !== prevNudgeId) {
      setToastThread(activeNudge);
      setShowToast(true);
      setPrevNudgeId(activeNudge.thread.id);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    } else if (!activeNudge) {
      setPrevNudgeId(null);
    }
  }, [activeNudge, notificationMode, prevNudgeId]);

  const selectedDecision = useMemo(() => {
    if (!selectedThread) return decisions[0];
    const idx = effectiveThreads.findIndex(t => t.id === selectedThread.id);
    return idx !== -1 ? decisions[idx] : decisions[0];
  }, [decisions, selectedThread, effectiveThreads]);

  // Fetch AI tone for selected decision
  useEffect(() => {
    if (!aiAssistEnabled || !selectedThread || !selectedDecision || !hasAIKey()) return;
    if (!selectedDecision.shouldNudge && selectedDecision.nudgeType !== 'DO_NOTHING_YET') return;

    const cacheKey = `${selectedThread.id}-${selectedDecision.daysSince}-${selectedDecision.shouldNudge}`;
    if (aiToneCache.has(cacheKey) || aiToneLoadingRef.current.has(cacheKey)) return;

    const windowShift = learningState.windowShifts[selectedThread.interactionType] || 0;
    aiToneLoadingRef.current.add(cacheKey);

    aiPolishNudge({ thread: selectedThread, decision: selectedDecision, windowShift })
      .then(result => {
        if (result) setAiToneCache(prev => new Map(prev).set(cacheKey, result));
      })
      .finally(() => {
        aiToneLoadingRef.current.delete(cacheKey);
      });
  }, [selectedThread, selectedDecision, aiAssistEnabled, learningState.windowShifts, aiToneCache]);

  const selectedDecisionAiTone = useMemo(() => {
    if (!selectedThread || !selectedDecision || !aiAssistEnabled) return null;
    const cacheKey = `${selectedThread.id}-${selectedDecision.daysSince}-${selectedDecision.shouldNudge}`;
    return aiToneCache.get(cacheKey) || null;
  }, [selectedThread, selectedDecision, aiToneCache, aiAssistEnabled]);

  const selectedThreadFitDetails = useMemo(() => {
    if (!selectedThread) return null;
    return computeFitScoreDetailed(selectedThread, userFocus, selectedThreadAiFit);
  }, [selectedThread, userFocus, selectedThreadAiFit]);

  const handleThreadFeedback = (type: any) => {
    if (!selectedThread || !selectedDecision) return;
    const newState = handleFeedback(
      selectedThread.id, type, selectedThread.interactionType, 
      learningState, simulatedToday, selectedThread.name, selectedDecision.confidenceScore
    );
    setLearningState(newState);
  };

  const nudgesInLast7Days = useMemo(() => {
    const sevenAgo = addDays(simulatedToday, -7);
    return learningState.nudgeHistory.filter(n => new Date(n.date) >= sevenAgo && new Date(n.date) <= simulatedToday).length;
  }, [learningState.nudgeHistory, simulatedToday]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-coffee-100">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">CoffeeChatted</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">A quiet follow-up guardrail for recruiting.</p>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => { resetDemo(); window.location.reload(); }} className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors">Reset Demo</button>
            <button onClick={() => setIsNotificationCenterOpen(true)} className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              {learningState.nudgeRecords?.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-coffee-500 rounded-full border-2 border-white"></span>}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        {activeNudge && (
          <NotificationBanner
            thread={activeNudge.thread}
            decision={activeNudge.decision}
            onView={() => setSelectedThreadId(activeNudge.thread.id)}
            onNotNow={() => handleFeedback(activeNudge.thread.id, 'notNow', activeNudge.thread.interactionType, learningState, simulatedToday, activeNudge.thread.name, activeNudge.decision.confidenceScore)}
            onDismiss={() => handleFeedback(activeNudge.thread.id, 'dismiss', activeNudge.thread.interactionType, learningState, simulatedToday, activeNudge.thread.name, activeNudge.decision.confidenceScore)}
          />
        )}
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-gray-800">Conversations</h2>
            <button onClick={() => setIsAddModalOpen(true)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-coffee-500 hover:border-coffee-200 hover:bg-coffee-50 transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </button>
          </div>
          <ThreadList
            threads={effectiveThreads}
            selectedThreadId={selectedThreadId}
            onSelectThread={setSelectedThreadId}
            userFocus={userFocus}
            getTimingState={(t) => {
              const days = differenceInDays(simulatedToday, new Date(t.lastInteractionDate));
              const shift = learningState.windowShifts[t.interactionType] || 0;
              return computeTimingState(days, t.interactionType, shift);
            }}
            onAddThreadClick={() => setIsAddModalOpen(true)}
          />
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FocusPanel focus={userFocus} onFocusChange={setUserFocus} />
            <NormsTable />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Simulated Today</h3>
                <p className="text-sm text-gray-500">Slide to see when the system stays silent vs nudges.</p>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-bold text-coffee-600">{format(simulatedToday, 'MMM d, yyyy')}</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Day {daysOffset}</span>
              </div>
            </div>
            <input 
              type="range" min="0" max="60" value={daysOffset} 
              onChange={e => setDaysOffset(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-coffee-600"
            />
          </div>

          {selectedThread && selectedDecision && (
            <DecisionCard
              decision={selectedDecision}
              thread={selectedThread}
              onFeedback={handleThreadFeedback}
              showStillRelevant={selectedDecision.fitScore < 0.75 && !selectedThread.overrideFit}
              aiFitUsed={selectedThreadFitDetails?.aiUsed || false}
              aiFitExplanation={selectedThreadAiFit?.explanation}
              aiToneUsed={!!selectedDecisionAiTone}
              aiPolish={selectedDecisionAiTone}
            />
          )}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 pb-12">
        <RestraintMetrics
          threads={effectiveThreads}
          decisions={decisions}
          nudgeHistoryCount={nudgesInLast7Days}
        />
      </footer>

      <AddThreadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={(t) => setUserThreads([...userThreads, {...t, id: `user-${Date.now()}`}])} />
      {showToast && toastThread && <Toast thread={toastThread.thread} onClose={() => setShowToast(false)} />}
      <NotificationCenter isOpen={isNotificationCenterOpen} onClose={() => setIsNotificationCenterOpen(false)} nudgeRecords={learningState.nudgeRecords || []} />
    </div>
  );
}