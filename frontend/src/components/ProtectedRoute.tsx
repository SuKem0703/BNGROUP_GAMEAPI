import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuthStore } from '@/store/auth-store';

interface RouteGuardProps {
  children?: ReactNode;
}

function RouteGate({ pendingLabel }: { pendingLabel: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner label={pendingLabel} />
    </div>
  );
}

export function ProtectedRoute({ children }: RouteGuardProps) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return <RouteGate pendingLabel="Restoring your session..." />;
  }

  if (!token) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function PublicOnlyRoute({ children }: RouteGuardProps) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return <RouteGate pendingLabel="Preparing the portal..." />;
  }

  if (token) {
    return <Navigate replace to="/dashboard" />;
  }

  return children ? <>{children}</> : <Outlet />;
}
