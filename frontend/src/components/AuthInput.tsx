import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';

type InputProps =
  | ({
      as?: 'input';
    } & InputHTMLAttributes<HTMLInputElement>)
  | ({
      as: 'textarea';
    } & TextareaHTMLAttributes<HTMLTextAreaElement>);

type AuthInputProps = InputProps & {
  label: string;
  error?: string;
};

export function AuthInput({
  label,
  error,
  className,
  as = 'input',
  ...props
}: AuthInputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
        {label}
      </span>
      {as === 'textarea' ? (
        <textarea
          className={cn('input-shell min-h-40 resize-y', className)}
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={cn('input-shell', className)}
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </label>
  );
}
