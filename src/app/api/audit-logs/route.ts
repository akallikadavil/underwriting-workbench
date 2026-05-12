import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: any = {};
  if (entityId) where.entityId = entityId;
  if (entityType) where.entityType = entityType;

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  return NextResponse.json(logs);
}
