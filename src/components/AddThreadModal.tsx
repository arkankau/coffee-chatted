import { useState } from 'react';
import { Thread, InteractionType, SharedConnection } from '../types';

const industries = ['Investment Banking', 'Consulting', 'Technology', 'Corporate Banking', 'Equity Research', 'Other'];
const interactionTypes: InteractionType[] = ['Coffee Chat', 'Referral Intro', 'Recruiter Email', 'Post-Interview'];
const sharedConnections: SharedConnection[] = [
  'Same school',
  'Same student org',
  'Same hometown/country',
  'Friend-of-friend intro',
  'Same previous company',
  'None',
];

interface AddThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (thread: Omit<Thread, 'id'>) => void;
}

export function AddThreadModal({ isOpen, onClose, onAdd }: AddThreadModalProps) {
  const [name, setName] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [industry, setIndustry] = useState(industries[0]);
  const [interactionType, setInteractionType] = useState<InteractionType>('Coffee Chat');
  const [lastInteractionDate, setLastInteractionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [followupAlreadySent, setFollowupAlreadySent] = useState(false);
  const [sharedConnection, setSharedConnection] = useState<SharedConnection>('None');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse company and role (simple: assume format "Company, Role")
    const [company, roleTitle] = companyRole.split(',').map(s => s.trim());
    const finalCompany = company || 'Unknown';
    const finalRole = roleTitle || 'Unknown';

    const newThread: Omit<Thread, 'id'> = {
      name: name || 'Unknown',
      company: finalCompany,
      roleTitle: finalRole,
      industry,
      interactionType,
      lastInteractionDate: new Date(lastInteractionDate).toISOString(),
      followupAlreadySent,
      priorEngagement: true, // Default as per spec
      typicalResponseLatencyDays: 4, // Default as per spec
      sharedConnection,
      nudgedAlready: false,
      ignoredNudgesCount: 0,
    };

    onAdd(newThread);
    
    // Reset form
    setName('');
    setCompanyRole('');
    setIndustry(industries[0]);
    setInteractionType('Coffee Chat');
    setLastInteractionDate(new Date().toISOString().split('T')[0]);
    setFollowupAlreadySent(false);
    setSharedConnection('None');
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Thread</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company + Role (e.g., "Goldman Sachs, Analyst") *
            </label>
            <input
              type="text"
              value={companyRole}
              onChange={(e) => setCompanyRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shared Connection
            </label>
            <select
              value={sharedConnection}
              onChange={(e) => setSharedConnection(e.target.value as SharedConnection)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {sharedConnections.map((conn) => (
                <option key={conn} value={conn}>
                  {conn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interaction Type
            </label>
            <select
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value as InteractionType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {interactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Last Interaction
            </label>
            <input
              type="date"
              value={lastInteractionDate}
              onChange={(e) => setLastInteractionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="followupSent"
              checked={followupAlreadySent}
              onChange={(e) => setFollowupAlreadySent(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="followupSent" className="text-sm text-gray-700">
              Follow-up already sent?
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Add Thread
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
