import { Thread, TimingState, UserFocus } from '../types';
import { getFitBucket, computeFitScore } from '../logic/fit';

interface ThreadListProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  userFocus: UserFocus;
  getTimingState: (thread: Thread) => TimingState;
  onAddThreadClick: () => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  userFocus,
  getTimingState,
}: ThreadListProps) {
  return (
    <div className="space-y-3">
      {threads.map((thread) => {
        const fitScore = computeFitScore(thread, userFocus);
        const fitBucket = getFitBucket(fitScore);
        const timingState = getTimingState(thread);
        const isSelected = selectedThreadId === thread.id;
        const isDone = thread.followupAlreadySent;

        return (
          <button
            key={thread.id}
            onClick={() => onSelectThread(thread.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
              isSelected
                ? 'bg-white border-coffee-200 shadow-md ring-1 ring-coffee-50'
                : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
            } ${isDone ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gray-800 truncate">{thread.name}</h4>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">{thread.company} • {thread.roleTitle}</p>
              </div>
              {isDone && (
                <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                </div>
              )}
            </div>
            
            <div className="flex gap-1.5 flex-wrap">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                timingState === 'OPTIMAL' ? 'bg-coffee-50 text-coffee-600' : 
                timingState === 'LATE' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'
              }`}>
                {timingState.replace('_', ' ')}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                fitBucket === 'High' ? 'bg-green-50 text-green-600' : 
                fitBucket === 'Med' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'
              }`}>
                {fitBucket} Fit
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}