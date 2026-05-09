import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/asset/monthly-input/route';
import { holdingValueSnapshotService } from '@/services/holding-service';
import type { AssetMonthlyInputDraft } from '@/types';

vi.mock('@/services/holding-service', () => ({
  holdingValueSnapshotService: {
    getMonthlyInputDraft: vi.fn(),
    saveMonthlyInput: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/asset/monthly-input', () => {
  it('returns 400 when year/month query is invalid', async () => {
    const response = await GET(nextRequest('/api/asset/monthly-input?year=2026&month=13'));
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: 'Invalid or missing year/month parameters',
    });
    expect(holdingValueSnapshotService.getMonthlyInputDraft).not.toHaveBeenCalled();
  });

  it('returns a monthly input draft', async () => {
    const draft = monthlyInputDraft();
    vi.mocked(holdingValueSnapshotService.getMonthlyInputDraft).mockResolvedValue(draft);

    const response = await GET(nextRequest('/api/asset/monthly-input?year=2026&month=5'));
    const body = (await response.json()) as ApiBody<AssetMonthlyInputDraft>;

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, data: draft });
    expect(holdingValueSnapshotService.getMonthlyInputDraft).toHaveBeenCalledWith(2026, 5);
  });
});

describe('POST /api/asset/monthly-input', () => {
  it('returns 400 for an invalid body', async () => {
    const response = await POST(jsonRequest('/api/asset/monthly-input', { year: 2026, month: 5 }));
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
    expect(holdingValueSnapshotService.saveMonthlyInput).not.toHaveBeenCalled();
  });

  it('saves monthly input rows', async () => {
    const draft = monthlyInputDraft();
    vi.mocked(holdingValueSnapshotService.saveMonthlyInput).mockResolvedValue(draft);
    const row = {
      holdingId: 'holding-1',
      accountId: 'account-1',
      assetMasterId: 'asset-1',
      date: '2026-05-31',
      quantity: 1,
      priceOriginal: 1000,
      exchangeRate: null,
      priceKRW: 1000,
      totalValueKRW: 1000,
    };

    const response = await POST(
      jsonRequest('/api/asset/monthly-input', {
        year: 2026,
        month: 5,
        rows: [row],
      })
    );
    const body = (await response.json()) as ApiBody<AssetMonthlyInputDraft>;

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, data: draft });
    expect(holdingValueSnapshotService.saveMonthlyInput).toHaveBeenCalledWith(2026, 5, [row]);
  });
});

function nextRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

function jsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function monthlyInputDraft(): AssetMonthlyInputDraft {
  return {
    year: 2026,
    month: 5,
    date: '2026-05-31',
    mode: 'create',
    prevMonth: { year: 2026, month: 4 },
    prevTotalValue: 1000,
    currentTotalValue: 1000,
    deltaAmount: 0,
    rows: [],
  };
}

interface ApiBody<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
