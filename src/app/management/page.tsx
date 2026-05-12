'use client';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { ManagementDashboard } from '@/components/dashboard/ManagementDashboard';

export default function ManagementPage() {
  useSession({ required: true });
  return <AppLayout><ManagementDashboard /></AppLayout>;
}
