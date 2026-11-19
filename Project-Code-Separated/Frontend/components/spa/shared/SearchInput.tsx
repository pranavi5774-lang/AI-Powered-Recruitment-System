'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  ariaLabel = 'Search',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  return (
    <div className={cn('relative w-full max-w-xs', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-9 pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}
