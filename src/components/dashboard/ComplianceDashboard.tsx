'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, Globe } from 'lucide-react';
import { StatusBadge, ProductLabel, LoadingSpinner } from '@/components/ui/shared';

export function ComplianceDashboard() {
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
          <h1 className="text-xl font-semibold text-gray-900">Compliance Dashboard</h1>
          <p className="text-sm text-gray-500">PDPA · OIC · Thailand data protection monitoring</p>
        </div>
        <Link href="/compliance" className="btn-primary">Compliance Queue</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Compliance Blocks', value: metrics?.blocked ?? 0, danger: true },
          { label: 'Missing Consent', value: metrics?.missingConsent ?? 0, warning: true },
          { label: 'Human Review Pending', value: metrics?.humanReviewPending ?? 0, warning: true },
          { label: 'Cross-Border Transfers', value: metrics?.crossBorder ?? 0 },
        ].map(m => (
          <div key={m.label} className={`bg-white rounded-lg border p-4 ${m.danger && m.value > 0 ? 'border-red-200 bg-red-50' : m.warning && m.value > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{m.label}</div>
            <div className={`text-2xl font-semibold ${m.danger && m.value > 0 ? 'text-red-700' : m.warning && m.value > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Exceptions Requiring Action</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(!metrics?.exceptions || metrics.exceptions.length === 0) && (
            <div className="p-6 text-center text-sm text-gray-400">No compliance exceptions.</div>
          )}
          {metrics?.exceptions?.map((r: any) => (
            <Link key={r.id} href={`/submissions/${r.submissionId}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div>
                <div className="text-sm font-medium text-gray-900">{r.submission?.insuredName}</div>
                <div className="text-xs text-gray-500">{r.submission?.submissionNumber} · <ProductLabel type={r.submission?.productType} /></div>
                <div className="flex gap-2 mt-1">
                  {!r.consentCaptured && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">No Consent</span>}
                  {r.sensitiveDataPresent && !r.legalBasis && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">No Legal Basis</span>}
                  {!r.humanReviewCompleted && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Review Pending</span>}
                  {r.crossBorderTransferRequired && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Cross-Border</span>}
                </div>
              </div>
              <StatusBadge status={r.complianceStatus} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
