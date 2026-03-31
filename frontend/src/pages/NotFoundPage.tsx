import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="panel-soft max-w-xl space-y-4 px-8 py-10 text-center">
        <p className="heading-decor text-xs">404</p>
        <h1 className="font-heading text-4xl text-white">This path has faded into the mist</h1>
        <p className="text-base text-slate-300">
          The page you requested does not exist in the current portal build.
        </p>
        <div className="flex justify-center gap-3">
          <Link className="btn-primary" to="/dashboard">
            Dashboard
          </Link>
          <Link className="btn-secondary" to="/forum">
            Forum
          </Link>
        </div>
      </div>
    </div>
  );
}
