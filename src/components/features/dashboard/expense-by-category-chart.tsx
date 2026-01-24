'use client';

import { ResponsivePie } from '@nivo/pie';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/mock-data';

interface CategoryData {
  id: string;
  label: string;
  value: number;
  color?: string;
  children?: CategoryData[];
}

interface ExpenseByCategoryChartProps {
  data: CategoryData[];
}

// 대분류별 색상 팔레트
const categoryColors: Record<string, string> = {
  생활비: '#f43f5e',
  '교통/차량': '#f97316',
  식비: '#fb7185',
  '문화/여가': '#a855f7',
  쇼핑: '#ec4899',
  '건강/의료': '#06b6d4',
  금융: '#3b82f6',
  기타: '#71717a',
};

// 소분류 색상 (대분류 색상보다 밝게)
function getChildColor(parentColor: string, index: number): string {
  const lightness = 0.15 + index * 0.08;
  return adjustColorLightness(parentColor, lightness);
}

function adjustColorLightness(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round((num >> 16) + (255 - (num >> 16)) * amount));
  const g = Math.min(
    255,
    Math.round(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * amount)
  );
  const b = Math.min(255, Math.round((num & 0x0000ff) + (255 - (num & 0x0000ff)) * amount));
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function ExpenseByCategoryChart({ data }: ExpenseByCategoryChartProps) {
  // 대분류 데이터 (내부 도넛)
  const parentData = data.map(item => ({
    id: item.id,
    label: item.label,
    value: item.value,
    color: item.color ?? categoryColors[item.label] ?? '#71717a',
  }));

  // 소분류 데이터 (외부 도넛)
  const childData: {
    id: string;
    label: string;
    value: number;
    color: string;
    parentLabel: string;
  }[] = [];
  data.forEach(parent => {
    const parentColor = parent.color ?? categoryColors[parent.label] ?? '#71717a';
    if (parent.children && parent.children.length > 0) {
      parent.children.forEach((child, index) => {
        childData.push({
          id: child.id,
          label: child.label,
          value: child.value,
          color: getChildColor(parentColor, index),
          parentLabel: parent.label,
        });
      });
    } else {
      // 소분류가 없으면 대분류 자체를 표시
      childData.push({
        id: parent.id,
        label: parent.label,
        value: parent.value,
        color: parentColor,
        parentLabel: parent.label,
      });
    }
  });

  const hasHierarchy = data.some(d => d.children && d.children.length > 0);

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        카테고리별 지출
      </h3>
      <div className="relative h-72">
        {/* 외부 도넛 (소분류) */}
        <div className="absolute inset-0">
          <ResponsivePie
            data={childData}
            margin={{ top: 24, right: 100, bottom: 24, left: 24 }}
            innerRadius={hasHierarchy ? 0.55 : 0.5}
            padAngle={0.5}
            cornerRadius={2}
            activeOuterRadiusOffset={6}
            colors={d => d.data.color}
            borderWidth={0}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={true}
            arcLinkLabelsSkipAngle={12}
            arcLinkLabelsTextColor="#52525b"
            arcLinkLabelsThickness={1.5}
            arcLinkLabelsDiagonalLength={10}
            arcLinkLabelsStraightLength={8}
            arcLinkLabelsTextOffset={4}
            arcLinkLabel={datum => String(datum.label)}
            arcLinkLabelsColor={{ from: 'color' }}
            enableArcLabels={false}
            tooltip={({ datum }) => (
              <div className="rounded-md bg-white px-3 py-2 shadow-lg dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: datum.color }} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {datum.data.parentLabel !== datum.label
                      ? `${datum.data.parentLabel} > ${datum.label}`
                      : datum.label}
                  </span>
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {formatAmount(datum.value)}
                </div>
              </div>
            )}
          />
        </div>

        {/* 내부 도넛 (대분류) - 계층 구조가 있을 때만 표시 */}
        {hasHierarchy && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[45%] w-[45%]" style={{ marginRight: '76px' }}>
              <ResponsivePie
                data={parentData}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                innerRadius={0}
                padAngle={1}
                cornerRadius={2}
                colors={d => d.data.color}
                borderWidth={0}
                borderColor="#ffffff"
                enableArcLinkLabels={false}
                enableArcLabels={true}
                arcLabelsSkipAngle={25}
                arcLabelsTextColor="#ffffff"
                arcLabel={d => String(d.label)}
                isInteractive={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {parentData.slice(0, 6).map(item => (
          <div key={item.id} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
