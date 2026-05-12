import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { ComplianceStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get('submissionId');
  const status = searchParams.get('status');

  const where: any = {};
  if (submissionId) where.submissionId = submissionId;
  if (status) where.complianceStatus = status;

  const records = await prisma.complianceRecord.findMany({
    where,
    include: {
      submission: { select: { submissionNumber: true, insuredName: true, productType: true, status: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(records);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;
  const { submissionId, ...updateData } = body;

  const updated = await prisma.complianceRecord.update({
    where: { submissionId },
    data: {
      ...updateData,
      complianceApprovedByUserId: updateData.complianceStatus === 'APPROVED' ? userId : undefined,
      humanReviewCompleted: updateData.humanReviewCompleted ?? undefined,
    },
  });

  // Update submission complianceBlocked flag
  const blocked = updated.complianceStatus === ComplianceStatus.BLOCKED;
  await prisma.submission.update({ where: { id: submissionId }, data: { complianceBlocked: blocked } });

  await writeAuditLog({ userId, entityType: 'COMPLIANCE', entityId: submissionId, action: 'COMPLIANCE_UPDATED', newValue: updateData });

  return NextResponse.json(updated);
}
