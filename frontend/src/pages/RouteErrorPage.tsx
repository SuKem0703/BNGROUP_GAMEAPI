import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

function getMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || error.data?.message || `Route error ${error.status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected client-side error occurred while rendering this page.';
}

export function RouteErrorPage() {
  const error = useRouteError();

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="panel-soft max-w-2xl space-y-4 px-8 py-10 text-center">
        <p className="heading-decor text-xs">Application Error</p>
        <h1 className="font-heading text-4xl text-white">The portal hit a rendering issue</h1>
        <p className="text-base text-slate-300">{getMessage(error)}</p>
        <div className="flex justify-center gap-3">
          <Link className="btn-primary" to="/login">
            Login
          </Link>
          <Link className="btn-secondary" to="/forum">
            Forum
          </Link>
        </div>
      </div>
    </div>
  );
}
