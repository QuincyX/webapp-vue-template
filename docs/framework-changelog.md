# 框架变更记录

本文件只记录**非业务层的框架功能变更**。示例任务页面、任务文案等纯业务调整不在此记录；混合变更按框架变更处理。

## 记录规则

1. 追加，不重写历史。
2. 每条记录必须包含：日期、变更摘要、受影响文档、验证方式。
3. 文档更新与代码变更必须在同一次变更中完成。
4. 若变更推翻旧决策，新增记录并写明替代关系，不删除旧记录。
5. 日期使用 `YYYY-MM-DD`。

新增记录模板：

```md
### [Framework] 变更标题

- 日期：YYYY-MM-DD
- 变更：一句话说明行为/约束变化
- 影响：受影响的模块、命令或兼容性
- 文档：更新了哪些文档
- 验证：执行的命令与结果
```

---

## 2026-10-27

### [Framework] 页面目录边界：一页一目录，入口固定 index.vue

- 日期：2026-10-27
- 变更：
  - 新增页面目录规范：`/foo` → `src/views/foo/index.vue`；根路径使用 `src/views/home/index.vue`，404 使用 `src/views/not-found/index.vue`。
  - 页面私有的子组件、composables、数据、类型和资源放在该页面目录内，只能被当前页面引用。
  - 禁止页面目录之间互相导入；跨页面复用必须提升到 `src/components/`、`src/composables/`、`src/stores/`、`src/types/`、`src/utils/` 或 `src/api/`。
  - 现有 `DashboardView`、`TasksView`、`SettingsView`、`NotFoundView`、`LoginView`、`RegisterView` 迁移为对应页面目录的 `index.vue`；路由只引用 `index.vue`。
  - 同步更新 AGENTS、架构说明、工程说明、README 结构树和账号模块规格中的路径。
- 影响：
  - 新建页面不得再使用 `src/views/FooView.vue` 平铺文件。
  - 页面目录成为明确边界，跨页面复用需要先上移到共享层。
  - 现有 URL、路由名称、页面行为和测试保持不变。
