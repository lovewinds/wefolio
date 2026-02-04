import { LNB } from '@/components/features/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <LNB />
      <div className="ml-16">{children}</div>
    </div>
  );
}
