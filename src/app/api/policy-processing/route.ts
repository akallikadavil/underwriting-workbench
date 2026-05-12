import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { CoreEntryStatus, SubmissionStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const records = await prisma.policyProcessingRecord.findMany({
    include: {
      submission: {
        select: {
          submissionNumber: true, insuredName: true, productType: true,
          status: true, sumInsured: true, currency: true, riskLocation: true,
          policyStartDate: true, policyEndDate: true, brokerName: true,
          businessType: true, transactionType: true,
        }
      },
      enteredBy: { select: { name: true } },
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
  const { submissionId, action, coreReferenceNumber } = body;

  let record = await prisma.policyProcessingRecord.findUnique({ where: { submissionId } });

  if (!record) {
    record = await prisma.policyProcessingRecord.create({
      data: { submissionId, coreEntryStatus: CoreEntryStatus.PENDING },
    });
  }

  const updateData: any = {};

  if (action === 'EXPORT_CSV') {
    updateData.csvExported = true;
  } else if (action === 'EXPORT_JSON') {
    updateData.jsonExported = true;
  } else if (action === 'MARK_IN_PROGRESS') {
    updateData.coreEntryStatus = CoreEntryStatus.IN_PROGRESS;
    updateData.enteredByUserId = userId;
    updateData.coreReferenceNumber = coreReferenceNumber;
    await prisma.submission.update({ where: { id: submissionId }, data: { status: SubmissionStatus.CORE_ENTRY_PENDING } });
  } else if (action === 'MARK_COMPLETED') {
    updateData.coreEntryStatus = CoreEntryStatus.COMPLETED;
    updateData.completedAt = new Date();
    await prisma.submission.update({ where: { id: submissionId }, data: { status: SubmissionStatus.CORE_ENTRY_COMPLETED } });
  } else if (action === 'RETURN_TO_UW') {
    updateData.coreEntryStatus = CoreEntryStatus.RETURNED;
    await prisma.submission.update({ where: { id: submissionId }, data: { status: SubmissionStatus.UNDERWRITING_REVIEW } });
  }

  const updated = await prisma.policyProcessingRecord.update({ where: { submissionId }, data: updateData });

  await writeAuditLog({ userId, entityType: 'POLICY_PROCESSING', entityId: submissionId, action: `PP_${action}`, newValue: updateData });

  return NextResponse.json(updated);
}
