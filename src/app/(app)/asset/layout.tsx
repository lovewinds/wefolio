import { AssetSubNav } from '@/components/features/asset';

export default function AssetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="px-8 pt-8 pb-4">
        <AssetSubNav />
      </div>
      {children}
    </div>
  );
}
