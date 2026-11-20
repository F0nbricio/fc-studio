import React from 'react';
import { AdminBriefingsPanel } from '@/components/admin/AdminBriefingsPanel';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50/60 text-slate-900">
      <AdminBriefingsPanel />
    </main>
  );
}
