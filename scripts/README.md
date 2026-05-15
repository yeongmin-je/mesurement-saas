# scripts/

개발 보조 스크립트.

| 스크립트 | 설명 | 추가 시점 |
|---|---|---|
| `seed-master-data.ts` | 마스터 DB 채우기 (KOLAS·제조사·모델) | Week 1 |
| `import-models-csv.ts` | CSV → DB import | Week 20 |
| `generate-test-photos.ts` | AI PoC용 테스트 사진 정리 | Week 5 |

실행:

```bash
pnpm tsx scripts/seed-master-data.ts
```
