import { prisma, Prisma } from '@accred-iq/database';

export async function recordAudit(params: {
  userId?: string;
  action: string;
  targetTable: string;
  targetId?: string;
  targetComponent: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: params as Prisma.AuditLogUncheckedCreateInput,
  });
}
