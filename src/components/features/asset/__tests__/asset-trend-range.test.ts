import { describe, expect, it } from 'vitest';
import { computeAssetTrendRange } from '../asset-trend-range';

describe('computeAssetTrendRange', () => {
  it('uses the selected month as the trend end month', () => {
    expect(computeAssetTrendRange(6, { year: 2026, month: 6 }, null)).toEqual({
      startYear: 2026,
      startMonth: 1,
      endYear: 2026,
      endMonth: 6,
    });
  });

  it('uses the full available range start for all-period trend and selected month as end', () => {
    expect(
      computeAssetTrendRange(
        0,
        { year: 2026, month: 6 },
        {
          min: { year: 2025, month: 3 },
          max: { year: 2026, month: 5 },
        }
      )
    ).toEqual({
      startYear: 2025,
      startMonth: 3,
      endYear: 2026,
      endMonth: 6,
    });
  });
});
