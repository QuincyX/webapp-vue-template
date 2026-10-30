import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TaskListItem from '@/components/tasks/TaskListItem.vue'
import { taskSchema } from '@/types/task'

const task = taskSchema.parse({
  id: 'test-task',
  title: '验证任务列表交互',
  description: '检查 checkbox、编辑与删除事件。',
  status: 'todo',
  priority: 'high',
  dueDate: null,
  tags: ['测试'],
  createdAt: '2026-10-26T08:00:00.000Z',
  updatedAt: '2026-10-26T08:00:00.000Z',
})

describe('TaskListItem', () => {
  it('renders task content and emits toggle', async () => {
    const wrapper = mount(TaskListItem, { props: { task } })

    expect(wrapper.text()).toContain(task.title)
    expect(wrapper.text()).toContain('高优先级')
    expect(wrapper.text()).toContain('测试')

    await wrapper.get('[role="checkbox"]').trigger('click')
    expect(wrapper.emitted('toggle')?.[0]).toEqual([task.id])
  })

  it('emits edit and remove actions', async () => {
    const wrapper = mount(TaskListItem, { props: { task } })

    await wrapper.get(`button[aria-label="编辑任务：${task.title}"]`).trigger('click')
    await wrapper.get(`button[aria-label="删除任务：${task.title}"]`).trigger('click')

    expect(wrapper.emitted('edit')?.[0]).toEqual([task])
    expect(wrapper.emitted('remove')?.[0]).toEqual([task])
  })

  it('can hide row actions for compact surfaces', () => {
    const wrapper = mount(TaskListItem, {
      props: { task, showActions: false },
    })

    expect(wrapper.find(`button[aria-label="删除任务：${task.title}"]`).exists()).toBe(false)
  })
})
