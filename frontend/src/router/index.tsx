import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ForumCreatePage } from '@/pages/ForumCreatePage';
import { ForumDetailPage } from '@/pages/ForumDetailPage';
import { ForumListPage } from '@/pages/ForumListPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { useAuthStore } from '@/store/auth-store';

function RootRedirect() {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return null;
  }

  return <Navigate replace to={token ? '/dashboard' : '/login'} />;
}

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <PublicOnlyRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AuthLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/forum', element: <ForumListPage /> },
      { path: '/forum/:id', element: <ForumDetailPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppShell />,
        errorElement: <RouteErrorPage />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/leaderboard', element: <LeaderboardPage /> },
          { path: '/forum/create', element: <ForumCreatePage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <RouteErrorPage />,
  },
]);
