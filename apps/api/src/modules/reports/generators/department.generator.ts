import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { escapeHtml, formatDate, wrapHtml } from './base';

@Injectable()
export class DepartmentReportGenerator {
  constructor(private readonly prisma: PrismaService) {}

  async generate(tenantId: string, departmentId: string): Promise<{ title: string; html: string }> {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, tenantId },
    });
    if (!department) throw new Error('부서를 찾을 수 없습니다');

    const instruments = await this.prisma.instrument.findMany({
      where: { tenantId, departmentId },
      include: { kolasCategory: true, manufacturer: true, model: true, custodian: true },
      orderBy: { assetCode: 'asc' },
    });

    const title = `부서별 현황 — ${department.name}`;
    const rows = instruments
      .map(
        (i) => `<tr>
          <td>${escapeHtml(i.assetCode)}</td>
          <td>${escapeHtml(i.manufacturer?.nameKo ?? i.manufacturerText)} ${escapeHtml(i.model?.modelName ?? i.modelText)}</td>
          <td>${escapeHtml(i.kolasCategory?.subCategory ?? i.categoryText)}</td>
          <td>${escapeHtml(i.custodian?.name)}</td>
          <td>${escapeHtml(i.location)}</td>
          <td>${formatDate(i.nextCalibrationAt)}</td>
          <td>${escapeHtml(i.status)}</td>
        </tr>`,
      )
      .join('\n');

    const body = `
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">총 ${instruments.length}대 보유</p>
      <table>
        <thead>
          <tr>
            <th>관리번호</th>
            <th>모델</th>
            <th>카테고리</th>
            <th>담당자</th>
            <th>위치</th>
            <th>차기교정일</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7">데이터 없음</td></tr>'}</tbody>
      </table>
    `;

    return { title, html: wrapHtml(title, body) };
  }
}
