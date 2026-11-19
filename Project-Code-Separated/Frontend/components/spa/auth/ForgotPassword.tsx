'use client'

// ============================================================
// ForgotPassword — #/forgot-password
// Calls POST /api/auth/forgot-password. The API always answers
// 200 (no user enumeration). In dev the response may include
// `devResetToken` — since the sandbox has no email service we
// surface a panel linking straight to the reset view.
// ============================================================

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, MailCheck, TerminalSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from './AuthShell'
import { post, ApiError } from '@/lib/api-client'

const schema = z.object({
  email: z.email('Enter a valid email address'),
})

type Values = z.infer<typeof schema>

type ForgotResponse = { message: string; devResetToken?: string }

export function ForgotPassword() {
  const [submitting, setSubmitting] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [devToken, setDevToken] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: Values) => {
    setSubmitting(true)
    try {
      const data = await post<ForgotResponse>('/api/auth/forgot-password', values)
      setSent(true)
      setDevToken(data?.devResetToken ?? null)
      toast.success('If that email exists, a reset link has been created.')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to submit the request right now.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email linked to your account and we will create a reset token (valid for 1 hour)."
      footer={
        <>
          Remembered it?{' '}
          <a href="#/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </a>
        </>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border bg-card/60 p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Request received. In a production deployment an email with the reset link would be sent —
              this sandbox has no mail service.
            </p>
          </div>

          {devToken ? (
            <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <TerminalSquare className="size-4 text-primary" aria-hidden="true" />
                Developer mode reset token
              </p>
              <p className="break-all font-mono text-xs text-muted-foreground">{devToken}</p>
              <Button asChild className="min-h-10 w-full">
                <a href={`#/reset-password?token=${encodeURIComponent(devToken)}`}>
                  Continue to reset password
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fp-email">Email</Label>
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="min-h-11 w-full bg-gradient-to-r from-[oklch(0.52_0.23_293)] to-[oklch(0.55_0.15_260)] text-white hover:opacity-90"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? 'Submitting…' : 'Send reset request'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
