import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const now = new Date();
  const slaBreachWhere = { slaDueDate: { lt: now }, status: { notIn: ['CLOSED', 'DECLINED', 'CORE_ENTRY_COMPLETED'] as any } };

  if (role === 'MARKETING') {
    const [total, drafts, submitted, pendingInfo, returned, slaBreach, recent] = await Promise.all([
      prisma.submission.count({ where: { createdByUserId: userId } }),
      prisma.submission.count({ where: { createdByUserId: userId, status: 'DRAFT' } }),
      prisma.submission.count({ where: { createdByUserId: userId, status: 'SUBMITTED' } }),
      prisma.submission.count({ where: { createdByUserId: userId, status: 'PENDING_INFORMATION' } }),
      prisma.submission.count({ where: { createdByUserId: userId, status: 'INTAKE_VALIDATION' } }),
      prisma.submission.count({ where: { createdByUserId: userId, ...slaBreachWhere } }),
      prisma.submission.findMany({ where: { createdByUserId: userId }, take: 5, orderBy: { updatedAt: 'desc' }, select: { id: true, submissionNumber: true, insuredName: true, status: true, productType: true, updatedAt: true } }),
    ]);
    return NextResponse.json({ total, drafts, submitted, pendingInfo, returned, slaBreach, recent });
  }

  if (role === 'UNDERWRITER' || role === 'SENIOR_UNDERWRITER') {
    const [myQueue, referralRequired, pendingInfo, slaBreach, approvedToday, recentQueue] = await Promise.all([
      prisma.submission.count({ where: { assignedToUserId: userId } }),
      prisma.submission.count({ where: { referralRequired: true, status: { in: ['REFERRAL_REQUIRED', 'SENIOR_REVIEW'] as any } } }),
      prisma.submission.count({ where: { status: 'PENDING_INFORMATION' } }),
      prisma.submission.count({ where: slaBreachWhere }),
      prisma.submission.count({ where: { status: { in: ['APPROVED_FOR_QUOTE', 'APPROVED_FOR_POLICY_PROCESSING'] as any }, updatedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) } } }),
      prisma.submission.findMany({ where: { status: { in: ['ASSIGNED_TO_UNDERWRITING', 'UNDERWRITING_REVIEW', 'REFERRAL_REQUIRED', 'SENIOR_REVIEW'] as any } }, take: 10, orderBy: [{ referralRequired: 'desc' }, { slaDueDate: 'asc' }], select: { id: true, submissionNumber: true, insuredName: true, status: true, productType: true, riskScore: true, slaDueDate: true, referralRequired: true, complianceBlocked: true } }),
    ]);
    return NextResponse.json({ myQueue, referralRequired, pendingInfo, slaBreach, approvedToday, recentQueue });
  }

  if (role === 'COMPLIANCE') {
    const [missingConsent, sensitiveData, crossBorder, humanReviewPending, blocked, exceptions] = await Promise.all([
      prisma.complianceRecord.count({ where: { consentCaptured: false } }),
      prisma.complianceRecord.count({ where: { sensitiveDataPresent: true } }),
      prisma.complianceRecord.count({ where: { crossBorderTransferRequired: true } }),
      prisma.complianceRecord.count({ where: { humanReviewCompleted: false, complianceStatus: { notIn: ['APPROVED', 'CLEAR'] as any } } }),
      prisma.complianceRecord.count({ where: { complianceStatus: 'BLOCKED' } }),
      prisma.complianceRecord.findMany({ where: { complianceStatus: { in: ['BLOCKED', 'REVIEW_REQUIRED'] as any } }, include: { submission: { select: { submissionNumber: true, insuredName: true, status: true, productType: true } } }, take: 20, orderBy: { createdAt: 'desc' } }),
    ]);
    return NextResponse.json({ missingConsent, sensitiveData, crossBorder, humanReviewPending, blocked, exceptions });
  }

  if (role === 'POLICY_PROCESSING') {
    const [readyForEntry, inProgress, completed, exportPending] = await Promise.all([
      prisma.submission.count({ where: { status: { in: ['APPROVED_FOR_POLICY_PROCESSING', 'CORE_ENTRY_PENDING'] as any } } }),
      prisma.policyProcessingRecord.count({ where: { coreEntryStatus: 'IN_PROGRESS' } }),
      prisma.policyProcessingRecord.count({ where: { coreEntryStatus: 'COMPLETED' } }),
      prisma.policyProcessingRecord.count({ where: { csvExported: false, coreEntryStatus: 'PENDING' } }),
    ]);
    return NextResponse.json({ readyForEntry, inProgress, completed, exportPending });
  }

  if (role === 'MANAGEMENT' || role === 'IT_ADMIN') {
    const [totalSubs, byProduct, byStatus, slaBreach, referralRate, aiApprovalRate, complianceExceptions, byMonth] = await Promise.all([
      prisma.submission.count(),
      prisma.submission.groupBy({ by: ['productType'], _count: { _all: true } }),
      prisma.submission.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.submission.count({ where: slaBreachWhere }),
      prisma.submission.count({ where: { referralRequired: true } }),
      prisma.aIRecommendation.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.complianceRecord.count({ where: { complianceStatus: { in: ['BLOCKED', 'REVIEW_REQUIRED'] as any } } }),
      prisma.submission.groupBy({ by: ['createdAt'], _count: { _all: true } }),
    ]);

    const totalAI = aiApprovalRate.reduce((s: number, r: any) => s + r._count._all, 0);
    const approvedAI = aiApprovalRate.find((r: any) => r.status === 'APPROVED')?._count._all || 0;

    return NextResponse.json({
      totalSubs,
      byProduct: byProduct.map((r: any) => ({ product: r.productType, count: r._count._all })),
      byStatus: byStatus.map((r: any) => ({ status: r.status, count: r._count._all })),
      slaBreach,
      referralRate: totalSubs > 0 ? Math.round((referralRate / totalSubs) * 100) : 0,
      aiApprovalRate: totalAI > 0 ? Math.round((approvedAI / totalAI) * 100) : 0,
      complianceExceptions,
    });
  }

  return NextResponse.json({});
}
