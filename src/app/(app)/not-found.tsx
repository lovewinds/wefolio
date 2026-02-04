import Link from 'next/link';

export default function AppNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-8 py-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <Link
          href="/summary/monthly"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          대시보드로 이동
        </Link>
      </div>
    </main>
  );
}
