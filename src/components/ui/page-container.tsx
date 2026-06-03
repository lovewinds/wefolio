interface PageContainerProps {
  isFetching?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function PageContainer({
  isFetching = false,
  className = '',
  children,
}: PageContainerProps) {
  return (
    <div
      className={`content transition-opacity duration-150 ${
        isFetching ? 'pointer-events-none opacity-50' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
