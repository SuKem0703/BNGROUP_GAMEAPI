import { Outlet } from 'react-router-dom';
import { Topbar } from '@/components/Topbar';

export function AppShell() {
  return (
    <div className="app-shell">
      <Topbar />
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
