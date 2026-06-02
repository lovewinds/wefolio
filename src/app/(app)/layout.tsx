import { LNB } from '@/components/features/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <LNB />
      <main className="main">{children}</main>
    </div>
  );
}
