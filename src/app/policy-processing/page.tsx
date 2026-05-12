'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, ProductLabel, formatDate, formatCurrency, LoadingSpinner } from '@/components/ui/shared';
import { Download, CheckCircle } from 'lucide-react';

export default function PolicyProcessingPage() {
  useSession({ required: true });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState('');
  const [coreRef, setCoreRef] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [ppRes, subRes] = await Promise.all([
      fetch('/api/policy-processing'),
      fetch('/api/submissions?status=APPROVED_FOR_POLICY_PROCESSING&limit=50'),
    ]);
    const ppData = await ppRes.json();
    const subData = await subRes.json();

    // Merge: show submissions approved for PP that may not have PP record yet
    const ppIds = new Set(ppData.map((r: any) => r.submissionId));
    const extraSubs = (subData.submissions || []).filter((s: any) => !ppIds.has(s.id));
    const extraRecords = extraSubs.map((s: any) => ({ submissionId: s.id, coreEntryStatus: 'PENDING', csvExported: false, jsonExported: false, submission: s }));

    setRecords([...ppData, ...extraRecords]);
    setLoading(false);
  }

  async function action(submissionId: string, act: string) {
    setActioning(submissionId + act);
    await fetch('/api/policy-processing', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId, action: act, coreReferenceNumber: coreRef[submissionId] }) });
    await load();
    setActioning('');
  }

  async function exportFile(submissionId: string, format: string, number: string) {
    const res = await fetch(`/api/exports?submissionId=${submissionId}&format=${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${number}.${format}`; a.click();
    await load();
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Policy Processing Queue</h1>
          <p className="text-sm text-gray-500">{records.length} cases ready or in progress</p>
        </div>

        {loading ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
          <div className="space-y-3">
            {records.length === 0 && <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">No submissions ready for processing.</div>}
            {records.map((rec: any) => {
              const sub = rec.submission;
              const isLoading = actioning.startsWith(rec.submissionId);
              return (
                <div key={rec.submissionId} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/submissions/${rec.submissionId}`} className="text-sm font-semibold text-blue-700 hover:underline">{sub?.insuredName}</Link>
                        <span className="font-mono text-xs text-gray-400">{sub?.submissionNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${rec.coreEntryStatus === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : rec.coreEntryStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {rec.coreEntryStatus}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        <ProductLabel type={sub?.productType} /> · {sub?.businessType?.replace(/_/g,' ')} · {formatCurrency(sub?.sumInsured || 0, sub?.currency)}
                      </div>
                      {rec.coreReferenceNumber && (
                        <div className="text-xs text-gray-700 mb-2">Core Ref: <span className="font-mono font-medium">{rec.coreReferenceNumber}</span></div>
                      )}
                      <div className="flex gap-2 text-xs">
                        <span className={rec.csvExported ? 'text-green-600' : 'text-gray-400'}>CSV {rec.csvExported ? '✓' : '—'}</span>
                        <span className={rec.jsonExported ? 'text-green-600' : 'text-gray-400'}>JSON {rec.jsonExported ? '✓' : '—'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4 min-w-[160px]">
                      <div className="flex gap-1.5">
                        <button onClick={() => exportFile(rec.submissionId, 'csv', sub?.submissionNumber)} className="btn-secondary btn-xs flex-1 justify-center">
                          <Download className="w-3 h-3" />CSV
                        </button>
                        <button onClick={() => exportFile(rec.submissionId, 'json', sub?.submissionNumber)} className="btn-secondary btn-xs flex-1 justify-center">
                          <Download className="w-3 h-3" />JSON
                        </button>
                      </div>
                      {rec.coreEntryStatus === 'PENDING' && (
                        <div className="space-y-1.5">
                          <input value={coreRef[rec.submissionId] || ''} onChange={e => setCoreRef(prev => ({ ...prev, [rec.submissionId]: e.target.value }))} className="form-input text-xs" placeholder="Core reference no." />
                          <button onClick={() => action(rec.submissionId, 'MARK_IN_PROGRESS')} disabled={isLoading} className="btn-primary btn-xs w-full justify-center">Begin Entry</button>
                        </div>
                      )}
                      {rec.coreEntryStatus === 'IN_PROGRESS' && (
                        <button onClick={() => action(rec.submissionId, 'MARK_COMPLETED')} disabled={isLoading} className="btn-success btn-xs w-full justify-center">
                          <CheckCircle className="w-3 h-3" />Mark Complete
                        </button>
                      )}
                      {rec.coreEntryStatus === 'PENDING' || rec.coreEntryStatus === 'IN_PROGRESS' ? (
                        <button onClick={() => action(rec.submissionId, 'RETURN_TO_UW')} disabled={isLoading} className="btn-secondary btn-xs w-full justify-center">Return to UW</button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
