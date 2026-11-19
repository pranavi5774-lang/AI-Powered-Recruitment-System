'use client'

// ============================================================
// Register — #/register (auto role: CANDIDATE)
// ============================================================

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from './AuthShell'
import { PasswordInput } from './PasswordInput'
import { useAuthStore, ROLE_HOME } from '@/lib/store'
import { useRouterStore } from '@/lib/router'
import { ApiError } from '@/lib/api-client'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Please enter your full name'),
    email: z.email('Enter a valid email address'),
    phone: z
      .string()
      .regex(/^[+\d][\d\s-]{6,14}$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type RegisterValues = z.infer<typeof registerSchema>

export function Register() {
  const registerUser = useAuthStore((s) => s.register)
  const navigate = useRouterStore((s) => s.navigate)
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: RegisterValues) => {
    setSubmitting(true)
    try {
      const user = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
      })
      toast.success('Account created — welcome to HireSphere AI!')
      navigate(ROLE_HOME[user.role] ?? '#/portal/dashboard')
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.code === 'EMAIL_EXISTS'
            ? 'An account with this email already exists. Try logging in instead.'
            : err.message
          : 'Unable to create your account right now. Please try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    id: keyof RegisterValues,
    label: string,
    placeholder: string,
    input: React.ReactElement,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {input}
      {errors[id] ? (
        <p className="text-xs text-destructive" role="alert">
          {errors[id]?.message}
        </p>
      ) : null}
    </div>
  )

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join as a candidate — browse jobs, upload your resume and apply."
      footer={
        <>
          Already have an account?{' '}
          <a href="#/login" className="font-medium text-primary hover:underline">
            Sign in
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {field(
          'name',
          'Full name',
          'Priya Nair',
          <Input id="reg-name" autoComplete="name" placeholder="Priya Nair" aria-invalid={!!errors.name} {...register('name')} />,
        )}
        {field(
          'email',
          'Email',
          'you@example.com',
          <Input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register('email')} />,
        )}
        {field(
          'phone',
          'Phone (optional)',
          '+91 98765 43210',
          <Input id="reg-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" aria-invalid={!!errors.phone} {...register('phone')} />,
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            'password',
            'Password',
            '••••••••',
            <PasswordInput id="reg-password" autoComplete="new-password" placeholder="••••••••" aria-invalid={!!errors.password} {...register('password')} />,
          )}
          {field(
            'confirmPassword',
            'Confirm password',
            '••••••••',
            <PasswordInput id="reg-confirm" autoComplete="new-password" placeholder="••••••••" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />,
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="min-h-11 w-full bg-gradient-to-r from-[oklch(0.52_0.23_293)] to-[oklch(0.55_0.15_260)] text-white hover:opacity-90"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <UserPlus className="size-4" aria-hidden="true" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You will join with the <span className="font-medium text-foreground">Candidate</span> role. HR and
          Admin accounts are provisioned by an administrator.
        </p>
      </form>
    </AuthShell>
  )
}
