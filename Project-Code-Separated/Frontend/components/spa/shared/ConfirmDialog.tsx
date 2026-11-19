'use client'

// ============================================================
// ConfirmDialog — promise-based confirm() helper.
// ------------------------------------------------------------
// Usage from any view:
//   import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
//   const ok = await confirmDialog({ title: 'Delete job?', description: '…', destructive: true })
//
// <ConfirmDialogHost /> must be mounted ONCE at the app root
// (page.tsx does this).
// ============================================================

import { create } from 'zustand'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export type ConfirmOptions = {
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

type ConfirmStore = {
  open: boolean
  options: ConfirmOptions | null
  resolver: ((v: boolean) => void) | null
  show: (options: ConfirmOptions, resolver: (v: boolean) => void) => void
  settle: (v: boolean) => void
}

const useConfirmStore = create<ConfirmStore>((set, get) => ({
  open: false,
  options: null,
  resolver: null,
  show: (options, resolver) => set({ open: true, options, resolver }),
  settle: (v) => {
    get().resolver?.(v)
    set({ open: false, options: null, resolver: null })
  },
}))

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    useConfirmStore.getState().show(options, resolve)
  })
}

export function ConfirmDialogHost() {
  const { open, options, settle } = useConfirmStore()
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description ? (
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)} className="min-h-9">
            {options?.cancelText ?? 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => settle(true)}
            className={cn('min-h-9', options?.destructive && 'bg-destructive text-white hover:bg-destructive/90')}
          >
            {options?.confirmText ?? 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
