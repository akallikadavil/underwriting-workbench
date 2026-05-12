'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, RiskScore, ProductLabel, formatDate, isSLABreached, LoadingSpinner, formatCurrency } from '@/components/ui/shared';
import { Search, Filter, Plus, AlertTriangle } from 'lucide-react';

const STATUS_OPTIONS = ['', 'DRAFT','SUBMITTED','INTAKE_VALIDATION','PENDING_INFORMATION','ASSIGNED_TO_UNDERWRITING','UNDERWRITING_REVIEW','REFERRAL_REQUIRED','SENIOR_REVIEW','APPROVED_FOR_QUOTE','DECLINED','APPROVED_FOR_POLICY_PROCESSING','CORE_ENTRY_PENDING','CORE_ENTRY_COMPLETED','CLOSED'];
const PRODUCT_OPTIONS = ['','INDUSTRIAL_ALL_RISKS','MOVEABLE_ALL_RISKS','ERECTION_ALL_RISKS','CONTRACTOR_WORKS','PRODUCT_LIABILITY','GENERAL_LIABILITY','PUBLIC_LIABILITY','MANAGEMENT_LIABILITY','CYBER_RISK','CYBER_INSURANCE'];

export default function SubmissionsPage() {
  const { data: session } = useSession({ required: true });
  const role = (session?.user as any)?.role;
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', product: '', referralRequired: '', complianceBlocked: '' });

  useEffect(() => {
    loadSubmissions();
  }, [filters]);

  async function loadSubmissions() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.product) params.set('product', filters.product);
    if (filters.referralRequired) params.set('referralRequired', filters.referralRequired);
    if (filters.complianceBlocked) params.set('complianceBlocked', filters.complianceBlocked);
    params.set('limit', '50');
    const res = await fetch(`/api/submissions?${params}`);
    const data = await res.json();
    setSubmissions(data.submissions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Submissions</h1>
            <p className="text-sm text-gray-500">{total} total</p>
          </div>
          {['MARKETING'].includes(role) && (
            <Link href="/submissions/new" className="btn-primary">
              <Plus className="w-4 h-4" /> New Submission
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3">
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="form-select w-44">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={filters.product} onChange={e => setFilters(f => ({ ...f, product: e.target.value }))} className="form-select w-52">
            <option value="">All Products</option>
            {PRODUCT_OPTIONS.filter(Boolean).map(p => <option key={p} value={p}><ProductLabel type={p} /></option>)}
          </select>
          <select value={filters.referralRequired} onChange={e => setFilters(f => ({ ...f, referralRequired: e.target.value }))} className="form-select w-40">
            <option value="">All</option>
            <option value="true">Referral Required</option>
          </select>
          <select value={filters.complianceBlocked} onChange={e => setFilters(f => ({ ...f, complianceBlocked: e.target.value }))} className="form-select w-44">
            <option value="">All</option>
            <option value="true">Compliance Blocked</option>
          </select>
          <button onClick={() => setFilters({ status: '', product: '', referralRequired: '', complianceBlocked: '' })} className="btn-secondary btn-sm">Clear</button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Reference', 'Insured', 'Product', 'Type', 'Sum Insured', 'Risk', 'Status', 'SLA', 'Flags', 'Updated'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">No submissions found.</td></tr>
                  )}
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/submissions/${sub.id}`} className="text-blue-700 hover:underline text-xs font-mono font-medium">{sub.submissionNumber}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 max-w-[160px] truncate">{sub.insuredName}</div>
                        <div className="text-xs text-gray-400">{sub.brokerName}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap"><ProductLabel type={sub.productType} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{sub.transactionType?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-700 whitespace-nowrap">{formatCurrency(sub.sumInsured, sub.currency)}</td>
                      <td className="px-4 py-3"><RiskScore score={sub.riskScore} /></td>
                      <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                      <td className="px-4 py-3">
                        {isSLABreached(sub.slaDueDate) ? (
                          <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Breached</span>
                        ) : (
                          <span className="text-xs text-gray-400">{formatDate(sub.slaDueDate)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {sub.referralRequired && <span className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded">Ref</span>}
                          {sub.complianceBlocked && <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">PDPA</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(sub.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
