'use client';

export default function SessionSelector({ 
  selected = '', 
  onChange 
}: { 
  selected: string,
  onChange: (session: string) => void 
}) {
  // Calculate last 4 academic sessions including current
  const currentYear = new Date().getFullYear();
  const sessions = [
    `${currentYear-1}-${currentYear.toString().slice(-2)}`,
    `${currentYear-2}-${(currentYear-1).toString().slice(-2)}`,
    `${currentYear-3}-${(currentYear-2).toString().slice(-2)}`,
    `${currentYear-4}-${(currentYear-3).toString().slice(-2)}`
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select Session
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Select a session</option>
        {sessions.map((session) => (
          <option key={session} value={session}>
            {session} Session
          </option>
        ))}
      </select>
    </div>
  );
}