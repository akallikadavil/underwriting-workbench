'use client';
import { Sidebar } from '@/components/Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
