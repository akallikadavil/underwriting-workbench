import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeRulesForSubmission } from '@/lib/rules-engine';
import { writeAuditLog } from '@/lib/audit';
import { SubmissionStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const product = searchParams.get('product');
  const txType = searchParams.get('transactionType');
  const referralRequired = searchParams.get('referralRequired');
  const complianceBlocked = searchParams.get('complianceBlocked');
  const limit = parseInt(searchParams.get('limit') || '50');
  const page = parseInt(searchParams.get('page') || '1');

  const where: any = {};
  if (status) where.status = status;
  if (product) where.productType = product;
  if (txType) where.transactionType = txType;
  if (referralRequired === 'true') where.referralRequired = true;
  if (complianceBlocked === 'true') where.complianceBlocked = true;

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role === 'MARKETING') where.createdByUserId = userId;
  if (role === 'UNDERWRITER') {
    where.OR = [{ assignedToUserId: userId }, { assignedToUserId: null, status: { notIn: [SubmissionStatus.DRAFT] } }];
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
        _count: { select: { documents: true, aiRecommendations: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.submission.count({ where }),
  ]);

  return NextResponse.json({ submissions, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;

  // Generate submission number
  const count = await prisma.submission.count();
  const submissionNumber = `UW-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

  const slaDueDate = new Date();
  slaDueDate.setDate(slaDueDate.getDate() + 5);

  const submission = await prisma.submission.create({
    data: {
      submissionNumber,
      businessType: body.businessType,
      transactionType: body.transactionType,
      productType: body.productType,
      productSubtype: body.productSubtype,
      insuredName: body.insuredName,
      sourceType: body.sourceType || 'BROKER',
      brokerName: body.brokerName,
      policyStartDate: body.policyStartDate ? new Date(body.policyStartDate) : undefined,
      policyEndDate: body.policyEndDate ? new Date(body.policyEndDate) : undefined,
      sumInsured: parseFloat(body.sumInsured),
      currency: body.currency || 'THB',
      industry: body.industry,
      riskLocation: body.riskLocation,
      priorClaimsCount: parseInt(body.priorClaimsCount || '0'),
      priorClaimsAmount: parseFloat(body.priorClaimsAmount || '0'),
      status: SubmissionStatus.DRAFT,
      createdByUserId: userId,
      slaDueDate,
    },
  });

  // Create compliance record
  await prisma.complianceRecord.create({
    data: {
      submissionId: submission.id,
      consentCaptured: body.consentCaptured || false,
      privacyNoticeAcknowledged: body.privacyNoticeAcknowledged || false,
      sensitiveDataPresent: body.sensitiveDataPresent || false,
      sensitiveDataType: body.sensitiveDataType,
      legalBasis: body.legalBasis,
      dataRetentionClass: 'CLASS_B',
    },
  });

  // Run rules
  await executeRulesForSubmission(submission.id);

  await writeAuditLog({ userId, entityType: 'SUBMISSION', entityId: submission.id, action: 'SUBMISSION_CREATED', newValue: { submissionNumber } });

  return NextResponse.json(submission, { status: 201 });
}
