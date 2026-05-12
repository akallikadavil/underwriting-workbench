import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rules = await prisma.rule.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'IT_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const rule = await prisma.rule.create({
    data: {
      ruleName: body.ruleName,
      productType: body.productType || undefined,
      country: body.country || 'TH',
      ruleType: body.ruleType,
      conditionJson: body.conditionJson,
      actionJson: body.actionJson,
      severity: body.severity,
      description: body.description,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(rule, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'IT_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  const rule = await prisma.rule.update({ where: { id }, data });
  return NextResponse.json(rule);
}
