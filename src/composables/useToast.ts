import { readonly, ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export interface ToastMessage extends ToastInput {
  id: number
  variant: ToastVariant
}

const toasts = ref<ToastMessage[]>([])
let nextId = 0

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function toast(input: string | ToastInput): number {
  const options: ToastInput = typeof input === 'string' ? { title: input } : input
  const id = ++nextId
  const variant = options.variant ?? 'info'
  const duration = options.duration ?? (variant === 'error' ? 6000 : 4000)

  toasts.value.push({
    ...options,
    id,
    variant,
  })

  if (duration > 0) {
    window.setTimeout(() => dismiss(id), duration)
  }

  return id
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    toast,
    dismiss,
  }
}
