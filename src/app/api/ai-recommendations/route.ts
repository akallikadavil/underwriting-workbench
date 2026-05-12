import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { AIRecommendationStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get('submissionId');

  const where: any = {};
  if (submissionId) where.submissionId = submissionId;

  const recs = await prisma.aIRecommendation.findMany({
    where,
    include: {
      approvedBy: { select: { name: true } },
      sourceDocument: { select: { fileName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(recs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const rec = await prisma.aIRecommendation.create({
    data: {
      submissionId: body.submissionId,
      agentName: body.agentName,
      recommendationType: body.recommendationType,
      recommendationText: body.recommendationText,
      rationale: body.rationale,
      confidenceScore: body.confidenceScore || 0.75,
      status: AIRecommendationStatus.PENDING,
    },
  });

  return NextResponse.json(rec, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;
  const { id, status, editedText } = body;

  const updated = await prisma.aIRecommendation.update({
    where: { id },
    data: {
      status: status as AIRecommendationStatus,
      editedText,
      approvedByUserId: ['APPROVED', 'REJECTED'].includes(status) ? userId : undefined,
    },
  });

  await writeAuditLog({ userId, entityType: 'AI_RECOMMENDATION', entityId: id, action: `AI_REC_${status}`, newValue: { status } });

  return NextResponse.json(updated);
}
