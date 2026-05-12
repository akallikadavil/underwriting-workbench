import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  // Only certain roles can list all users
  const where: any = { active: true };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, department: true, country: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminRole = (session.user as any).role;
  if (adminRole !== 'IT_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const hashed = await bcrypt.hash(body.password || 'Password123!', 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashed,
      role: body.role,
      department: body.department,
      country: body.country || 'TH',
    },
    select: { id: true, name: true, email: true, role: true, department: true },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminRole = (session.user as any).role;
  if (adminRole !== 'IT_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  if (data.password) data.password = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, department: true, active: true },
  });

  return NextResponse.json(user);
}
