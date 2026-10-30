<script setup lang="ts">
import { computed, reactive, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Check,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Info,
  KeyRound,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  UserRound,
  XCircle,
} from '@lucide/vue'

import { isApiError, systemApi } from '@/api'
import BaseModal from '@/components/ui/BaseModal.vue'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher.vue'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/tasks'
import { passwordInputSchema, profileInputSchema } from '@/types/auth'
import { formatDateTime, toDateInputValue } from '@/utils/date'

type ConfirmAction = 'reset' | 'clear' | null
type ApiCheckState = 'idle' | 'loading' | 'success' | 'error'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const taskStore = useTaskStore()
const { toast } = useToast()
const { mode, setMode } = useTheme()

const profileForm = reactive({ name: auth.user?.name ?? '' })
const profileErrors = reactive<Record<string, string>>({})
const profileSaving = ref(false)
const profileError = ref('')

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordErrors = reactive<Record<string, string>>({})
const passwordSaving = ref(false)
const passwordError = ref('')

const fileInput = ref<HTMLInputElement | null>(null)
const confirmAction = ref<ConfirmAction>(null)

const apiState = ref<ApiCheckState>('idle')
const apiLatency = ref<number | null>(null)
const apiErrorCode = ref<string | null>(null)
const apiRequestId = ref<string | null>(null)

const themeOptions = computed<
  { value: ThemeMode; label: string; description: string; icon: Component }[]
>(() => [
  {
    value: 'light',
    label: t('settings.theme.light'),
    description: t('settings.theme.lightDescription'),
    icon: Sun,
  },
  {
    value: 'dark',
    label: t('settings.theme.dark'),
    description: t('settings.theme.darkDescription'),
    icon: Moon,
  },
  {
    value: 'system',
    label: t('settings.theme.system'),
    description: t('settings.theme.systemDescription'),
    icon: Monitor,
  },
])

const avatarInitial = computed(
  () => (auth.user?.name ?? profileForm.name).trim().charAt(0).toUpperCase() || 'O',
)
const appVersion = __APP_VERSION__
const buildTime = computed(() => formatDateTime(__BUILD_TIME__))
const taskCount = computed(() => taskStore.stats.total)

watch(
  () => auth.user?.name,
  (name) => {
    if (name) profileForm.name = name
  },
  { immediate: true },
)

const confirmContent = computed(() => {
  if (confirmAction.value === 'clear') {
    return {
      title: t('settings.confirm.clearTitle'),
      description: t('settings.confirm.clearDescription'),
      label: t('settings.confirm.clearLabel'),
    }
  }

  return {
    title: t('settings.confirm.resetTitle'),
    description: t('settings.confirm.resetDescription'),
    label: t('settings.confirm.resetLabel'),
  }
})

const apiStateLabel = computed(() => {
  if (apiState.value === 'loading') return t('settings.api.testing')
  if (apiState.value === 'success') return t('settings.api.success')
  if (apiState.value === 'error') return t('settings.api.failure')
  return t('settings.api.idle')
})

const apiStateStyle = computed(() => {
  if (apiState.value === 'loading') return 'bg-sky-500/10 text-sky-700 ring-sky-500/20'
  if (apiState.value === 'success') return 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
  if (apiState.value === 'error') return 'bg-rose-500/10 text-rose-700 ring-rose-500/20'
  return 'bg-muted text-muted-foreground ring-border'
})

const apiErrorMessage = computed(() => t(`apiError.${apiErrorCode.value ?? 'unknown'}`))

function clearProfileError(field: string): void {
  delete profileErrors[field]
  profileError.value = ''
}

function clearPasswordError(field: string): void {
  delete passwordErrors[field]
  passwordError.value = ''
}

function resolveAccountError(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    if (error.code === 'network' || error.code === 'timeout') return t('auth.error.network')
    if (error.status === 401) return t('auth.error.sessionExpired')
    if (error.status === 400) return fallback
  }

  return t('auth.error.generic')
}

async function saveProfile(): Promise<void> {
  const result = profileInputSchema.safeParse(profileForm)

  for (const key of Object.keys(profileErrors)) delete profileErrors[key]
  profileError.value = ''

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !profileErrors[field]) {
        profileErrors[field] = t(issue.message)
      }
    }
    return
  }

  profileSaving.value = true
  try {
    await auth.updateProfile(result.data)
    profileForm.name = result.data.name
    toast({ title: t('settings.account.profileSaved'), variant: 'success' })
  } catch (error) {
    profileError.value = resolveAccountError(error, t('settings.account.profileError'))
  } finally {
    profileSaving.value = false
  }
}