- 文档：
  - [AGENTS.md](../AGENTS.md)
  - [docs/architecture.md](./architecture.md#7-扩展位置)
  - [docs/engineering.md](./engineering.md#62-vue-与组件)
  - [README.md](../README.md)
  - [.github/pull_request_template.md](../.github/pull_request_template.md)
  - [specs/001-account-auth/plan.md](../specs/001-account-auth/plan.md)
- 验证：`pnpm docs:check`（17 files / 119 links）、`pnpm format:check`、`pnpm lint`（0/0）、`pnpm type-check`、`pnpm test:unit:run`（29 passed）、`pnpm build`、`pnpm test:e2e`（8 passed，CI preview 模式）。

### [Framework] Starter cleanup：移除本地环境文件与废弃文案

- 日期：2026-10-27
- 变更：
  - 删除冗余的本地 `.env`；默认值集中在 `src/config/env.ts`，需要覆盖时使用 `.env.local`。
  - `.env` 加入 Git 忽略，保留 `.env.example`。
  - `index.html` 使用静态 `Orbit` 作为首屏标题，避免无 `.env` 时留下 `%VITE_APP_TITLE%`；运行时标题仍由布局和 `VITE_APP_TITLE` 维护。
  - 删除已废弃的 `validation.name*`、`validation.email*`、`validation.role*` 和 `settings.api.failureDescription` 文案键。
  - 清理 `dist`、`test-results`、`playwright-report`、`.data` 等生成物，保留源码、测试、文档和演示截图。
- 影响：无运行时行为变化；本地覆盖配置改为只使用 `.env.local`。
- 文档：
  - [README.md](../README.md)
  - [docs/engineering.md](./engineering.md)
  - [.gitignore](../.gitignore)
  - [index.html](../index.html)
- 验证：`pnpm docs:check`（17 files / 119 links）、`pnpm format:check`、`pnpm lint`（0/0）、`pnpm type-check`、`pnpm test:unit:run`（29 passed）、`pnpm build`、`pnpm test:e2e`（8 passed）。

### [Framework] Spec Kit Lite：轻量规格驱动流程

- 日期：2026-10-27
- 变更：
  - 新增 `specs/` 目录、流程宪法、spec/plan/tasks/verification 模板与功能索引。
  - 非平凡业务功能采用“规格 → 计划 → 任务 → 验证 → 冻结”的轻量流程，不安装 Spec Kit CLI。
  - `tasks.md` 作为跨会话任务源；已完成 feature 目录冻结，新需求新建编号。
  - `docs:check` 覆盖 `specs/**/*.md`；PR 模板增加规格目录和 `Verified` 状态。
- 影响：Agent 上下文路由增加功能规格；非平凡功能需人工评审 spec/plan；已有 AGENTS/docs 仍是上位约束。
- 文档：
  - [AGENTS.md](../AGENTS.md)
  - [specs/README.md](../specs/README.md)
  - [specs/constitution.md](../specs/constitution.md)
  - [docs/README.md](./README.md)
  - [docs/engineering.md](./engineering.md)
  - [scripts/check-docs.mjs](../scripts/check-docs.mjs)
  - [.github/pull_request_template.md](../.github/pull_request_template.md)
- 验证：`pnpm docs:check`、`pnpm format:check`、`pnpm lint`、`pnpm type-check`

### [Framework] 基础账号鉴权、受保护路由与账号设置

- 日期：2026-10-27
- 变更：
  - 新增邮箱密码注册、登录、会话恢复、退出、显示名称修改和密码修改；不接入第三方登录。
  - 新增 `AuthLayout`、登录/注册页、Auth Store、Axios 鉴权 API、Zod 边界、路由守卫与 401 统一处理。
  - 业务页统一 `requiresAuth`；登录后回到 `redirect`，开放重定向被拒绝。
  - 删除本地 `preferences` Store 与 `orbit.profile.v1` 读取，身份统一由 Auth Store 提供。
  - 新增仅开发/预览/E2E 使用的本地 `/api/auth/*` 适配层；生产必须替换真实后端。
  - 修复健康检查：本地适配层提供 `/api/health`。
- 影响：
  - 应用首次访问需要登录；本地演示账号为 `demo@orbit.app` / `OrbitDemo123!`。
  - 账号数据写入 `.data/auth-users.json`，已 Git 忽略；服务重启后用户保留、会话失效。
  - 生产 token 仍建议改为 HttpOnly Cookie + CSRF；当前 localStorage 仅示例。
- 文档：
  - [README.md](../README.md)
  - [docs/architecture.md](./architecture.md)
  - [docs/engineering.md](./engineering.md)
  - [specs/001-account-auth/spec.md](../specs/001-account-auth/spec.md)
  - [specs/001-account-auth/plan.md](../specs/001-account-auth/plan.md)
  - [specs/001-account-auth/verification.md](../specs/001-account-auth/verification.md)
  - [server/auth-mock.ts](../server/auth-mock.ts)
  - [src/stores/auth.ts](../src/stores/auth.ts)
  - [src/api/auth.ts](../src/api/auth.ts)
  - [.gitignore](../.gitignore)
- 验证：`pnpm docs:check`（17 files / 119 links）、`pnpm format:check`、`pnpm lint`（0/0）、`pnpm type-check`、`pnpm test:unit:run`（29 passed）、`pnpm build`、`pnpm test:e2e`（8 passed，开发与 CI preview 模式）

### [Framework] Agent 规则治理：上下文路由、准入、审计与任务契约

- 日期：2026-10-27
- 变更：
  - 将“每个任务阅读全部工程文档”改为按任务类型的上下文路由。
  - 新增全局规则准入标准，明确禁止模型行为泛化规则、仪式化流程和 DSH 已覆盖的工具规范。
  - 新增规则生命周期与审计机制，规则变更需有证据并记录。
  - 增加文档事实归属表，明确命令、架构、Agent 规则、用户说明和变更历史的唯一来源。
  - 增加非平凡任务契约，要求写清目标、约束、自主范围、验收证据和停止条件。
  - PR 模板增加目标、验收证据、未执行检查和任务契约确认。
- 影响：
  - `AGENTS.md` 不再要求全量阅读文档，不再重复维护完整命令说明。
  - Agent 规则新增、删除或合并必须经过准入与审计。
  - PR 需要提供可复现的验收证据，未执行检查必须说明。
- 文档：
  - [AGENTS.md](../AGENTS.md)
  - [docs/README.md](./README.md)
  - [docs/engineering.md](./engineering.md)
  - [docs/framework-changelog.md](./framework-changelog.md)
  - [README.md](../README.md)
  - [.github/pull_request_template.md](../.github/pull_request_template.md)
- 验证：`pnpm docs:check`、`pnpm format:check`、`pnpm lint`、`pnpm type-check`、`pnpm test:unit:run`、`pnpm build`

## 2026-10-26

### [Framework] 文档治理与 Agent 契约

- 日期：2026-10-26
- 变更：新增 Agent 协作契约、架构说明、工程约束、文档索引、PR 模板和文档链接检查；明确“非业务层框架变更必须同步更新文档”的硬性规则。
- 影响：
  - 后续框架变更必须更新本文件与对应说明文档
  - 新增 `pnpm docs:check`，CI 增加文档链接检查
  - 新增统一的完成定义和质量门禁说明
- 文档：
  - [AGENTS.md](../AGENTS.md)
  - [docs/README.md](./README.md)
  - [docs/architecture.md](./architecture.md)
  - [docs/engineering.md](./engineering.md)
  - [docs/framework-changelog.md](./framework-changelog.md)
  - [README.md](../README.md)
  - [.github/pull_request_template.md](../.github/pull_request_template.md)
- 验证：`pnpm docs:check`、`pnpm format:check`、`pnpm lint`

### [Framework] TypeScript 7 与 TS 6 Compiler API 并存

- 日期：2026-10-26
- 变更：实际应用编译器升级到 TypeScript 7.0.2，通过官方别名方案保留 TS 6.0.x Compiler API，供 `vue-tsc` 与 `typescript-eslint` 使用。
- 影响：
  - `pnpm exec tsc --version` 为 `7.0.2`
  - `pnpm exec tsc6 --version` 为 `6.0.3`
  - `pnpm type-check` 拆分为 TS7 应用/配置检查与 vue-tsc SFC 检查
  - `.vue` 模板检查暂时仍走 TS 6 API
- 文档：
  - [docs/architecture.md](./architecture.md)
  - [docs/engineering.md](./engineering.md)
  - [README.md](../README.md#typescript-7-的官方并存方案)
- 验证：`pnpm type-check`、`pnpm build`、`pnpm test:e2e`

### [Framework] Axios 请求层与拦截器

- 日期：2026-10-26
- 变更：新增 Axios 实例、认证头、`X-Request-Id`、`Accept-Language`、超时、401 处理、`ApiError` 错误归一化、Zod 响应校验示例与 `/health` 设置页入口。
- 影响：
  - 所有后端请求必须经 `src/api/`
  - 视图不得直接使用 Axios 或解析 Axios 错误
  - 新增 `VITE_API_BASE_URL` 与 `VITE_API_TIMEOUT`
- 文档：
  - [docs/architecture.md](./architecture.md)
  - [docs/engineering.md](./engineering.md)
  - [README.md](../README.md#axios-请求层)
  - [.env.example](../.env.example)
- 验证：`pnpm type-check`、`pnpm test:unit:run`、`pnpm build`

### [Framework] 中英文 i18n

- 日期：2026-10-26
- 变更：接入 vue-i18n，新增中英文语言包、语言切换、locale 持久化、`html lang`、文档标题、日期/相对日期/复数格式化，以及请求 `Accept-Language` 同步。
- 影响：
  - 所有用户可见文案必须走 i18n
  - 修改文案必须同时更新 `zh-CN` 与 `en-US`
  - 路由 meta 从 `title` 改为 `titleKey`
- 文档：
  - [docs/architecture.md](./architecture.md)
  - [docs/engineering.md](./engineering.md)
  - [README.md](../README.md#国际化i18n)
- 验证：`pnpm type-check`、`pnpm test:unit:run`、`pnpm build`、`pnpm test:e2e`

### [Baseline] 通用 Vue 工程基线

- 日期：2026-10-26
- 变更：建立 Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS + TypeScript 的工程底座，包含 Zod 边界、Vitest、Playwright、ESLint/Oxlint/Prettier、GitHub Actions、Dependabot、Nginx 部署配置和响应式可访问性示例。
- 影响：作为后续框架变更的初始基线。
- 文档：[README.md](../README.md)
- 验证：`pnpm format:check`、`pnpm lint`、`pnpm type-check`、`pnpm test:unit:run`、`pnpm build`、`pnpm test:e2e`
