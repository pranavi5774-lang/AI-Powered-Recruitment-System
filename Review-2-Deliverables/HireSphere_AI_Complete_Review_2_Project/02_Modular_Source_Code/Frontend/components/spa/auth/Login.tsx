'use client'

// ============================================================
// Login — #/login
// ============================================================

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from './AuthShell'
import { PasswordInput } from './PasswordInput'
import { useAuthStore, ROLE_HOME } from '@/lib/store'
import { useRouterStore } from '@/lib/router'
import { ApiError } from '@/lib/api-client'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export function Login() {
  const login = useAuthStore((s) => s.login)
  const navigate = useRouterStore((s) => s.navigate)
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true)
    try {
      const user = await login(values.email, values.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(ROLE_HOME[user.role] ?? '#/')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to sign in right now. Please try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your HireSphere AI account."
      footer={
        <>
          New here?{' '}
          <a href="#/register" className="font-medium text-primary hover:underline">
            Create an account
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <a href="#/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
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

        <Button type="submit" disabled={submitting} className="min-h-11 w-full bg-gradient-to-r from-[oklch(0.52_0.23_293)] to-[oklch(0.55_0.15_260)] text-white hover:opacity-90">
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {process.env.NODE_ENV !== 'production' ? (
        <div className="mt-6 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Demo accounts (dev seed)</p>
          <p className="mt-1">
            <code className="text-primary">hr@hiresphere.ai</code> / <code className="text-primary">Password@123</code>
          </p>
          <p className="mt-1">
            Also seeded: admin@hiresphere.ai (Admin), priya.nair@ / rohan.mehta@ / sneha.kulkarni@example.com
            (Candidates), aarav.sharma@example.com (Employee) — all with the same password.
          </p>
        </div>
      ) : null}
    </AuthShell>
  )
}
