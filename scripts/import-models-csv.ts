/**
 * Bulk-import models from a CSV file.
 *
 * CSV header (case-sensitive):
 *   manufacturer_en,kolas_sub_category,model_name,model_family,
 *   measure_range_min,measure_range_max,measure_unit,accuracy_class,is_verified
 *
 * Usage:
 *   pnpm tsx scripts/import-models-csv.ts ./data/models.csv
 *
 * Lines starting with '#' or empty are ignored. Missing manufacturer/category logs a warning
 * and skips the row — does NOT auto-create masters.
 */
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Row {
  manufacturer_en: string;
  kolas_sub_category: string;
  model_name: string;
  model_family?: string;
  measure_range_min?: string;
  measure_range_max?: string;
  measure_unit?: string;
  accuracy_class?: string;
  is_verified?: string;
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
  if (lines.length === 0) return [];
  const headers = (lines[0] ?? '').split(',').map((h) => h.trim());
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = (lines[i] ?? '').split(',').map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    rows.push(row as unknown as Row);
  }
  return rows;
}

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: tsx scripts/import-models-csv.ts <path/to/models.csv>');
    process.exit(1);
  }

  const text = await readFile(resolve(path), 'utf-8');
  const rows = parseCsv(text);
  console.info(`[import] ${rows.length} rows parsed`);

  const manufacturers = await prisma.manufacturer.findMany({ select: { id: true, nameEn: true } });
  const mfrIdByEn = new Map(manufacturers.map((m) => [m.nameEn, m.id]));

  const kolas = await prisma.kolasCategory.findMany({ select: { id: true, subCategory: true } });
  const kolasIdBySub = new Map(kolas.map((k) => [k.subCategory, k.id]));

  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const manufacturerId = mfrIdByEn.get(row.manufacturer_en);
    if (!manufacturerId) {
      console.warn(`[skip] unknown manufacturer "${row.manufacturer_en}" → ${row.model_name}`);
      skipped++;
      continue;
    }
    const kolasCategoryId = row.kolas_sub_category
      ? kolasIdBySub.get(row.kolas_sub_category)
      : undefined;

    await prisma.model.upsert({
      where: { manufacturerId_modelName: { manufacturerId, modelName: row.model_name } },
      update: {},
      create: {
        manufacturerId,
        kolasCategoryId,
        modelName: row.model_name,
        modelFamily: row.model_family || null,
        measureRangeMin: row.measure_range_min ? Number(row.measure_range_min) : null,
        measureRangeMax: row.measure_range_max ? Number(row.measure_range_max) : null,
        measureUnit: row.measure_unit || null,
        accuracyClass: row.accuracy_class || null,
        isVerified: row.is_verified === 'true',
      },
    });
    inserted++;
  }

  console.info(`[import] done. inserted=${inserted} skipped=${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
