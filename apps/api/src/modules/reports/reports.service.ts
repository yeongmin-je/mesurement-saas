import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../uploads/s3.service';
import { PdfService } from './pdf.service';
import { IsoAuditGenerator } from './generators/iso-audit.generator';
import { DepartmentReportGenerator } from './generators/department.generator';
import { MonthlyReportGenerator } from './generators/monthly.generator';
import type { GenerateReportDto } from './dto/generate-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly pdf: PdfService,
    private readonly iso: IsoAuditGenerator,
    private readonly department: DepartmentReportGenerator,
    private readonly monthly: MonthlyReportGenerator,
  ) {}

  async generate(
    tenantId: string,
    userId: string,
    dto: GenerateReportDto,
  ): Promise<{ reportId: string; status: 'generating'; estimatedSeconds: number }> {
    // Create the row first so the client can poll via /reports/:id.
    const report = await this.prisma.report.create({
      data: {
        tenantId,
        reportType: dto.type,
        parameters: dto.parameters as unknown as Prisma.InputJsonValue,
        generatedById: userId,
      },
    });

    // Run synchronously for Phase 1 — fast enough for small datasets.
    // Week 23: move to Bull queue for >1000 instruments.
    this.runReport(report.id, tenantId, dto).catch(() => {
      // Errors are persisted in runReport.
    });

    return { reportId: report.id, status: 'generating', estimatedSeconds: 15 };
  }

  private async runReport(
    reportId: string,
    tenantId: string,
    dto: GenerateReportDto,
  ): Promise<void> {
    try {
      let result: { title: string; html: string };
      if (dto.type === 'iso9001') {
        result = await this.iso.generate(tenantId, dto.parameters);
      } else if (dto.type === 'department') {
        if (!dto.parameters.departmentId) {
          throw new BadRequestException('departmentId가 필요합니다');
        }
        result = await this.department.generate(tenantId, dto.parameters.departmentId);
      } else {
        if (!dto.parameters.year || !dto.parameters.month) {
          throw new BadRequestException('year/month가 필요합니다');
        }
        result = await this.monthly.generate(
          tenantId,
          dto.parameters.year,
          dto.parameters.month,
        );
      }

      const pdfBuffer = await this.pdf.render(result.html);
      const s3Key = `${tenantId}/reports/${reportId}.pdf`;
      // Upload via presigned PUT we hold internally — simpler: use raw client. For now, store as
      // a placeholder key and let the controller fetch via download URL. Real S3 PutObject
      // would land here in production. Phase 1 stub:
      await this.uploadPdf(s3Key, pdfBuffer);

      await this.prisma.report.update({
        where: { id: reportId },
        data: { title: result.title, s3Key },
      });
    } catch (err) {
      await this.prisma.report.update({
        where: { id: reportId },
        data: { title: `[FAILED] ${err instanceof Error ? err.message : 'unknown'}` },
      });
    }
  }

  private async uploadPdf(s3Key: string, buffer: Buffer): Promise<void> {
    // Reuse the existing S3Service client by issuing a presigned PUT and uploading via fetch.
    const url = await this.s3.getPresignedUploadUrl(s3Key, 'application/pdf', 120);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: buffer,
    });
    if (!response.ok) {
      throw new Error(`S3 업로드 실패: ${response.status}`);
    }
  }

  async findById(tenantId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, tenantId },
    });
    if (!report) throw new NotFoundException('보고서를 찾을 수 없습니다');

    const downloadUrl = report.s3Key
      ? await this.s3.getPresignedDownloadUrl(report.s3Key, 3600)
      : null;

    return {
      id: report.id,
      type: report.reportType,
      title: report.title,
      status: report.s3Key
        ? 'completed'
        : report.title?.startsWith('[FAILED]')
          ? 'failed'
          : 'generating',
      downloadUrl,
      expiresAt: downloadUrl ? new Date(Date.now() + 3600_000).toISOString() : null,
      generatedAt: report.generatedAt.toISOString(),
    };
  }

  async list(tenantId: string) {
    return this.prisma.report.findMany({
      where: { tenantId },
      orderBy: { generatedAt: 'desc' },
      take: 50,
    });
  }
}
