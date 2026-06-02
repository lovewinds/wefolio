import Link from 'next/link';

export default function AppNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-8 py-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-ink">페이지를 찾을 수 없습니다</h2>
        <p className="mt-2 text-sm text-ink-muted">요청하신 페이지가 존재하지 않습니다.</p>
        <Link
          href="/budget/monthly"
          className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
        >
          대시보드로 이동
        </Link>
      </div>
    </main>
  );
}
