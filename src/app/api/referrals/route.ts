import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { ReferralStatus, SubmissionStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get('submissionId');
  const where: any = {};
  if (submissionId) where.submissionId = submissionId;

  const referrals = await prisma.referral.findMany({
    where,
    include: {
      submission: { select: { submissionNumber: true, insuredName: true, productType: true } },
      referredBy: { select: { name: true } },
      referredTo: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(referrals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;

  const referral = await prisma.referral.create({
    data: {
      submissionId: body.submissionId,
      referredByUserId: userId,
      referredToUserId: body.referredToUserId,
      referralReason: body.referralReason,
      referralStatus: ReferralStatus.PENDING,
    },
  });

  // Update submission status
  await prisma.submission.update({
    where: { id: body.submissionId },
    data: { status: SubmissionStatus.SENIOR_REVIEW, referralRequired: true },
  });

  await writeAuditLog({ userId, entityType: 'REFERRAL', entityId: referral.id, action: 'REFERRAL_CREATED', newValue: { reason: body.referralReason } });

  return NextResponse.json(referral, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;
  const { id, referralStatus, seniorDecision, decisionNotes, conditions } = body;

  const referral = await prisma.referral.update({
    where: { id },
    data: { referralStatus: referralStatus as ReferralStatus, seniorDecision, decisionNotes, conditions },
    include: { submission: true },
  });

  // Update submission status based on decision
  let newStatus: SubmissionStatus | undefined;
  if (referralStatus === 'APPROVED' || referralStatus === 'APPROVED_WITH_CONDITIONS') {
    newStatus = SubmissionStatus.APPROVED_FOR_QUOTE;
  } else if (referralStatus === 'DECLINED') {
    newStatus = SubmissionStatus.DECLINED;
  } else if (referralStatus === 'RETURNED') {
    newStatus = SubmissionStatus.UNDERWRITING_REVIEW;
  }

  if (newStatus) {
    await prisma.submission.update({ where: { id: referral.submissionId }, data: { status: newStatus } });
  }

  await writeAuditLog({ userId, entityType: 'REFERRAL', entityId: id, action: `REFERRAL_DECISION_${referralStatus}`, newValue: { decision: seniorDecision, notes: decisionNotes } });

  return NextResponse.json(referral);
}
