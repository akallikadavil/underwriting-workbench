import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { ExtractionStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get('submissionId');

  const where: any = {};
  if (submissionId) where.submissionId = submissionId;

  const docs = await prisma.document.findMany({
    where,
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;

  const doc = await prisma.document.create({
    data: {
      submissionId: body.submissionId,
      fileName: body.fileName,
      fileType: body.fileType || 'application/pdf',
      filePath: `/uploads/${body.fileName}`,
      documentCategory: body.documentCategory,
      uploadedByUserId: userId,
      extractionStatus: ExtractionStatus.PENDING,
    },
  });

  // Simulate extraction
  setTimeout(async () => {
    const extractedTexts: Record<string, string> = {
      PROPOSAL_FORM: `Proposal form extracted. Insured: ${body.insuredName || 'Unknown'}. Product: Commercial Insurance.`,
      SITE_SURVEY: 'Site survey completed. Risk classification assigned. Recommendations noted.',
      LOSS_HISTORY: 'Loss history extracted. Claims data verified against market records.',
      REINSURANCE_SLIP: 'Reinsurance slip extracted. Cession terms and cedant details captured.',
      MFA_DOCUMENTATION: 'MFA policy documentation extracted. Implementation verified.',
      INCIDENT_RESPONSE_PLAN: 'Incident response plan extracted. Procedures documented.',
      DEFAULT: 'Document processed. Text extraction completed.',
    };

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        extractionStatus: ExtractionStatus.COMPLETED,
        extractedText: extractedTexts[body.documentCategory] || extractedTexts.DEFAULT,
      },
    });
  }, 2000);

  await writeAuditLog({ userId, entityType: 'DOCUMENT', entityId: doc.id, action: 'DOCUMENT_UPLOADED', newValue: { fileName: body.fileName, category: body.documentCategory } });

  return NextResponse.json(doc, { status: 201 });
}