async function savePassword(): Promise<void> {
  for (const key of Object.keys(passwordErrors)) delete passwordErrors[key]
  passwordError.value = ''

  const result = passwordInputSchema.safeParse({
    currentPassword: passwordForm.currentPassword,
    newPassword: passwordForm.newPassword,
  })

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !passwordErrors[field]) {
        passwordErrors[field] = t(issue.message)
      }
    }
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = t('auth.validation.passwordMismatch')
    return
  }

  passwordSaving.value = true
  try {
    await auth.changePassword(result.data)
    toast({ title: t('settings.account.passwordSaved'), variant: 'success' })
    await router.replace({ name: 'login' })
  } catch (error) {
    passwordError.value = resolveAccountError(error, t('settings.account.currentPasswordInvalid'))
  } finally {
    passwordSaving.value = false
  }
}

async function handleLogout(): Promise<void> {
  await auth.logout()
  await router.replace({ name: 'login' })
}

function exportTasks(): void {
  const blob = new Blob([taskStore.exportTasks()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `orbit-tasks-${toDateInputValue(new Date())}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)

  toast({
    title: t('settings.data.exported'),
    description: t('settings.data.exportedDescription'),
    variant: 'success',
  })
}

function openFilePicker(): void {
  fileInput.value?.click()
}

async function importTasks(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  try {
    const payload: unknown = JSON.parse(await file.text())
    const count = taskStore.importTasks(payload)
    toast({
      title: t('settings.data.importSuccess'),
      description: t('settings.data.importSuccessDescription', { count }),
      variant: 'success',
    })
  } catch {
    toast({
      title: t('settings.data.importError'),
      description: t('settings.data.importErrorDescription'),
      variant: 'error',
    })
  } finally {
    input.value = ''
  }
}

function runConfirmedAction(): void {
  if (confirmAction.value === 'clear') {
    taskStore.clearTasks()
    toast({ title: t('settings.data.cleared'), variant: 'success' })
  } else if (confirmAction.value === 'reset') {
    taskStore.resetDemoData()
    toast({ title: t('settings.data.resetDone'), variant: 'success' })
  }

  confirmAction.value = null
}

async function checkBackendConnection(): Promise<void> {
  apiState.value = 'loading'
  apiLatency.value = null
  apiErrorCode.value = null
  apiRequestId.value = null

  const startedAt = performance.now()

  try {
    await systemApi.health()
    apiLatency.value = Math.round(performance.now() - startedAt)
    apiState.value = 'success'

    toast({
      title: t('settings.api.success'),
      description: t('settings.api.successDescription', { latency: apiLatency.value }),
      variant: 'success',
    })
  } catch (error) {
    apiState.value = 'error'
    apiErrorCode.value = isApiError(error) ? error.code : 'unknown'
    apiRequestId.value = isApiError(error) ? (error.requestId ?? null) : null

    toast({
      title: t('settings.api.failure'),
      description: t(`apiError.${apiErrorCode.value}`),
      variant: 'error',
    })
  }
}
</script>

<template>
  <div class="space-y-6 sm:space-y-8">
    <section class="animate-rise">
      <p class="eyebrow">
        <Palette class="size-3.5" aria-hidden="true" />
        {{ t('settings.eyebrow') }}
      </p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {{ t('settings.title') }}
      </h1>
      <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {{ t('settings.subtitle') }}
      </p>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
      <div class="space-y-6">
        <section class="card animate-rise" style="animation-delay: 70ms">
          <div class="flex items-center gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
            <span class="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <UserRound class="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 class="text-sm font-semibold">{{ t('settings.account.title') }}</h2>
              <p class="text-[11px] text-muted-foreground">
                {{ t('settings.account.description') }}
              </p>
            </div>
          </div>

          <div class="space-y-5 p-5 sm:p-6">
            <div class="flex items-center gap-4">
              <span
                class="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-xl font-semibold text-accent-foreground"
              >
                {{ avatarInitial }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">
                  {{ auth.user?.name || t('settings.account.unnamed') }}
                </p>
                <p class="truncate text-xs text-muted-foreground">
                  {{ auth.user?.email }}
                </p>
              </div>
              <span class="badge ml-auto bg-emerald-500/10 text-emerald-700 ring-emerald-500/20">
                <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ t('settings.account.signedIn') }}
              </span>
            </div>

            <form class="space-y-4" novalidate @submit.prevent="saveProfile">
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="account-name" class="field-label">
                    {{ t('settings.account.name') }}
                  </label>
                  <input
                    id="account-name"
                    v-model="profileForm.name"
                    type="text"
                    class="input"
                    autocomplete="name"
                    :aria-invalid="Boolean(profileErrors.name)"
                    @input="clearProfileError('name')"
                  />
                  <p v-if="profileErrors.name" class="field-error" role="alert">
                    {{ profileErrors.name }}
                  </p>
                </div>

                <div>
                  <label for="account-email" class="field-label">
                    {{ t('settings.account.email') }}
                  </label>
                  <input
                    id="account-email"
                    :value="auth.user?.email"
                    type="email"
                    class="input opacity-70"
                    autocomplete="email"
                    readonly
                  />
                  <p class="field-hint">{{ t('settings.account.emailHint') }}</p>
                </div>
              </div>

              <p v-if="profileError" class="field-error" role="alert">{{ profileError }}</p>

              <div class="flex justify-end">
                <button type="submit" class="btn btn-primary btn-sm" :disabled="profileSaving">
                  <Loader2 v-if="profileSaving" class="animate-spin" aria-hidden="true" />
                  {{ profileSaving ? t('settings.account.saving') : t('settings.account.save') }}
                </button>
              </div>
            </form>

            <div class="divider" />

            <div>
              <div class="flex items-center gap-2">
                <KeyRound class="size-4 text-muted-foreground" aria-hidden="true" />
                <h3 class="text-sm font-semibold">{{ t('settings.account.passwordTitle') }}</h3>
              </div>
              <p class="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {{ t('settings.account.passwordDescription') }}
              </p>

              <form class="mt-4 space-y-4" novalidate @submit.prevent="savePassword">
                <div>
                  <label for="account-current-password" class="field-label">
                    {{ t('settings.account.currentPassword') }}
                  </label>
                  <input
                    id="account-current-password"
                    v-model="passwordForm.currentPassword"
                    type="password"
                    class="input"
                    autocomplete="current-password"
                    :aria-invalid="Boolean(passwordErrors.currentPassword)"
                    @input="clearPasswordError('currentPassword')"
                  />
                  <p v-if="passwordErrors.currentPassword" class="field-error" role="alert">
                    {{ passwordErrors.currentPassword }}
                  </p>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="account-new-password" class="field-label">
                      {{ t('settings.account.newPassword') }}
                    </label>
                    <input
                      id="account-new-password"
                      v-model="passwordForm.newPassword"
                      type="password"
                      class="input"
                      autocomplete="new-password"
                      :aria-invalid="Boolean(passwordErrors.newPassword)"
                      @input="clearPasswordError('newPassword')"
                    />
                    <p v-if="passwordErrors.newPassword" class="field-error" role="alert">
                      {{ passwordErrors.newPassword }}
                    </p>
                  </div>

                  <div>
                    <label for="account-confirm-password" class="field-label">
                      {{ t('settings.account.confirmPassword') }}
                    </label>
                    <input
                      id="account-confirm-password"
                      v-model="passwordForm.confirmPassword"
                      type="password"
                      class="input"
                      autocomplete="new-password"
                      :aria-invalid="Boolean(passwordErrors.confirmPassword)"
                      @input="clearPasswordError('confirmPassword')"
                    />
                    <p v-if="passwordErrors.confirmPassword" class="field-error" role="alert">
                      {{ passwordErrors.confirmPassword }}
                    </p>
                  </div>
                </div>

                <p v-if="passwordError" class="field-error" role="alert">{{ passwordError }}</p>

                <div class="flex justify-end">
                  <button type="submit" class="btn btn-secondary btn-sm" :disabled="passwordSaving">
                    <Loader2 v-if="passwordSaving" class="animate-spin" aria-hidden="true" />
                    {{
                      passwordSaving
                        ? t('settings.account.updatingPassword')
                        : t('settings.account.updatePassword')
                    }}
                  </button>
                </div>
              </form>
            </div>

            <div class="divider" />

            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold">{{ t('settings.account.logoutTitle') }}</p>
                <p class="mt-1 text-[11px] text-muted-foreground">
                  {{ t('settings.account.logoutDescription') }}
                </p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" @click="handleLogout">
                <LogOut aria-hidden="true" />
                {{ t('settings.account.logout') }}
              </button>
            </div>
          </div>
        </section>

        <section class="card animate-rise" style="animation-delay: 130ms">
          <div class="flex items-center gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
            <span
              class="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"
            >
              <Database class="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 class="text-sm font-semibold">{{ t('settings.data.title') }}</h2>
              <p class="text-[11px] text-muted-foreground">
                {{ t('settings.data.description', { count: taskCount }) }}
              </p>
            </div>
          </div>

          <div class="space-y-4 p-5 sm:p-6">
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-secondary btn-sm" @click="exportTasks">
                <Download aria-hidden="true" />
                {{ t('settings.data.export') }}
              </button>
              <button type="button" class="btn btn-secondary btn-sm" @click="openFilePicker">
                <Upload aria-hidden="true" />
                {{ t('settings.data.import') }}
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="application/json,.json"
                class="hidden"
                @change="importTasks"
              />
            </div>

            <div class="rounded-xl border border-border/70 bg-muted/30 p-3">
              <p class="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <ShieldCheck
                  class="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                {{ t('settings.data.privacy') }}
              </p>
            </div>

            <div class="divider" />

            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-ghost btn-sm" @click="confirmAction = 'reset'">
                <RotateCcw aria-hidden="true" />
                {{ t('settings.data.reset') }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400"
                @click="confirmAction = 'clear'"
              >
                <Trash2 aria-hidden="true" />
                {{ t('settings.data.clear') }}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="card animate-rise" style="animation-delay: 100ms">
          <div class="flex items-center gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
            <span
              class="grid size-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400"
            >
              <Palette class="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 class="text-sm font-semibold">{{ t('settings.appearance.title') }}</h2>
              <p class="text-[11px] text-muted-foreground">
                {{ t('settings.appearance.description') }}
              </p>
            </div>
          </div>

          <fieldset class="p-5 sm:p-6">
            <legend class="sr-only">{{ t('settings.theme.label') }}</legend>
            <div class="grid gap-2 sm:grid-cols-3">
              <label
                v-for="option in themeOptions"
                :key="option.value"
                class="relative cursor-pointer rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring"
                :class="
                  mode === option.value
                    ? 'border-primary bg-accent/50 ring-1 ring-primary'
                    : 'border-border bg-background/40 hover:bg-muted/50'
                "
              >
                <input
                  type="radio"
                  name="theme-mode"
                  :value="option.value"
                  :checked="mode === option.value"
                  class="sr-only"
                  @change="setMode(option.value)"
                />
                <component
                  :is="option.icon"
                  class="size-4"
                  :class="mode === option.value ? 'text-primary' : 'text-muted-foreground'"
                  aria-hidden="true"
                />
                <span class="mt-2 block text-xs font-semibold">{{ option.label }}</span>
                <span class="mt-0.5 block text-[10px] text-muted-foreground">
                  {{ option.description }}
                </span>
                <span
                  v-if="mode === option.value"
                  class="absolute top-2.5 right-2.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check class="size-2.5" stroke-width="3" aria-hidden="true" />
                </span>
              </label>
            </div>
          </fieldset>

          <div class="border-t border-border/70 p-5 sm:p-6">
            <h3 class="text-sm font-semibold">{{ t('settings.appearance.languageTitle') }}</h3>
            <p class="mt-1 mb-3 text-[11px] text-muted-foreground">
              {{ t('settings.appearance.languageDescription') }}
            </p>
            <LocaleSwitcher variant="card" />
          </div>
        </section>

        <section class="card animate-rise" style="animation-delay: 150ms">
          <div class="flex items-center gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
            <span
              class="grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
            >
              <Server class="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 class="text-sm font-semibold">{{ t('settings.api.title') }}</h2>
              <p class="text-[11px] text-muted-foreground">
                {{ t('settings.api.description') }}
              </p>
            </div>
          </div>

          <div class="space-y-4 p-5 sm:p-6">
            <dl class="space-y-2 text-xs">
              <div class="rounded-xl border border-border/70 bg-muted/25 p-3">
                <dt class="text-[10px] text-muted-foreground">{{ t('settings.api.baseURL') }}</dt>
                <dd class="mt-1 font-mono break-all">{{ env.VITE_API_BASE_URL }}</dd>
              </div>
            </dl>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                :disabled="apiState === 'loading'"
                @click="checkBackendConnection"
              >
                <Loader2 v-if="apiState === 'loading'" class="animate-spin" aria-hidden="true" />
                <RefreshCw v-else aria-hidden="true" />
                {{ apiState === 'loading' ? t('settings.api.testing') : t('settings.api.test') }}
              </button>

              <span class="badge" :class="apiStateStyle" aria-live="polite">
                <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ apiStateLabel }}
              </span>
            </div>

            <p
              v-if="apiState === 'success' && apiLatency !== null"
              class="flex items-start gap-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {{ t('settings.api.successDescription', { latency: apiLatency }) }}
            </p>
            <p
              v-else-if="apiState === 'error'"
              class="flex items-start gap-2 text-[11px] leading-relaxed text-rose-700 dark:text-rose-400"
            >
              <XCircle class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {{ apiErrorMessage }}
            </p>

            <p v-if="apiRequestId" class="font-mono text-[10px] break-all text-muted-foreground">
              {{ t('settings.api.requestId', { id: apiRequestId }) }}
            </p>

            <p class="text-[10px] leading-relaxed text-muted-foreground">
              {{ t('settings.api.hint') }}
            </p>
          </div>
        </section>

        <section class="card animate-rise" style="animation-delay: 200ms">
          <div class="flex items-center gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
            <span
              class="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <Info class="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 class="text-sm font-semibold">{{ t('settings.about.title') }}</h2>
              <p class="text-[11px] text-muted-foreground">
                {{ t('settings.about.description') }}
              </p>
            </div>
          </div>

          <div class="space-y-4 p-5 sm:p-6">
            <dl class="grid grid-cols-2 gap-3 text-xs">
              <div class="rounded-xl border border-border/70 bg-muted/25 p-3">
                <dt class="text-[10px] text-muted-foreground">
                  {{ t('settings.about.version') }}
                </dt>
                <dd class="mt-1 font-mono font-medium">v{{ appVersion }}</dd>
              </div>
              <div class="rounded-xl border border-border/70 bg-muted/25 p-3">
                <dt class="text-[10px] text-muted-foreground">{{ t('settings.about.env') }}</dt>
                <dd class="mt-1 font-mono font-medium">{{ env.VITE_APP_ENV }}</dd>
              </div>
              <div class="col-span-2 rounded-xl border border-border/70 bg-muted/25 p-3">
                <dt class="text-[10px] text-muted-foreground">
                  {{ t('settings.about.buildTime') }}
                </dt>
                <dd class="mt-1 font-mono font-medium">{{ buildTime }}</dd>
              </div>
            </dl>

            <div>
              <p class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {{ t('settings.about.stack') }}
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span class="chip">Vue 3</span>
                <span class="chip">Vite 8</span>
                <span class="chip">TypeScript 7</span>
                <span class="chip">Pinia</span>
                <span class="chip">Vue Router</span>
                <span class="chip">Tailwind CSS 4</span>
                <span class="chip">Axios</span>
                <span class="chip">vue-i18n</span>
                <span class="chip">Zod</span>
              </div>
            </div>

            <div class="divider" />

            <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <a
                href="https://vuejs.org/guide/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Vue {{ t('common.docs') }}
                <ExternalLink class="size-3" aria-hidden="true" />
              </a>
              <a
                href="https://vite.dev/guide/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Vite {{ t('common.docs') }}
                <ExternalLink class="size-3" aria-hidden="true" />
              </a>
              <a
                href="https://tailwindcss.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Tailwind {{ t('common.docs') }}
                <ExternalLink class="size-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>

    <BaseModal
      :open="confirmAction !== null"
      :title="confirmContent.title"
      :description="confirmContent.description"
      size="sm"
      @close="confirmAction = null"
    >
      <div class="rounded-xl border border-border/70 bg-muted/50 p-3 text-xs text-muted-foreground">
        {{ t('settings.data.backupHint') }}
      </div>

      <template #footer>
        <button type="button" class="btn btn-ghost btn-sm" @click="confirmAction = null">
          {{ t('common.cancel') }}
        </button>
        <button type="button" class="btn btn-danger btn-sm" @click="runConfirmedAction">
          {{ confirmContent.label }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>
