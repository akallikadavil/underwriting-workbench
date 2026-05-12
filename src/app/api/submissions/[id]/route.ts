import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeRulesForSubmission } from '@/lib/rules-engine';
import { writeAuditLog } from '@/lib/audit';
import { SubmissionStatus } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
      documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      aiRecommendations: {
        include: { approvedBy: { select: { name: true } }, sourceDocument: { select: { fileName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      ruleResults: { include: { rule: true }, orderBy: { createdAt: 'desc' } },
      complianceRecord: { include: { approvedBy: { select: { name: true } } } },
      referrals: {
        include: {
          referredBy: { select: { name: true } },
          referredTo: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      policyProcessing: { include: { enteredBy: { select: { name: true } } } },
    },
  });

  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(submission);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;

  const current = await prisma.submission.findUnique({ where: { id: params.id } });
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updateData: any = {};
  const allowedFields = ['status', 'assignedToUserId', 'notes', 'riskScore', 'productSubtype', 'brokerName', 'policyStartDate', 'policyEndDate', 'sumInsured', 'industry', 'riskLocation', 'priorClaimsCount', 'priorClaimsAmount'];
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  // Status transition logic
  if (body.status) {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: ['INTAKE_VALIDATION', 'PENDING_INFORMATION'],
      INTAKE_VALIDATION: ['PENDING_INFORMATION', 'ASSIGNED_TO_UNDERWRITING'],
      PENDING_INFORMATION: ['INTAKE_VALIDATION', 'ASSIGNED_TO_UNDERWRITING'],
      ASSIGNED_TO_UNDERWRITING: ['UNDERWRITING_REVIEW'],
      UNDERWRITING_REVIEW: ['REFERRAL_REQUIRED', 'APPROVED_FOR_QUOTE', 'DECLINED', 'PENDING_INFORMATION', 'APPROVED_FOR_POLICY_PROCESSING'],
      REFERRAL_REQUIRED: ['SENIOR_REVIEW'],
      SENIOR_REVIEW: ['APPROVED_FOR_QUOTE', 'DECLINED', 'UNDERWRITING_REVIEW', 'APPROVED_FOR_POLICY_PROCESSING'],
      APPROVED_FOR_QUOTE: ['APPROVED_FOR_POLICY_PROCESSING', 'DECLINED'],
      APPROVED_FOR_POLICY_PROCESSING: ['CORE_ENTRY_PENDING'],
      CORE_ENTRY_PENDING: ['CORE_ENTRY_COMPLETED', 'UNDERWRITING_REVIEW'],
      CORE_ENTRY_COMPLETED: ['CLOSED'],
    };
    // Allow IT_ADMIN and MANAGEMENT to do any transition
    const role = (session.user as any).role;
    if (!['IT_ADMIN', 'MANAGEMENT'].includes(role)) {
      const allowed = validTransitions[current.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: `Invalid status transition from ${current.status} to ${body.status}` }, { status: 400 });
      }
    }
  }

  const updated = await prisma.submission.update({ where: { id: params.id }, data: updateData });

  // Re-run rules if material fields changed
  if (body.sumInsured || body.priorClaimsCount || body.industry || body.productType) {
    await executeRulesForSubmission(params.id);
  }

  await writeAuditLog({
    userId,
    entityType: 'SUBMISSION',
    entityId: params.id,
    action: body.status ? `STATUS_CHANGED_TO_${body.status}` : 'SUBMISSION_UPDATED',
    previousValue: { status: current.status },
    newValue: updateData,
  });

  return NextResponse.json(updated);
}
