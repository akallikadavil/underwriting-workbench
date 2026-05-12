import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get('submissionId');
  const format = searchParams.get('format') || 'json';

  if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 });

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      documents: { select: { fileName: true, documentCategory: true, extractionStatus: true } },
      complianceRecord: true,
      referrals: { select: { referralReason: true, referralStatus: true, seniorDecision: true } },
      ruleResults: { include: { rule: { select: { ruleName: true } } }, where: { triggered: true } },
      policyProcessing: true,
    },
  });

  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const coreData = {
    policyNumber: submission.policyProcessing?.coreReferenceNumber || '',
    submissionNumber: submission.submissionNumber,
    businessType: submission.businessType,
    transactionType: submission.transactionType,
    productType: submission.productType,
    productSubtype: submission.productSubtype || '',
    insuredName: submission.insuredName,
    brokerName: submission.brokerName || '',
    policyStartDate: submission.policyStartDate?.toISOString().split('T')[0] || '',
    policyEndDate: submission.policyEndDate?.toISOString().split('T')[0] || '',
    sumInsured: submission.sumInsured,
    currency: submission.currency,
    industry: submission.industry || '',
    riskLocation: submission.riskLocation,
    priorClaimsCount: submission.priorClaimsCount,
    priorClaimsAmount: submission.priorClaimsAmount,
    riskScore: submission.riskScore || 0,
    completenessScore: submission.completenessScore || 0,
    status: submission.status,
    referralRequired: submission.referralRequired,
    complianceBlocked: submission.complianceBlocked,
    consentCaptured: submission.complianceRecord?.consentCaptured || false,
    privacyNoticeAcknowledged: submission.complianceRecord?.privacyNoticeAcknowledged || false,
    legalBasis: submission.complianceRecord?.legalBasis || '',
    crossBorderTransferRequired: submission.complianceRecord?.crossBorderTransferRequired || false,
    dataRetentionClass: submission.complianceRecord?.dataRetentionClass || '',
    triggeredRules: submission.ruleResults.map(r => r.rule.ruleName).join('; '),
    documentsProvided: submission.documents.map(d => d.documentCategory).join('; '),
    exportDate: new Date().toISOString(),
    regulatoryBody: 'OIC',
    country: 'TH',
  };

  const userId = (session.user as any).id;

  if (format === 'csv') {
    const headers = Object.keys(coreData);
    const values = Object.values(coreData).map(v => `"${String(v).replace(/"/g, '""')}"`);
    const csv = `${headers.join(',')}\n${values.join(',')}`;

    await prisma.policyProcessingRecord.upsert({
      where: { submissionId },
      create: { submissionId, csvExported: true },
      update: { csvExported: true },
    });

    await writeAuditLog({ userId, entityType: 'EXPORT', entityId: submissionId, action: 'CSV_EXPORTED' });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${submission.submissionNumber}-core-handoff.csv"`,
      },
    });
  }

  await prisma.policyProcessingRecord.upsert({
    where: { submissionId },
    create: { submissionId, jsonExported: true },
    update: { jsonExported: true },
  });

  await writeAuditLog({ userId, entityType: 'EXPORT', entityId: submissionId, action: 'JSON_EXPORTED' });

  return new NextResponse(JSON.stringify(coreData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${submission.submissionNumber}-core-handoff.json"`,
    },
  });
}
