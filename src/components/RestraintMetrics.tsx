import { Thread, Decision } from '../types';

interface RestraintMetricsProps {
  threads: Thread[];
  decisions: Decision[];
  nudgeHistoryCount: number;
}

export function RestraintMetrics({ threads, decisions, nudgeHistoryCount }: RestraintMetricsProps) {
  const silentCount = decisions.filter(d => !d.shouldNudge).length;
  const silenceRate = decisions.length > 0 ? Math.round((silentCount / decisions.length) * 100) : 0;

  // Top reason for silence
  const silenceReasons: { [key: string]: number } = {};
  decisions
    .filter(d => !d.shouldNudge)
    .forEach(d => {
      d.reasons.forEach(reason => {
        const key = reason.toLowerCase().substring(0, 30);
        silenceReasons[key] = (silenceReasons[key] || 0) + 1;
      });
    });

  const topReasonKey = Object.entries(silenceReasons).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topReason = topReasonKey ? decisions.find(d => 
    !d.shouldNudge && d.reasons.some(r => r.toLowerCase().substring(0, 30) === topReasonKey)
  )?.reasons[0] : 'N/A';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
      <h3 className="text-sm font-semibold mb-3">Restraint Metrics</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Threads Tracked</div>
          <div className="text-lg font-semibold">{threads.length}</div>
        </div>
        <div>
          <div className="text-gray-600">Nudges in Last 7 Days</div>
          <div className="text-lg font-semibold">{nudgeHistoryCount}</div>
        </div>
        <div>
          <div className="text-gray-600">Silence Rate</div>
          <div className="text-lg font-semibold">{silenceRate}%</div>
        </div>
        <div>
          <div className="text-gray-600">Top Silence Reason</div>
          <div className="text-xs text-gray-700 mt-1">{topReason || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}
