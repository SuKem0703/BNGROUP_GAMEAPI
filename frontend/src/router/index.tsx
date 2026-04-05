import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminForumPage } from '@/pages/AdminForumPage';
import { AdminGiftCodesPage } from '@/pages/AdminGiftCodesPage';
import { AdminShopItemsPage } from '@/pages/AdminShopItemsPage';
import { AdminShopLogsPage } from '@/pages/AdminShopLogsPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ShopPage } from '@/pages/ShopPage';
import { ForumCreatePage } from '@/pages/ForumCreatePage';
import { ForumDetailPage } from '@/pages/ForumDetailPage';
import { ForumListPage } from '@/pages/ForumListPage';
import { GiftCodePage } from '@/pages/GiftCodePage';
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
          { path: '/shop', element: <ShopPage /> },
          { path: '/giftcodes', element: <GiftCodePage /> },
          { path: '/leaderboard', element: <LeaderboardPage /> },
          { path: '/forum/create', element: <ForumCreatePage /> },
        ],
      },
    ],
  },
  {
    element: <AdminRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppShell />,
        errorElement: <RouteErrorPage />,
        children: [
          { path: '/admin', element: <Navigate replace to="/admin/users" /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/forum', element: <AdminForumPage /> },
          { path: '/admin/giftcodes', element: <AdminGiftCodesPage /> },
          { path: '/admin/shop-items', element: <AdminShopItemsPage /> },
          { path: '/admin/shoplogs', element: <AdminShopLogsPage /> },
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
