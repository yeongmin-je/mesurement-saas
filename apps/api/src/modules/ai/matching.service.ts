import { Injectable } from '@nestjs/common';
import type { KolasCategory, Manufacturer, Model } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface MatchResult<T> {
  value: T | null;
  confidence: number;
  method: 'exact' | 'fuzzy' | 'none';
  candidates: T[];
}

// Levenshtein-derived ratio (1.0 = identical, 0.0 = totally different).
function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array(n + 1)
    .fill(0)
    .map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]!;
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(dp[j]!, dp[j - 1]!, prev) + 1;
      prev = tmp;
    }
  }
  const dist = dp[n]!;
  return 1 - dist / Math.max(m, n);
}

function normalize(s: string): string {
  return s.replace(/\s+/g, '').toUpperCase();
}

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async matchManufacturer(rawName: string): Promise<MatchResult<Manufacturer>> {
    if (!rawName) return { value: null, confidence: 0, method: 'none', candidates: [] };

    const normalized = rawName.trim().toUpperCase();

    const exact = await this.prisma.manufacturer.findFirst({
      where: {
        OR: [
          { nameEn: { equals: rawName.trim(), mode: 'insensitive' } },
          { nameKo: { equals: rawName.trim(), mode: 'insensitive' } },
          { aliases: { has: rawName.trim() } },
          { aliases: { has: normalized } },
        ],
      },
    });
    if (exact) return { value: exact, confidence: 1, method: 'exact', candidates: [exact] };

    // Trigram-based fuzzy search via pg_trgm.
    // Note: % operator requires `set_limit(0.3)` or default 0.3 threshold; Prisma uses raw query.
    const fuzzy = await this.prisma.$queryRawUnsafe<Array<Manufacturer & { sim: number }>>(
      `SELECT *,
              GREATEST(similarity(name_en, $1), similarity(name_ko, $1)) AS sim
       FROM manufacturers
       WHERE similarity(name_en, $1) > 0.3 OR similarity(name_ko, $1) > 0.3
       ORDER BY sim DESC
       LIMIT 5`,
      rawName,
    );

    if (fuzzy.length === 0) return { value: null, confidence: 0, method: 'none', candidates: [] };

    const top = fuzzy[0]!;
    const candidates = fuzzy.map((c): Manufacturer => ({ ...c, sim: undefined } as never));
    return {
      value: top,
      confidence: Math.max(top.sim, levenshteinRatio(normalize(top.nameEn), normalized)),
      method: 'fuzzy',
      candidates,
    };
  }

  async matchModel(manufacturerId: number, rawModelName: string): Promise<MatchResult<Model>> {
    if (!rawModelName) return { value: null, confidence: 0, method: 'none', candidates: [] };

    const cleaned = normalize(rawModelName);

    const allModels = await this.prisma.model.findMany({ where: { manufacturerId } });
    const exact = allModels.find((m) => normalize(m.modelName) === cleaned);
    if (exact) return { value: exact, confidence: 1, method: 'exact', candidates: [exact] };

    const scored = allModels
      .map((m) => ({ model: m, score: levenshteinRatio(normalize(m.modelName), cleaned) }))
      .filter((s) => s.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (scored.length === 0) return { value: null, confidence: 0, method: 'none', candidates: [] };

    return {
      value: scored[0]!.model,
      confidence: scored[0]!.score,
      method: 'fuzzy',
      candidates: scored.map((s) => s.model),
    };
  }

  async matchKolasCategory(rawCategory: string): Promise<MatchResult<KolasCategory>> {
    if (!rawCategory) return { value: null, confidence: 0, method: 'none', candidates: [] };

    const exact = await this.prisma.kolasCategory.findFirst({
      where: { subCategory: { equals: rawCategory.trim(), mode: 'insensitive' } },
    });
    if (exact) return { value: exact, confidence: 1, method: 'exact', candidates: [exact] };

    const fuzzy = await this.prisma.$queryRawUnsafe<Array<KolasCategory & { sim: number }>>(
      `SELECT *, similarity(sub_category, $1) AS sim
       FROM kolas_categories
       WHERE similarity(sub_category, $1) > 0.25
       ORDER BY sim DESC
       LIMIT 5`,
      rawCategory,
    );

    if (fuzzy.length === 0) return { value: null, confidence: 0, method: 'none', candidates: [] };

    const top = fuzzy[0]!;
    return {
      value: top,
      confidence: top.sim,
      method: 'fuzzy',
      candidates: fuzzy.map((c): KolasCategory => ({ ...c, sim: undefined } as never)),
    };
  }
}
