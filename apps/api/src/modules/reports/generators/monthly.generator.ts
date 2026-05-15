import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { escapeHtml, formatDate, wrapHtml } from './base';

@Injectable()
export class MonthlyReportGenerator {
  constructor(private readonly prisma: PrismaService) {}

  async generate(tenantId: string, year: number, month: number): Promise<{ title: string; html: string }> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [calibrations, registered] = await Promise.all([
      this.prisma.calibration.findMany({
        where: { instrument: { tenantId }, performedAt: { gte: start, lt: end }, deletedAt: null },
        include: { instrument: true },
        orderBy: { performedAt: 'asc' },
      }),
      this.prisma.instrument.count({ where: { tenantId, createdAt: { gte: start, lt: end } } }),
    ]);

    const passCount = calibrations.filter((c) => c.result === 'pass').length;
    const failCount = calibrations.filter((c) => c.result === 'fail').length;
    const conditionalCount = calibrations.filter((c) => c.result === 'conditional').length;

    const title = `월간 보고서 — ${year}년 ${month}월`;

    const calRows = calibrations
      .map(
        (c) => `<tr>
          <td>${formatDate(c.performedAt)}</td>
          <td>${escapeHtml(c.instrument.assetCode)}</td>
          <td>${escapeHtml(c.calibrationOrgText)}</td>
          <td><span class="badge badge-${c.result === 'fail' ? 'overdue' : c.result === 'conditional' ? 'imminent' : 'normal'}">${escapeHtml(c.result)}</span></td>
          <td>${escapeHtml(c.certificateNo)}</td>
        </tr>`,
      )
      .join('\n');

    const body = `
      <h1>${escapeHtml(title)}</h1>
      <div class="summary-grid">
        <div class="summary-card"><div class="label">신규 등록</div><div class="value">${registered}</div></div>
        <div class="summary-card"><div class="label">총 교정 건수</div><div class="value">${calibrations.length}</div></div>
        <div class="summary-card"><div class="label">합격</div><div class="value" style="color:#065f46">${passCount}</div></div>
        <div class="summary-card"><div class="label">불합격</div><div class="value" style="color:#b91c1c">${failCount}</div></div>
      </div>

      <h2>교정 이력</h2>
      <table>
        <thead>
          <tr>
            <th>실시일</th>
            <th>관리번호</th>
            <th>교정기관</th>
            <th>결과</th>
            <th>성적서 번호</th>
          </tr>
        </thead>
        <tbody>${calRows || '<tr><td colspan="5">데이터 없음</td></tr>'}</tbody>
      </table>

      <p class="meta" style="margin-top:16pt">조건부 합격: ${conditionalCount}건</p>
    `;

    return { title, html: wrapHtml(title, body) };
  }
}
