import { NudgeRecord } from '../types';
import { format } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  nudgeRecords: NudgeRecord[];
}

export function NotificationCenter({ isOpen, onClose, nudgeRecords }: NotificationCenterProps) {
  if (!isOpen) return null;

  const getOutcomeColor = (outcome: string | null) => {
    if (outcome === 'accepted') return 'text-green-700 bg-green-50';
    if (outcome === 'ignored') return 'text-coffee-700 bg-coffee-50';
    if (outcome === 'dismissed') return 'text-gray-700 bg-gray-50';
    return 'text-coffee-700 bg-coffee-50';
  };

  const getOutcomeText = (outcome: string | null) => {
    if (outcome === 'accepted') return 'Accepted';
    if (outcome === 'ignored') return 'Ignored';
    if (outcome === 'dismissed') return 'Dismissed';
    return 'Pending';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md shadow-xl h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notification Center</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {nudgeRecords.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              No nudges yet. The system stays quiet by default.
            </div>
          ) : (
            nudgeRecords.map((record, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 mb-1">
                      {record.threadName}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {format(new Date(record.date), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOutcomeColor(record.outcome)}`}>
                    {getOutcomeText(record.outcome)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Confidence: {Math.round(record.confidenceScore * 100)}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
