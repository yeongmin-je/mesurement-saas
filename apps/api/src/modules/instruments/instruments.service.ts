import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  buildAssetCode,
  classifyCalibrationStatus,
  computeNextCalibrationDate,
  daysUntil,
} from '@metroai/utils';
import type { InstrumentDetail, InstrumentSummary } from '@metroai/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { QueryInstrumentsDto } from './dto/query-instruments.dto';

const DEFAULT_CYCLE_MONTHS = 12;

@Injectable()
export class InstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    query: QueryInstrumentsDto,
  ): Promise<{ data: InstrumentSummary[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InstrumentWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.kolasCategoryId) where.kolasCategoryId = query.kolasCategoryId;
    if (query.manufacturerId) where.manufacturerId = query.manufacturerId;
    if (query.q) {
      where.OR = [
        { assetCode: { contains: query.q, mode: 'insensitive' } },
        { serialNumber: { contains: query.q, mode: 'insensitive' } },
        { modelText: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.InstrumentOrderByWithRelationInput =
      query.sort === 'next_calibration'
        ? { nextCalibrationAt: 'asc' }
        : query.sort === 'name'
          ? { assetCode: 'asc' }
          : { createdAt: 'desc' };

    const [rows, total] = await Promise.all([
      this.prisma.instrument.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          model: { include: { manufacturer: true } },
          kolasCategory: true,
          department: true,
          photos: { where: { isPrimary: true }, take: 1 },
        },
      }),
      this.prisma.instrument.count({ where }),
    ]);

    const data: InstrumentSummary[] = rows.map((r) => ({
      id: r.id,
      assetCode: r.assetCode,
      serialNumber: r.serialNumber,
      model: r.model
        ? {
            id: r.model.id,
            name: r.model.modelName,
            manufacturer: r.model.manufacturer.nameKo,
          }
        : null,
      category: r.kolasCategory?.subCategory ?? r.categoryText ?? null,
      department: r.department?.name ?? null,
      status: r.status as InstrumentSummary['status'],
      nextCalibrationAt: r.nextCalibrationAt?.toISOString().slice(0, 10) ?? null,
      calibrationStatus: classifyCalibrationStatus(r.nextCalibrationAt),
      primaryPhotoUrl: null, // resolved later via S3 presign service
    }));

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateInstrumentDto,
  ): Promise<InstrumentDetail> {
    const cycleMonths =
      dto.cycleMonths ??
      (dto.kolasCategoryId
        ? (
            await this.prisma.kolasCategory.findUnique({
              where: { id: dto.kolasCategoryId },
              select: { standardCycleMonths: true },
            })
          )?.standardCycleMonths ?? DEFAULT_CYCLE_MONTHS
        : DEFAULT_CYCLE_MONTHS);

    const assetCode = dto.assetCode ?? (await this.nextAssetCode(tenantId));

    const nextCalibrationAt = dto.acquiredAt
      ? computeNextCalibrationDate(new Date(dto.acquiredAt), cycleMonths)
      : null;

    const created = await this.prisma.instrument.create({
      data: {
        tenantId,
        assetCode,
        serialNumber: dto.serialNumber ?? null,
        kolasCategoryId: dto.kolasCategoryId,
        manufacturerId: dto.manufacturerId,
        modelId: dto.modelId,
        categoryText: dto.categoryText,
        manufacturerText: dto.manufacturerText,
        modelText: dto.modelText,
        measureRangeMin: dto.measureRangeMin,
        measureRangeMax: dto.measureRangeMax,
        measureUnit: dto.measureUnit,
        accuracyClass: dto.accuracyClass,
        departmentId: dto.departmentId,
        location: dto.location,
        custodianId: dto.custodianId,
        acquiredAt: dto.acquiredAt ? new Date(dto.acquiredAt) : null,
        acquiredCost: dto.acquiredCost,
        cycleMonths,
        nextCalibrationAt,
        aiRecognition: dto.aiRecognition ? (dto.aiRecognition as Prisma.InputJsonValue) : undefined,
        notes: dto.notes,
        createdById: userId,
      },
    });

    if (dto.photoIds?.length) {
      await this.prisma.instrumentPhoto.updateMany({
        where: { id: { in: dto.photoIds } },
        data: { instrumentId: created.id },
      });
    }

    return this.findById(tenantId, created.id);
  }

  async findById(tenantId: string, id: string): Promise<InstrumentDetail> {
    const row = await this.prisma.instrument.findFirst({
      where: { id, tenantId },
      include: {
        kolasCategory: true,
        manufacturer: true,
        model: true,
        department: true,
        custodian: true,
        photos: true,
      },
    });
    if (!row) throw new NotFoundException('측정기를 찾을 수 없습니다');

    return {
      id: row.id,
      tenantId: row.tenantId,
      assetCode: row.assetCode,
      serialNumber: row.serialNumber,
      category: row.kolasCategory
        ? { id: row.kolasCategory.id, name: row.kolasCategory.subCategory }
        : null,
      manufacturer: row.manufacturer
        ? { id: row.manufacturer.id, name: row.manufacturer.nameKo }
        : null,
      model: row.model ? { id: row.model.id, name: row.model.modelName } : null,
      measureRange: {
        min: row.measureRangeMin ? Number(row.measureRangeMin) : null,
        max: row.measureRangeMax ? Number(row.measureRangeMax) : null,
        unit: row.measureUnit,
      },
      accuracyClass: row.accuracyClass,
      department: row.department ? { id: row.department.id, name: row.department.name } : null,
      location: row.location,
      custodian: row.custodian ? { id: row.custodian.id, name: row.custodian.name } : null,
      status: row.status as InstrumentDetail['status'],
      acquiredAt: row.acquiredAt?.toISOString().slice(0, 10) ?? null,
      acquiredCost: row.acquiredCost ? Number(row.acquiredCost) : null,
      cycleMonths: row.cycleMonths,
      cycleAdjusted: row.cycleAdjusted,
      cycleAdjustedReason: row.cycleAdjustedReason,
      lastCalibrationAt: row.lastCalibrationAt?.toISOString().slice(0, 10) ?? null,
      nextCalibrationAt: row.nextCalibrationAt?.toISOString().slice(0, 10) ?? null,
      daysUntilCalibration: row.nextCalibrationAt ? daysUntil(row.nextCalibrationAt) : null,
      calibrationStatus: classifyCalibrationStatus(row.nextCalibrationAt),
      photos: row.photos.map((p) => ({
        id: p.id,
        url: '', // resolved via S3 presign service
        isPrimary: p.isPrimary,
        isNameplate: p.isNameplate,
        uploadedAt: p.uploadedAt.toISOString(),
      })),
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async nextAssetCode(tenantId: string): Promise<string> {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const count = await this.prisma.instrument.count({
      where: { tenantId, createdAt: { gte: start } },
    });
    return buildAssetCode(count + 1, { date: today });
  }
}
