import { Thread } from '../types';

interface ToastProps {
  thread: Thread;
  onClose: () => void;
}

export function Toast({ thread, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 duration-300">
      <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl max-w-sm border border-white/10 flex gap-4">
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-coffee-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-bold truncate pr-4">CoffeeChatted Suggestion</h4>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Follow up with <span className="text-white font-semibold">{thread.name}</span>. Optimal window reached.
          </p>
        </div>
      </div>
    </div>
  );
}