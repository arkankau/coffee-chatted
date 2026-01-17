import { UserFocus } from '../types';

interface FocusPanelProps {
  focus: UserFocus;
  onFocusChange: (focus: UserFocus) => void;
}

const industries = ['Investment Banking', 'Consulting', 'Technology', 'Corporate Banking', 'Equity Research', 'Other'];

export function FocusPanel({ focus, onFocusChange }: FocusPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-gray-800">Recruiting Focus</h3>
        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Networking</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Target Industry</label>
          <select
            value={focus.targetIndustry}
            onChange={(e) => onFocusChange({ ...focus, targetIndustry: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-coffee-500/10 focus:border-coffee-500 transition-all cursor-pointer"
          >
            {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Target Role</label>
          <input
            type="text"
            value={focus.targetRole}
            onChange={(e) => onFocusChange({ ...focus, targetRole: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coffee-500/10 focus:border-coffee-500 transition-all"
            placeholder="e.g., TMT Banking Analyst"
          />
        </div>
      </div>
      <p className="mt-4 text-[10px] text-gray-400 leading-tight">Used only to reduce noise. Fit blocks unnecessary nudges.</p>
    </div>
  );
}