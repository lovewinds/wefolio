'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AssetMasterPicker } from './asset-master-picker';
import type { AssetMasterOption } from '@/components/features/asset-transaction/types';

export function AddHoldingInline({
  assetMasters,
  excludeIds,
  onCreateAssetMaster,
  onAdd,
}: {
  assetMasters: AssetMasterOption[];
  excludeIds: Set<string>;
  onCreateAssetMaster: (data: {
    name: string;
    assetClass: string;
    currency: string;
    riskLevel: string;
  }) => Promise<AssetMasterOption>;
  onAdd: (assetMaster: AssetMasterOption) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-soft hover:text-ink"
      >
        <Plus size={15} />
        종목 추가
      </button>
    );
  }

  return (
    <AssetMasterPicker
      assetMasters={assetMasters}
      excludeIds={excludeIds}
      onCreate={onCreateAssetMaster}
      onPick={master => {
        onAdd(master);
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
    />
  );
}
