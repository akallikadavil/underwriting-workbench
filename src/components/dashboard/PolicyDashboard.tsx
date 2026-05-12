'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/shared';

export function PolicyDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setMetrics(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Policy Processing Dashboard</h1>
          <p className="text-sm text-gray-500">Core system entry and export management</p>
        </div>
        <Link href="/policy-processing" className="btn-primary">Processing Queue</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ready for Entry', value: metrics?.readyForEntry ?? 0, highlight: true },
          { label: 'In Progress', value: metrics?.inProgress ?? 0 },
          { label: 'Completed', value: metrics?.completed ?? 0, success: true },
          { label: 'Export Pending', value: metrics?.exportPending ?? 0, warning: true },
        ].map(m => (
          <div key={m.label} className={`bg-white rounded-lg border p-4 ${m.highlight && m.value > 0 ? 'border-blue-200 bg-blue-50' : m.success ? 'border-green-200' : m.warning && m.value > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{m.label}</div>
            <div className={`text-2xl font-semibold ${m.highlight && m.value > 0 ? 'text-blue-700' : m.success ? 'text-green-700' : m.warning && m.value > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-1">Core Handoff Process</h3>
        <p className="text-xs text-blue-700">Approved submissions appear in the processing queue. Export CSV or JSON for core system entry. Mark as entered once the policy reference number is assigned.</p>
      </div>
    </div>
  );
}
