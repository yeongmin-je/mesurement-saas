import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PdfService } from './pdf.service';
import { IsoAuditGenerator } from './generators/iso-audit.generator';
import { DepartmentReportGenerator } from './generators/department.generator';
import { MonthlyReportGenerator } from './generators/monthly.generator';

@Module({
  imports: [UploadsModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    PdfService,
    IsoAuditGenerator,
    DepartmentReportGenerator,
    MonthlyReportGenerator,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
