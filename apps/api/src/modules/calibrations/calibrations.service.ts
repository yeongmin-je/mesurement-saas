import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { computeNextCalibrationDate } from '@metroai/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCalibrationDto } from './dto/create-calibration.dto';

@Injectable()
export class CalibrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForInstrument(tenantId: string, instrumentId: string) {
    // Make sure the instrument belongs to the caller's tenant.
    const instrument = await this.prisma.instrument.findFirst({
      where: { id: instrumentId, tenantId },
      select: { id: true },
    });
    if (!instrument) throw new NotFoundException('측정기를 찾을 수 없습니다');

    return this.prisma.calibration.findMany({
      where: { instrumentId, deletedAt: null },
      orderBy: { performedAt: 'desc' },
      include: { calibrationOrg: true },
    });
  }

  async create(
    tenantId: string,
    userId: string,
    instrumentId: string,
    dto: CreateCalibrationDto,
  ) {
    const instrument = await this.prisma.instrument.findFirst({
      where: { id: instrumentId, tenantId },
    });
    if (!instrument) throw new NotFoundException('측정기를 찾을 수 없습니다');

    const performedAt = new Date(dto.performedAt);

    return this.prisma.$transaction(async (tx) => {
      const calibration = await tx.calibration.create({
        data: {
          instrumentId,
          performedAt,
          calibrationOrgId: dto.calibrationOrgId,
          calibrationOrgText: dto.calibrationOrgText,
          performedByName: dto.performedByName,
          asFoundData: dto.asFoundData as unknown as Prisma.InputJsonValue,
          asLeftData: dto.asLeftData as unknown as Prisma.InputJsonValue,
          uncertainty: dto.uncertainty,
          result: dto.result,
          certificateNo: dto.certificateNo,
          certificateS3Key: dto.certificateS3Key,
          cost: dto.cost,
          notes: dto.notes,
          createdById: userId,
        },
      });

      // Auto-update the instrument's next calibration date and status based on the result.
      if (dto.result === 'pass') {
        const nextCalibrationAt = computeNextCalibrationDate(performedAt, instrument.cycleMonths);
        await tx.instrument.update({
          where: { id: instrumentId },
          data: {
            lastCalibrationAt: performedAt,
            nextCalibrationAt,
            status: 'active',
            statusChangedAt: new Date(),
          },
        });
      } else if (dto.result === 'fail') {
        await tx.instrument.update({
          where: { id: instrumentId },
          data: {
            lastCalibrationAt: performedAt,
            status: 'suspended',
            statusChangedAt: new Date(),
          },
        });
      } else {
        // conditional: keep status active but record the last calibration date.
        await tx.instrument.update({
          where: { id: instrumentId },
          data: { lastCalibrationAt: performedAt },
        });
      }

      return calibration;
    });
  }

  async softDelete(tenantId: string, calibrationId: string): Promise<void> {
    const calibration = await this.prisma.calibration.findFirst({
      where: { id: calibrationId, instrument: { tenantId }, deletedAt: null },
    });
    if (!calibration) throw new NotFoundException('교정 이력을 찾을 수 없습니다');

    await this.prisma.calibration.update({
      where: { id: calibrationId },
      data: { deletedAt: new Date() },
    });
  }

  async listUpcoming(tenantId: string, daysAhead = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + daysAhead);

    return this.prisma.instrument.findMany({
      where: {
        tenantId,
        status: 'active',
        nextCalibrationAt: { lte: horizon },
      },
      orderBy: { nextCalibrationAt: 'asc' },
      include: {
        model: { include: { manufacturer: true } },
        kolasCategory: true,
        department: true,
      },
      take: 200,
    });
  }
}
