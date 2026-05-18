import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const inSevenDays = new Date(today);
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    const inThirtyDays = new Date(today);
    inThirtyDays.setDate(inThirtyDays.getDate() + 30);

    const [
      totalInstruments,
      activeInstruments,
      calibrationsThisMonth,
      calibrationsImminent,
      calibrationsOverdue,
      statusGroups,
      departmentGroups,
      recentInstruments,
    ] = await Promise.all([
      this.prisma.instrument.count({ where: { tenantId } }),
      this.prisma.instrument.count({ where: { tenantId, status: 'active' } }),
      this.prisma.calibration.count({
        where: { instrument: { tenantId }, performedAt: { gte: monthStart }, deletedAt: null },
      }),
      this.prisma.instrument.count({
        where: {
          tenantId,
          status: 'active',
          nextCalibrationAt: { gte: today, lte: inThirtyDays },
        },
      }),
      this.prisma.instrument.count({
        where: { tenantId, status: 'active', nextCalibrationAt: { lt: today } },
      }),
      this.prisma.instrument.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      this.prisma.instrument.groupBy({
        by: ['departmentId'],
        where: { tenantId, departmentId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.instrument.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { createdBy: { select: { name: true } } },
      }),
    ]);

    const departmentIds = departmentGroups
      .map((g) => g.departmentId)
      .filter((id): id is string => !!id);
    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
    });
    const departmentMap = new Map(departments.map((d) => [d.id, d.name]));

    return {
      totalInstruments,
      activeInstruments,
      calibrationsThisMonth,
      calibrationsImminent,
      calibrationsOverdue,
      statusDistribution: Object.fromEntries(
        statusGroups.map((g) => [g.status, g._count._all]),
      ),
      departmentDistribution: departmentGroups
        .map((g) => ({
          departmentId: g.departmentId,
          name: g.departmentId ? departmentMap.get(g.departmentId) ?? '-' : '-',
          count: g._count._all,
        }))
        .sort((a, b) => b.count - a.count),
      recentActivities: recentInstruments.map((i) => ({
        type: 'instrument_registered' as const,
        instrumentId: i.id,
        assetCode: i.assetCode,
        userName: i.createdBy?.name ?? '-',
        at: i.createdAt.toISOString(),
      })),
    };
  }
}
