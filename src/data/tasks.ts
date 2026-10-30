import type { SupportedLocale } from '@/i18n'
import { getCurrentLocale } from '@/i18n'
import type { Task, TaskPriority, TaskStatus } from '@/types/task'
import { toDateKey } from '@/utils/date'

interface SeedCopy {
  title: string
  description: string
  tags: string[]
}

interface SeedTemplate {
  id: string
  status: TaskStatus
  priority: TaskPriority
  dueOffset: number
  createdDays: number
  updatedOffset: { days?: number; hours?: number }
  copy: Record<SupportedLocale, SeedCopy>
}

const seedTemplates: SeedTemplate[] = [
  {
    id: 'seed-1',
    status: 'done',
    priority: 'high',
    dueOffset: -1,
    createdDays: -6,
    updatedOffset: { hours: -2 },
    copy: {
      'zh-CN': {
        title: '完成 Q4 产品需求评审',
        description: '整理评审结论，并把行动项同步到任务看板。',
        tags: ['产品', '会议'],
      },
      'en-US': {
        title: 'Complete Q4 product requirements review',
        description: 'Consolidate review notes and sync action items to the task board.',
        tags: ['Product', 'Meeting'],
      },
    },
  },
  {
    id: 'seed-2',
    status: 'in-progress',
    priority: 'high',
    dueOffset: 2,
    createdDays: -4,
    updatedOffset: { hours: -4 },
    copy: {
      'zh-CN': {
        title: '搭建设计系统 Token',
        description: '统一颜色、圆角与阴影变量，补齐深色模式。',
        tags: ['设计', '前端'],
      },
      'en-US': {
        title: 'Build design system tokens',
        description: 'Unify color, radius, and shadow variables; finish dark mode.',
        tags: ['Design', 'Frontend'],
      },
    },
  },
  {
    id: 'seed-3',
    status: 'todo',
    priority: 'medium',
    dueOffset: 3,
    createdDays: -3,
    updatedOffset: { days: -1 },
    copy: {
      'zh-CN': {
        title: '接入用户行为埋点',
        description: '覆盖注册、创建任务与完成任务的转化漏斗。',
        tags: ['数据'],
      },
      'en-US': {
        title: 'Instrument user behavior analytics',
        description: 'Cover the signup, task-creation, and completion funnel.',
        tags: ['Data'],
      },
    },
  },
  {
    id: 'seed-4',
    status: 'todo',
    priority: 'high',
    dueOffset: 0,
    createdDays: -2,
    updatedOffset: { hours: -5 },
    copy: {
      'zh-CN': {
        title: '修复移动端导航遮挡',
        description: '在 390px 视口下，底部操作栏会覆盖任务列表。',
        tags: ['修复', '移动端'],
      },
      'en-US': {
        title: 'Fix mobile navigation overlap',
        description: 'At a 390px viewport, the bottom action bar covers the task list.',
        tags: ['Bug', 'Mobile'],
      },
    },
  },
  {
    id: 'seed-5',
    status: 'done',
    priority: 'low',
    dueOffset: -2,
    createdDays: -8,
    updatedOffset: { days: -2 },
    copy: {
      'zh-CN': {
        title: '编写 API 错误处理文档',
        description: '沉淀统一错误码、重试策略和用户提示规范。',
        tags: ['文档'],
      },
      'en-US': {
        title: 'Write API error handling guide',
        description: 'Document error codes, retry strategy, and user-facing messages.',
        tags: ['Docs'],
      },
    },
  },
  {
    id: 'seed-6',
    status: 'in-progress',
    priority: 'medium',
    dueOffset: 5,
    createdDays: -5,
    updatedOffset: { hours: -3 },
    copy: {
      'zh-CN': {
        title: '优化首屏加载性能',
        description: '拆分路由资源，检查关键路径与图片压缩。',
        tags: ['性能'],
      },
      'en-US': {
        title: 'Improve first-load performance',
        description: 'Split route bundles and review the critical path and image compression.',
        tags: ['Performance'],
      },
    },
  },
  {
    id: 'seed-7',
    status: 'todo',
    priority: 'medium',
    dueOffset: 1,
    createdDays: -1,
    updatedOffset: { hours: -6 },
    copy: {
      'zh-CN': {
        title: '准备周五团队 Demo',
        description: '演示任务流、主题切换与数据导出。',
        tags: ['协作'],
      },
      'en-US': {
        title: 'Prepare Friday team demo',
        description: 'Showcase the task flow, theme switching, and data export.',
        tags: ['Collaboration'],
      },
    },
  },
  {
    id: 'seed-8',
    status: 'done',
    priority: 'low',
    dueOffset: -4,
    createdDays: -9,
    updatedOffset: { days: -4 },
    copy: {
      'zh-CN': {
        title: '清理无用依赖与死代码',
        description: '使用 bundle analyzer 检查产物体积。',
        tags: ['工程化'],
      },
      'en-US': {
        title: 'Remove unused dependencies and dead code',
        description: 'Check bundle size with the analyzer.',
        tags: ['Engineering'],
      },
    },
  },
]

function isoAtOffset({ days = 0, hours = 0 }: { days?: number; hours?: number }): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

function dueDateAtOffset(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function createSeedTasks(): Task[] {
  const locale = getCurrentLocale()

  return seedTemplates.map((template) => {
    const copy = template.copy[locale]

    return {
      id: template.id,
      title: copy.title,
      description: copy.description,
      status: template.status,
      priority: template.priority,
      dueDate: dueDateAtOffset(template.dueOffset),
      tags: copy.tags,
      createdAt: isoAtOffset({ days: template.createdDays }),
      updatedAt: isoAtOffset(template.updatedOffset),
    }
  })
}
