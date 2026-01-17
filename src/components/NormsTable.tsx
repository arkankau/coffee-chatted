import { recruitingNorms } from '../logic/norms';

export function NormsTable() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3">Recruiting Norms</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2 font-medium text-gray-700">Interaction Type</th>
            <th className="text-left py-2 px-2 font-medium text-gray-700">Optimal Window (days)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(recruitingNorms).map(([type, norm]) => (
            <tr key={type} className="border-b border-gray-100">
              <td className="py-2 px-2 text-gray-900">{type}</td>
              <td className="py-2 px-2 text-gray-700">{norm.optimalWindow[0]} - {norm.optimalWindow[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
