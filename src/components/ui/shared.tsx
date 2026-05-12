'use client';
import React from 'react';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  INTAKE_VALIDATION: { label: 'Intake Validation', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  PENDING_INFORMATION: { label: 'Pending Information', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ASSIGNED_TO_UNDERWRITING: { label: 'Assigned', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  UNDERWRITING_REVIEW: { label: 'UW Review', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  REFERRAL_REQUIRED: { label: 'Referral Required', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  SENIOR_REVIEW: { label: 'Senior Review', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  APPROVED_FOR_QUOTE: { label: 'Approved for Quote', className: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED: { label: 'Declined', className: 'bg-red-100 text-red-700 border-red-200' },
  APPROVED_FOR_POLICY_PROCESSING: { label: 'Approved for PP', className: 'bg-teal-100 text-teal-700 border-teal-200' },
  CORE_ENTRY_PENDING: { label: 'Core Entry Pending', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  CORE_ENTRY_COMPLETED: { label: 'Core Entry Done', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  // AI Recommendation
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
  EDITED: { label: 'Edited', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  // Referral
  APPROVED_WITH_CONDITIONS: { label: 'Approved w/ Conditions', className: 'bg-teal-100 text-teal-700 border-teal-200' },
  RETURNED: { label: 'Returned', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  // Compliance
  CLEAR: { label: 'Clear', className: 'bg-green-100 text-green-700 border-green-200' },
  BLOCKED: { label: 'Blocked', className: 'bg-red-100 text-red-700 border-red-200' },
  REVIEW_REQUIRED: { label: 'Review Required', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}

export function RiskScore({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <span className="text-gray-400 text-xs">N/A</span>;
  const color = score >= 7 ? 'text-red-700 bg-red-50 border-red-200' : score >= 5 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-green-700 bg-green-50 border-green-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

export function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 font-mono w-8">{pct}%</span>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className={`${s} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`} />
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config[severity] || 'bg-gray-100 text-gray-600'}`}>
      {severity}
    </span>
  );
}

export function ProductLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    INDUSTRIAL_ALL_RISKS: 'Industrial All Risks',
    MOVEABLE_ALL_RISKS: 'Moveable All Risks',
    ERECTION_ALL_RISKS: 'Erection All Risks',
    CONTRACTOR_WORKS: 'Contractor Works',
    PRODUCT_LIABILITY: 'Product Liability',
    GENERAL_LIABILITY: 'General Liability',
    PUBLIC_LIABILITY: 'Public Liability',
    MANAGEMENT_LIABILITY: 'Management Liability',
    CYBER_RISK: 'Cyber Risk',
    CYBER_INSURANCE: 'Cyber Insurance',
  };
  return <span>{labels[type] || type}</span>;
}

export function formatCurrency(amount: number, currency = 'THB') {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isSLABreached(slaDueDate: string | Date | null | undefined) {
  if (!slaDueDate) return false;
  return new Date(slaDueDate) < new Date();
}
