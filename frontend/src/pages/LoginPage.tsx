import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { login } from '@/api/auth';
import { AuthCard } from '@/components/AuthCard';
import { AuthInput } from '@/components/AuthInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RoleBadge } from '@/components/RoleBadge';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/auth-store';
import { normalizeApiError } from '@/utils/normalize';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToast();
  const [form, setForm] = useState({ identity: '', password: '' });
  const [errors, setErrors] = useState<{ identity?: string; password?: string; api?: string }>({});

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      toast.success('Account created successfully. Please sign in.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      if (!response.token) {
        setErrors({ api: 'Login succeeded but no token was returned by the server.' });
        return;
      }

      setAuth({ token: response.token, user: response.user });
      toast.success(
        `Welcome back, ${response.user?.username ?? 'adventurer'}${response.user?.role ? ` (${response.user.role})` : ''}.`,
      );

      const destination =
        typeof location.state === 'object' &&
        location.state &&
        'from' in location.state &&
        typeof location.state.from === 'object' &&
        location.state.from &&
        'pathname' in location.state.from
          ? String(location.state.from.pathname)
          : '/dashboard';

      navigate(destination, { replace: true });
    },
    onError: (error) => {
      setErrors((current) => ({ ...current, api: normalizeApiError(error).message }));
    },
  });

  function validate() {
    const nextErrors: typeof errors = {};

    if (!form.identity.trim()) {
      nextErrors.identity = 'Username or email is required.';
    }

    if (!form.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <AuthCard
      badge="Account Access"
      title="Sign In to the Chronicle"
      subtitle="Use your username or email to enter the portal and continue your journey."
      footer={
        <span>
          No account yet?{' '}
          <Link className="font-semibold text-accent-200 hover:text-accent-50" to="/register">
            Create one here
          </Link>
        </span>
      }
    >
      <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
        <span>New login responses now include access tier data.</span>
        <RoleBadge role="Player" />
        <RoleBadge role="Contributor" />
        <RoleBadge role="Admin" />
      </div>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setErrors({});

          if (!validate()) {
            return;
          }

          mutation.mutate(form);
        }}
      >
        <AuthInput
          autoComplete="username"
          label="Username or Email"
          onChange={(event) => setForm((current) => ({ ...current, identity: event.target.value }))}
          placeholder="guildmaster or you@example.com"
          value={form.identity}
          error={errors.identity}
        />
        <AuthInput
          autoComplete="current-password"
          label="Password"
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="Enter your password"
          type="password"
          value={form.password}
          error={errors.password}
        />

        {errors.api ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errors.api}
          </p>
        ) : null}

        <button className="btn-primary w-full" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? (
            <LoadingSpinner label="Signing in..." />
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Login
            </>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
