import { prisma } from '@/lib/prisma';

export async function writeAuditLog({
  userId,
  entityType,
  entityId,
  action,
  previousValue,
  newValue,
}: {
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  previousValue?: any;
  newValue?: any;
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      entityType,
      entityId,
      action,
      previousValueJson: previousValue || undefined,
      newValueJson: newValue || undefined,
    },
  });
}
