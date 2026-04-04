import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { register } from '@/api/auth';
import { AuthCard } from '@/components/AuthCard';
import { AuthInput } from '@/components/AuthInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { RegisterPayload } from '@/types/auth';
import { normalizeApiError } from '@/utils/normalize';

const initialForm: RegisterPayload = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterPayload | 'api' | 'success', string>>
  >({});

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      setErrors({ success: 'Registration complete. You can now sign in.' });
      navigate('/login?registered=1', { replace: true });
    },
    onError: (error) => {
      setErrors((current) => ({ ...current, api: normalizeApiError(error).message }));
    },
  });

  function validate() {
    const nextErrors: typeof errors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.username.trim()) {
      nextErrors.username = 'Username is required.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <AuthCard
      badge="New Character"
      title="Create Your Adventurer"
      subtitle="Register a new guild account to unlock the dashboard and enter the tavern forum."
      footer={
        <span>
          Already registered?{' '}
          <Link className="font-semibold text-accent-200 hover:text-accent-50" to="/login">
            Return to login
          </Link>
        </span>
      }
    >
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
        Newly created accounts start with the default <span className="font-semibold text-white">Player</span> access tier unless changed by an administrator later.
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
          label="Username"
          placeholder="Choose a guild name"
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          error={errors.username}
        />
        <AuthInput
          autoComplete="email"
          label="Email"
          placeholder="you@example.com"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          error={errors.email}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <AuthInput
            autoComplete="new-password"
            label="Password"
            placeholder="At least 6 characters"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            error={errors.password}
          />
          <AuthInput
            autoComplete="new-password"
            label="Confirm Password"
            placeholder="Repeat password"
            type="password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            error={errors.confirmPassword}
          />
        </div>

        {errors.api ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errors.api}
          </p>
        ) : null}
        {errors.success ? (
          <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {errors.success}
          </p>
        ) : null}

        <button className="btn-primary w-full" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? (
            <LoadingSpinner label="Creating account..." />
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Register
            </>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
