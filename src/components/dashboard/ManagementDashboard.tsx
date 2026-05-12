'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LoadingSpinner } from '@/components/ui/shared';

const PRODUCT_LABELS: Record<string, string> = {
  INDUSTRIAL_ALL_RISKS: 'IAR', MOVEABLE_ALL_RISKS: 'MAR', ERECTION_ALL_RISKS: 'EAR',
  CONTRACTOR_WORKS: 'CW', PRODUCT_LIABILITY: 'PL', GENERAL_LIABILITY: 'GL',
  PUBLIC_LIABILITY: 'PbL', MANAGEMENT_LIABILITY: 'ML', CYBER_RISK: 'CR', CYBER_INSURANCE: 'CI',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#9ca3af', SUBMITTED: '#3b82f6', INTAKE_VALIDATION: '#8b5cf6',
  PENDING_INFORMATION: '#f59e0b', ASSIGNED_TO_UNDERWRITING: '#06b6d4',
  UNDERWRITING_REVIEW: '#6366f1', REFERRAL_REQUIRED: '#f97316',
  SENIOR_REVIEW: '#7c3aed', APPROVED_FOR_QUOTE: '#22c55e', DECLINED: '#ef4444',
  APPROVED_FOR_POLICY_PROCESSING: '#14b8a6', CORE_ENTRY_PENDING: '#0ea5e9',
  CORE_ENTRY_COMPLETED: '#10b981', CLOSED: '#6b7280',
};

export function ManagementDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setMetrics(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  const productData = (metrics?.byProduct || []).map((d: any) => ({
    name: PRODUCT_LABELS[d.product] || d.product,
    count: d.count,
  }));

  const statusData = (metrics?.byStatus || []).map((d: any) => ({
    name: d.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    value: d.count,
    color: STATUS_COLORS[d.status] || '#9ca3af',
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Management Dashboard</h1>
        <p className="text-sm text-gray-500">Portfolio overview · Thailand commercial insurance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: metrics?.totalSubs ?? 0 },
          { label: 'SLA Breaches', value: metrics?.slaBreach ?? 0, danger: true },
          { label: 'Referral Rate', value: `${metrics?.referralRate ?? 0}%`, warning: true },
          { label: 'AI Approval Rate', value: `${metrics?.aiApprovalRate ?? 0}%`, success: true },
        ].map(m => (
          <div key={m.label} className={`bg-white rounded-lg border p-4 ${(m as any).danger && m.value > 0 ? 'border-red-200' : (m as any).warning ? 'border-amber-200' : (m as any).success ? 'border-green-200' : 'border-gray-200'}`}>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{m.label}</div>
            <div className={`text-2xl font-semibold ${(m as any).danger ? 'text-red-700' : (m as any).warning ? 'text-amber-700' : (m as any).success ? 'text-green-700' : 'text-gray-900'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Submissions by Product</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Submissions by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}`}>
                {statusData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [v, n]} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="text-sm font-medium text-amber-800 mb-1">Compliance Exceptions</div>
        <div className="text-2xl font-semibold text-amber-700">{metrics?.complianceExceptions ?? 0}</div>
        <div className="text-xs text-amber-600 mt-1">Submissions with PDPA compliance blocks or review requirements pending resolution.</div>
      </div>
    </div>
  );
}
