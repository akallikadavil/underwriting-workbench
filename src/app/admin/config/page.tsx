'use client';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';

const COUNTRIES = [
  { code: 'TH', name: 'Thailand', currency: 'THB', regulator: 'OIC', pdpa: 'PDPA 2019', dataResidency: 'Thailand', vat: '7%', language: 'Thai / English' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', regulator: 'MAS', pdpa: 'PDPA 2012 (amended 2021)', dataResidency: 'Singapore', vat: 'GST 9%', language: 'English' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', regulator: 'BNM', pdpa: 'PDPA 2010', dataResidency: 'Malaysia', vat: 'SST 6%', language: 'Bahasa / English' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', regulator: 'OJK', pdpa: 'PDP Law 2022', dataResidency: 'Indonesia', vat: 'VAT 11%', language: 'Bahasa Indonesia' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', regulator: 'ISA', pdpa: 'Decree 13/2023', dataResidency: 'Vietnam', vat: 'VAT 10%', language: 'Vietnamese' },
];

export default function ASEANConfigPage() {
  useSession({ required: true });
  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">ASEAN Configuration</h1>
          <p className="text-sm text-gray-500">Country-specific regulatory, currency, and data residency settings</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {COUNTRIES.map(c => (
            <div key={c.code} className={`bg-white rounded-lg border p-5 ${c.code === 'TH' ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">{c.name}</span>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.code}</span>
                  {c.code === 'TH' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">Active (Pilot)</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                {[['Currency', c.currency],['Regulator', c.regulator],['Privacy Law', c.pdpa],['Data Residency', c.dataResidency],['Tax', c.vat],['Language', c.language]].map(([k,v]) => (
                  <div key={k}>
                    <div className="text-xs text-gray-400 mb-0.5">{k}</div>
                    <div className="text-sm font-medium text-gray-900">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
          Configuration shown is reference data. Full regulatory validation for each jurisdiction must be performed by in-country counsel prior to go-live. OIC Thailand is the active pilot jurisdiction.
        </div>
      </div>
    </AppLayout>
  );
}
