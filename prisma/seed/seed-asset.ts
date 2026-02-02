import { PrismaClient } from '@prisma/client';
import { insertAssetSeedData } from './insert-asset-data';
import type { SeedOptions } from './read-xlsx-common';
import { buildAssetSnapshotsFromXlsx } from './read-xlsx-asset';
import { confirmApproval, formatUtcDate } from './seed-common';

export type SeedAssetOptions = Omit<SeedOptions, 'sheetNumber'> & {
  filePath: string;
};

export async function seedAsset(prisma: PrismaClient, options: SeedAssetOptions): Promise<void> {
  console.log('📊 자산 스냅샷 데이터 로드 중... (시트 7)');
  const assetResult = buildAssetSnapshotsFromXlsx({
    ...options,
    sheetNumber: 7,
  });
  console.log(`   ✅ ${assetResult.snapshots.length}건 로드됨 (시트: ${assetResult.sheetName})`);

  // 경고 출력
  if (assetResult.warnings.length > 0) {
    console.log(`⚠️ 자산 데이터 경고 ${assetResult.warnings.length}건`);
    assetResult.warnings.slice(0, 10).forEach(warning => console.log(`   - ${warning}`));
    if (assetResult.warnings.length > 10) {
      console.log(`   ... ${assetResult.warnings.length - 10}건 더 있음`);
    }
    console.log('');
  }

  // 요약 출력
  console.log('📄 자산 스냅샷 데이터 요약');
  console.log(`   파일: ${options.filePath}`);
  console.log(`   무시 행: ${options.skipRows}`);
  console.log(`   총 건수: ${assetResult.snapshots.length}건`);

  if (options.verbose && assetResult.sampleRecord) {
    const formatted = JSON.stringify(
      assetResult.sampleRecord,
      (_key, value) => {
        if (value instanceof Date) {
          return formatUtcDate(value);
        }
        return value;
      },
      2
    );
    console.log('   샘플 자산 데이터:');
    formatted.split('\n').forEach(line => console.log(`     ${line}`));
    console.log('');
  }

  // 멤버별, 기관별 통계 계산
  const memberCounts = new Map<string, number>();
  const institutionCounts = new Map<string, number>();
  for (const snapshot of assetResult.snapshots) {
    memberCounts.set(snapshot.memberName, (memberCounts.get(snapshot.memberName) ?? 0) + 1);
    institutionCounts.set(
      snapshot.institutionName,
      (institutionCounts.get(snapshot.institutionName) ?? 0) + 1
    );
  }

  console.log('   구성원별 건수:');
  for (const [member, count] of Array.from(memberCounts.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    console.log(`     - ${member}: ${count}건`);
  }

  console.log('   기관별 건수:');
  for (const [institution, count] of Array.from(institutionCounts.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    console.log(`     - ${institution}: ${count}건`);
  }

  const approved = await confirmApproval(options, '자산 데이터를 저장할까요?');

  if (!approved) {
    console.log('⏹️ 자산 시드가 승인되지 않아 건너뜁니다.\n');
    return;
  }

  await insertAssetSeedData(prisma, assetResult.snapshots);
}
