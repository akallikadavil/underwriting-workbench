'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { LoadingSpinner, formatDate } from '@/components/ui/shared';

export default function AuditPage() {
  useSession({ required: true });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs?limit=100').then(r => r.json()).then(d => { setLogs(d); setLoading(false); });
  }, []);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500">Full system audit trail — OIC compliance requirement</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? <div className="p-8 flex justify-center"><LoadingSpinner /></div> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Timestamp','User','Action','Entity Type','Entity ID','Details'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-sm text-gray-400">No audit entries.</td></tr>}
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{log.user?.name || 'System'}</td>
                    <td className="px-4 py-2.5"><span className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{log.action}</span></td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{log.entityType}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-400 max-w-[100px] truncate">{log.entityId}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-xs truncate">{log.newValueJson ? JSON.stringify(log.newValueJson) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
