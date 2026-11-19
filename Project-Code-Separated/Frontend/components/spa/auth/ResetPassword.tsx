'use client'

// ============================================================
// ResetPassword — #/reset-password?token=…
// Posts { token, password } to /api/auth/reset-password, then
// routes the user back to sign-in.
// ============================================================

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AuthShell } from './AuthShell'
import { PasswordInput } from './PasswordInput'
import { post, ApiError } from '@/lib/api-client'
import { useRouterStore } from '@/lib/router'
import { Spinner } from '@/components/spa/shared/Spinner'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type Values = z.infer<typeof schema>

export function ResetPassword() {
  const query = useRouterStore((s) => s.query)
  const navigate = useRouterStore((s) => s.navigate)
  const token = query.get('token') ?? ''
  const [submitting, setSubmitting] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: Values) => {
    setSubmitting(true)
    try {
      await post('/api/auth/reset-password', { token, password: values.password })
      setDone(true)
      toast.success('Password updated — you can sign in now.')
      setTimeout(() => navigate('#/login'), 1200)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to reset the password right now. Please try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This page needs a valid reset token. Request a new one from the forgot-password page."
      >
        <Button asChild className="min-h-10 w-full">
          <a href="#/forgot-password">Go to forgot password</a>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password — at least 8 characters."
      footer={
        done ? (
          <span className="inline-flex items-center gap-1.5 text-primary">
            <Spinner className="size-3.5" /> Redirecting to sign in…
          </span>
        ) : null
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="rp-password">New password</Label>
          <PasswordInput
            id="rp-password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rp-confirm">Confirm new password</Label>
          <PasswordInput
            id="rp-confirm"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={submitting || done}
          className="min-h-11 w-full bg-gradient-to-r from-[oklch(0.52_0.23_293)] to-[oklch(0.55_0.15_260)] text-white hover:opacity-90"
        >
          {submitting || done ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-4" aria-hidden="true" />
          )}
          {submitting || done ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
