import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { escapeHtml, formatDate, wrapHtml } from './base';

interface IsoAuditParams {
  dateFrom?: string;
  dateTo?: string;
  departmentIds?: string[];
}

@Injectable()
export class IsoAuditGenerator {
  constructor(private readonly prisma: PrismaService) {}

  async generate(tenantId: string, params: IsoAuditParams): Promise<{ title: string; html: string }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('사업장을 찾을 수 없습니다');

    const dateFrom = params.dateFrom ? new Date(params.dateFrom) : null;
    const dateTo = params.dateTo ? new Date(params.dateTo) : null;

    const instruments = await this.prisma.instrument.findMany({
      where: {
        tenantId,
        ...(params.departmentIds?.length ? { departmentId: { in: params.departmentIds } } : {}),
      },
      include: {
        kolasCategory: true,
        manufacturer: true,
        model: true,
        department: true,
        calibrations: {
          where: {
            deletedAt: null,
            ...(dateFrom ? { performedAt: { gte: dateFrom } } : {}),
            ...(dateTo ? { performedAt: { lte: dateTo } } : {}),
          },
          orderBy: { performedAt: 'desc' },
        },
      },
      orderBy: { assetCode: 'asc' },
    });

    const total = instruments.length;
    const active = instruments.filter((i) => i.status === 'active').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = instruments.filter(
      (i) => i.status === 'active' && i.nextCalibrationAt && i.nextCalibrationAt < today,
    ).length;
    const calibratedInPeriod = instruments.reduce((sum, i) => sum + i.calibrations.length, 0);

    const title = `ISO 심사 보고서 — ${tenant.name}`;

    const summarySection = `
      <h2>요약</h2>
      <div class="summary-grid">
        <div class="summary-card"><div class="label">보유 측정기</div><div class="value">${total}</div></div>
        <div class="summary-card"><div class="label">활성</div><div class="value">${active}</div></div>
        <div class="summary-card"><div class="label">교정 만료</div><div class="value" style="color:#b91c1c">${overdue}</div></div>
        <div class="summary-card"><div class="label">기간 내 교정</div><div class="value">${calibratedInPeriod}</div></div>
      </div>
    `;

    const detailRows = instruments
      .map((i) => {
        const calStatus =
          i.nextCalibrationAt && i.nextCalibrationAt < today
            ? `<span class="badge badge-overdue">만료</span>`
            : i.nextCalibrationAt &&
                (i.nextCalibrationAt.getTime() - today.getTime()) / 86_400_000 <= 30
              ? `<span class="badge badge-imminent">임박</span>`
              : `<span class="badge badge-normal">정상</span>`;
        const lastCal = i.calibrations[0];
        return `<tr>
          <td>${escapeHtml(i.assetCode)}</td>
          <td>${escapeHtml(i.kolasCategory?.subCategory ?? i.categoryText)}</td>
          <td>${escapeHtml(i.manufacturer?.nameKo ?? i.manufacturerText)} ${escapeHtml(i.model?.modelName ?? i.modelText)}</td>
          <td>${escapeHtml(i.department?.name)}</td>
          <td>${formatDate(i.nextCalibrationAt)}</td>
          <td>${calStatus}</td>
          <td>${lastCal ? `${formatDate(lastCal.performedAt)} (${escapeHtml(lastCal.result)})` : '-'}</td>
        </tr>`;
      })
      .join('\n');

    const detailSection = `
      <h2>측정기 목록</h2>
      <table>
        <thead>
          <tr>
            <th>관리번호</th>
            <th>카테고리</th>
            <th>모델</th>
            <th>부서</th>
            <th>차기교정일</th>
            <th>상태</th>
            <th>최근 교정</th>
          </tr>
        </thead>
        <tbody>${detailRows || '<tr><td colspan="7">데이터 없음</td></tr>'}</tbody>
      </table>
    `;

    const body = `
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">사업자: ${escapeHtml(tenant.businessNo ?? '-')} · 기간: ${formatDate(dateFrom)} ~ ${formatDate(dateTo)}</p>
      ${summarySection}
      ${detailSection}
    `;

    return { title, html: wrapHtml(title, body) };
  }
}
