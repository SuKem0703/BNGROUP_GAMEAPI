import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Feather } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createForumThread } from '@/api/forum';
import { AuthInput } from '@/components/AuthInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/hooks/useToast';
import { normalizeApiError } from '@/utils/normalize';

export function ForumCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ title: '', content: '' });
  const [errors, setErrors] = useState<{ title?: string; content?: string; api?: string }>({});

  const mutation = useMutation({
    mutationFn: createForumThread,
    onSuccess: async (result) => {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
      navigate(result.id ? `/forum/${result.id}` : '/forum');
    },
    onError: (error) => {
      setErrors((current) => ({ ...current, api: normalizeApiError(error).message }));
    },
  });

  function validate() {
    const nextErrors: typeof errors = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!form.content.trim()) {
      nextErrors.content = 'Content is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forum"
        title="Create a New Thread"
        description="This page follows the original forum create flow, translated into a larger modern editor card with protected access."
        actions={
          <Link className="btn-secondary" to="/forum">
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>
        }
      />

      <section className="panel-soft mx-auto w-full max-w-4xl p-6 sm:p-8">
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
            label="Thread Title"
            placeholder="Example: Looking for a party to clear the crystal keep"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            error={errors.title}
          />
          <AuthInput
            as="textarea"
            label="Content"
            placeholder="Share the details of your quest, request, announcement, or discussion topic..."
            rows={12}
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            error={errors.content}
          />

          {errors.api ? (
            <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errors.api}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              Required fields only. On success, we redirect to the new thread when possible.
            </p>
            <button className="btn-primary min-w-40" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? (
                <LoadingSpinner label="Publishing..." />
              ) : (
                <>
                  <Feather className="h-4 w-4" />
                  Publish Thread
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
