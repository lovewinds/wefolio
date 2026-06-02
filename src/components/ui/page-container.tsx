interface PageContainerProps {
  isFetching?: boolean;
  children: React.ReactNode;
}

export function PageContainer({ isFetching = false, children }: PageContainerProps) {
  return (
    <div
      className={`content transition-opacity duration-150 ${
        isFetching ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      {children}
    </div>
  );
}
