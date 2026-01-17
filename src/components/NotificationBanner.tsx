import { Thread, Decision } from '../types';

interface NotificationBannerProps {
  thread: Thread;
  decision: Decision;
  onView: () => void;
  onNotNow: () => void;
  onDismiss: () => void;
}

export function NotificationBanner({ thread, decision, onView, onNotNow, onDismiss }: NotificationBannerProps) {
  return (
    <div className="bg-white border border-coffee-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-coffee-50 rounded-full flex items-center justify-center text-coffee-500 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-bold text-gray-800">1 quiet suggestion</h4>
            <span className="text-[10px] font-bold bg-coffee-100 text-coffee-600 px-1.5 py-0.5 rounded uppercase tracking-wider">High Confidence</span>
          </div>
          <p className="text-sm text-gray-500">
            {thread.interactionType} follow-up is in your usual window (Day {decision.daysSince}). Optional.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onView} className="px-4 py-1.5 text-sm font-bold text-coffee-600 hover:bg-coffee-50 rounded-lg transition-colors">View</button>
        <div className="w-px h-4 bg-gray-100"></div>
        <button onClick={onNotNow} className="px-4 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">Not now</button>
        <button onClick={onDismiss} className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
}