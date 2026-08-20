import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loader({ className, size = 'md' }: LoaderProps) {
  if (size === 'sm') {
    return (
      <div className={cn('relative inline-flex items-center justify-center w-4 h-4 mr-2 shrink-0', className)}>
        <div className="loader scale-[0.35] absolute" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="loader" />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader />
    </div>
  );
}
