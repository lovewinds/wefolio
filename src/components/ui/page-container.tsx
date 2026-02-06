interface PageContainerProps {
  isFetching?: boolean;
  children: React.ReactNode;
}

export function PageContainer({ isFetching = false, children }: PageContainerProps) {
  return (
    <main
      className={`px-8 py-1 transition-opacity duration-150 ${
        isFetching ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      {children}
    </main>
  );
}
