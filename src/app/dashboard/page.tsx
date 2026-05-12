'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { MarketingDashboard } from '@/components/dashboard/MarketingDashboard';
import { UnderwriterDashboard } from '@/components/dashboard/UnderwriterDashboard';
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';
import { PolicyDashboard } from '@/components/dashboard/PolicyDashboard';
import { ManagementDashboard } from '@/components/dashboard/ManagementDashboard';
import { LoadingSpinner } from '@/components/ui/shared';

export default function DashboardPage() {
  const { data: session, status } = useSession({ required: true });
  const role = (session?.user as any)?.role;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const DashboardComponent = {
    MARKETING: MarketingDashboard,
    UNDERWRITER: UnderwriterDashboard,
    SENIOR_UNDERWRITER: UnderwriterDashboard,
    POLICY_PROCESSING: PolicyDashboard,
    IT_ADMIN: ManagementDashboard,
    COMPLIANCE: ComplianceDashboard,
    MANAGEMENT: ManagementDashboard,
  }[role as string] || UnderwriterDashboard;

  return (
    <AppLayout>
      <DashboardComponent />
    </AppLayout>
  );
}
