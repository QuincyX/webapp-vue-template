# Implementation Plan: [FEATURE NAME]

- Spec: `[../NNN-slug/spec.md]`
- Status: `Planned`
- Date: `[YYYY-MM-DD]`

## 技术方案

[说明实现思路、复用的现有模块、关键取舍。不要复制整份架构文档。]

## 受影响区域

| 区域        | 文件/模块                       | 变更 |
| ----------- | ------------------------------- | ---- |
| API         | `src/api/...`                   | ...  |
| 类型/Schema | `src/types/...`                 | ...  |
| 状态        | `src/stores/...`                | ...  |
| 路由/布局   | `src/router/...`                | ...  |
| 页面/组件   | `src/views/...`                 | ...  |
| i18n        | `src/i18n/messages/...`         | ...  |
| 测试        | `src/__tests__/...` / `e2e/...` | ...  |
| 文档        | `docs/...`                      | ...  |

## 数据与接口

[数据模型、API 契约、错误码、持久化。复杂契约放 `contracts/api.md`。]

## 状态与交互

[加载、空状态、错误、成功、并发、取消、超时。]

## i18n 与可访问性

[必须同时覆盖中英文；键盘、焦点、aria、reduced motion。]

## 测试策略

- 单元：
- 组件：
- E2E：
- 人工验收：

## 宪法检查

- [ ] 遵守 AGENTS 架构边界
- [ ] 不重复已有工程规则
- [ ] 明确非目标和范围
- [ ] 有可验证的验收证据
- [ ] 框架变更已列入文档任务

## 风险与回滚

[风险、兼容性、回滚方式。]

## 文档影响

[framework-changelog、architecture、engineering、README、AGENTS。]
