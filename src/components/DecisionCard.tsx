import { Thread, Decision } from '../types';
import { PolishOutput } from '../ai/types';

interface DecisionCardProps {
  decision: Decision;
  thread: Thread;
  onFeedback: (feedbackType: 'followUp' | 'notNow' | 'tooEarly' | 'suppress' | 'stillRelevant' | 'dismiss') => void;
  showStillRelevant: boolean;
  aiFitUsed?: boolean;
  aiFitExplanation?: string;
  aiToneUsed?: boolean;
  aiPolish?: PolishOutput | null;
}

export function DecisionCard({
  decision,
  thread,
  onFeedback,
  showStillRelevant,
  aiFitUsed = false,
  aiFitExplanation,
  aiToneUsed = false,
  aiPolish,
}: DecisionCardProps) {
  const isNudge = decision.shouldNudge;

  // Use AI-polished tone if available, otherwise use default
  const nudgeTitle = aiPolish?.title || (isNudge ? 'Optional follow-up' : 'No action taken');
  const nudgeBody = aiPolish?.body || (isNudge 
    ? `If you want, now is within your usual follow-up window for ${thread.name}.`
    : `The timing isn't right yet based on recruiting norms and your previous feedback.`);
  const doNothingText = aiPolish?.body || decision.reasons[0] || "The timing isn't right yet.";

  return (
    <div className={`bg-white border ${isNudge ? 'border-coffee-200' : 'border-gray-200'} rounded-xl overflow-hidden shadow-sm transition-all`}>
      <div className={`px-6 py-4 border-b ${isNudge ? 'bg-coffee-50/50 border-coffee-100' : 'bg-gray-50/50 border-gray-100'}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {nudgeTitle}
          </h2>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${isNudge ? 'bg-coffee-100 text-coffee-700' : 'bg-gray-200 text-gray-500'}`}>
            {isNudge ? 'Suggestion active' : 'Quiet Mode'}
          </span>
        </div>
      </div>

      <div className="p-6">
        {isNudge ? (
          <div className="space-y-6">
            <p className="text-gray-700 leading-relaxed">
              {nudgeBody}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onFeedback('followUp')} className="px-4 py-2 bg-coffee-600 text-white rounded-lg text-sm font-semibold hover:bg-coffee-700 transition-colors shadow-sm">I'll follow up</button>
              <button onClick={() => onFeedback('notNow')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">Not now</button>
              <button onClick={() => onFeedback('tooEarly')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">Too early</button>
              <button onClick={() => onFeedback('suppress')} className="px-4 py-2 bg-white border border-gray-200 text-gray-400 rounded-lg text-sm font-semibold hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all">Don't remind me</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Why I stayed silent</h4>
              <p className="text-sm text-gray-600 leading-relaxed italic">
                {doNothingText}
              </p>
            </div>
            {showStillRelevant && (
              <button onClick={() => onFeedback('stillRelevant')} className="text-xs font-semibold text-coffee-600 hover:text-coffee-700 underline underline-offset-4">This contact is still relevant (override fit)</button>
            )}
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Confidence</div>
            <div className="text-sm font-bold text-gray-900">{Math.round(decision.confidenceScore * 100)}%</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fit Score</div>
            <div className="text-sm font-bold text-gray-900">{Math.round(decision.fitScore * 100)}%</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Timing</div>
            <div className="text-sm font-bold text-gray-900 capitalize">{decision.timingState.toLowerCase().replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Days Since</div>
            <div className="text-sm font-bold text-gray-900">{decision.daysSince}d</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Inputs Evaluated</div>
          <div className="flex flex-wrap gap-1.5">
            {decision.inputsUsed.map((input, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-500 rounded text-[10px] font-medium tracking-wide">
                {input}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* AI Usage Status */}
      <div className="px-6 py-4 bg-coffee-50/30 border-t border-coffee-100/50">
        <div className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest mb-2">AI Assist Status</div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-4 text-[10px] font-semibold">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${aiFitUsed ? 'bg-coffee-500' : 'bg-gray-300'}`}></div>
              <span className={aiFitUsed ? 'text-coffee-700' : 'text-gray-400'}>Fit Normalized</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${aiToneUsed ? 'bg-coffee-500' : 'bg-gray-300'}`}></div>
              <span className={aiToneUsed ? 'text-coffee-700' : 'text-gray-400'}>Tone Polished</span>
            </div>
          </div>
          {aiFitExplanation && aiFitUsed && (
            <p className="text-[10px] text-coffee-600 italic leading-tight">
              AI: {aiFitExplanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}