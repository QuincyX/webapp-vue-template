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

## 2026-10-30

### [Framework] 组件结构门禁：禁止纯转发组件

- 日期：2026-10-30
- 变更：
  - 新增 `scripts/check-components.mjs`：识别「只 import 同目录组件 + 原样渲染」的空壳 `.vue`。
  - `package.json` 增加 `check:components`，并作为 `pnpm lint` 的第一道检查。
  - AGENTS 架构红线新增第 10 条，写明触发条件、修复动作与验证命令。
- 影响：
  - 页面入口必须是实现本身，不能是 `./components/Page.vue` 的包装。
  - `pnpm lint` 失败原因可能来自结构检查，而不是 Oxlint/ESLint。
- 文档：
  - [AGENTS.md](../AGENTS.md)
  - [docs/architecture.md](./architecture.md#7-扩展位置)
  - [docs/engineering.md](./engineering.md#62-vue-与组件)
  - [README.md](../README.md)
- 验证：`pnpm check:components`（无违规）、`pnpm lint` 通过。

### [Framework] 远端数据层：远端 Store 范式、信封适配器、会话失效单一判定、TTL 缓存

- 日期：2026-10-30
- 变更：
  - 新增 `src/stores/health.ts` 作为远端 Store 参照：请求单飞、只暴露 `errorCode`/`requestId`、派生值用 `computed`、不持久化无意义状态。
  - 设置页「后端连接」改为消费该 Store，删除页面内重复的加载/错误状态管理。
  - 新增 `src/api/envelope.ts`：`{ code, data, message }` / `{ error, msg, data }` 信封解包 + 业务码判定 + Zod 校验，失败归一化为 `ApiError('business')`。
  - `ApiErrorCode` 增加 `business`，中英文语言包新增 `apiError.business`。
  - `src/api/http.ts` 抽出 `shouldClearSession()` 作为唯一的会话失效判定，并导出 `UNAUTHORIZED_EVENT` 供 `main.ts` 使用。
  - 新增 `src/utils/localCache.ts`：内存 + `localStorage` 的 TTL 缓存，提供 `get`/`peek`/`entries`/`setMany`/`clear`。
- 影响：
  - 视图不再拼 `apiError.<code>`，统一走错误码；后端换会话方案时只改 `http.ts` 与 `token.ts`。
  - 用户拥有的状态不得进入 TTL 缓存，避免过期即丢数据。
- 文档：
  - [docs/architecture.md](./architecture.md#5-状态与数据所有权)
  - [docs/architecture.md](./architecture.md#62-远程请求)
  - [docs/architecture.md](./architecture.md#63-远端-store错误码单飞与缓存)
  - [docs/engineering.md](./engineering.md#63-状态与持久化)
  - [docs/engineering.md](./engineering.md#64-api-与数据边界)
  - [README.md](../README.md)
- 验证：`pnpm test:unit:run`（新增 localCache 8 项、envelope 8 项、health 4 项）、`pnpm type-check`、`pnpm lint`、`pnpm build`。

### [Framework] 表单与错误文案复用：useLoginForm / useRegisterForm / useApiError

- 日期：2026-10-30
- 变更：
  - 登录页与注册页的校验、错误归一化、密码可见性状态下沉到 `src/composables/useLoginForm.ts`、`useRegisterForm.ts`。
  - 新增 `src/composables/useApiError.ts`：唯一的 `ApiErrorCode → i18n 文案` 映射入口。
  - 两个页面只保留「成功后 toast + 安全回跳」。
- 影响：
  - 新增就地登录（弹窗、抽屉、会话过期提示）时复用同一套校验，不再复制表单逻辑。
  - 修改错误文案只需改语言包，不再逐页替换。
- 文档：
  - [docs/architecture.md](./architecture.md#64-认证与会话)
  - [docs/engineering.md](./engineering.md#62-vue-与组件)
  - [README.md](../README.md)
- 验证：`pnpm test:unit:run`（新增 useLoginForm 6 项）、`pnpm type-check`、`pnpm lint`、`pnpm test:e2e`（登录/注册/校验路径）。

### [Framework] E2E 重构：按域拆分、网络层假接口、响应式溢出断言

- 日期：2026-10-30
- 变更：
  - `e2e/app.spec.ts` 拆分为 `auth`、`tasks`、`settings`、`responsive` 四个按域用例文件。
  - 新增 `e2e/helpers.ts`（登录、清理会话、横向溢出断言）与 `e2e/fixtures.ts`（`page.route` 假接口，自动处理 CORS/OPTIONS 与清理）。
  - `settings.spec.ts` 使用假接口覆盖后端 5xx 与请求 ID 展示，这是本地 mock 无法表达的路径。
  - `responsive.spec.ts` 在 390/768/1440 断言无横向溢出。
  - `playwright.config.ts` 设置 `serviceWorkers: 'block'`，避免 PWA Service Worker 干扰用例。
- 影响：
  - 新增用例放在对应用例文件；模拟失败用 `api.fail()`，不要改应用代码或 mock 服务端。
  - 布局改动必须通过 `responsive.spec.ts`。
- 文档：
  - [docs/architecture.md](./architecture.md#8-测试架构)
  - [docs/engineering.md](./engineering.md#8-测试约束)
  - [README.md](../README.md)
- 验证：`pnpm test:e2e`（四个用例文件全部通过）。

### [Framework] 发布流水线：deploy/build.sh 与 deploy/publish.sh

- 日期：2026-10-30
- 变更：
  - 新增 `deploy/build.sh`：Node/pnpm 版本闸门、冻结锁文件安装、`STRICT_ENV` 拦截本地 env、清理 `dist/`、执行 `pnpm build`、断言 `dist/index.html` 与 `dist/assets`。
  - 新增 `deploy/publish.sh`：S3 发布并分离缓存策略（`assets/*` immutable，入口/SW/manifest no-cache），支持 `--build`/`--dry-run`/`--delete`。
  - 新增 `deploy/deploy.env.example`；凭据只来自环境变量或已被忽略的 `deploy/deploy.env.local`。
  - CI 增加 `bash -n` 语法检查。
- 影响：
  - 发布不再手敲构建命令；本地 env 覆盖不会静默进入生产产物。
  - 使用其它静态托管时只取 `dist/`，但必须保持同样的缓存分组。
- 文档：
  - [docs/engineering.md](./engineering.md#2-安装与启动)
  - [docs/engineering.md](./engineering.md#3-命令)
  - [docs/engineering.md](./engineering.md#9-ci-与部署)
  - [README.md](../README.md)
- 验证：`bash deploy/build.sh --skip-install` 通过并生成 `dist/`。

### [Framework] PWA：manifest、Service Worker 与安装引导

- 日期：2026-10-30
- 变更：
  - 引入 `vite-plugin-pwa`，生成 manifest、Workbox 预缓存与 `registerSW.js`（`autoUpdate`，开发服务器不注册）。
  - manifest 名称来自 `VITE_APP_TITLE`，`start_url=/?source=pwa`，portrait、standalone，`navigateFallbackDenylist` 排除 `/api/`。
  - 新增 `public/icons/`（192/512 any 与 maskable）与 `public/apple-touch-icon.png`；`index.html` 增加 apple 主屏元信息与 `viewport-fit=cover`。
  - 新增 `src/composables/useInstallPrompt.ts`（Chromium 安装事件、iOS 手动引导、standalone 检测），在 `main.ts` 挂载前初始化。
  - 新增 `src/components/ui/InstallApp.vue`，在设置页按可用性渲染安装入口。
  - `vite.config.ts` 改为函数式配置以读取构建期标题；`vitest.config.ts` 相应解析一次配置再 `mergeConfig`。
  - CI 增加 PWA 产物断言（`manifest.webmanifest`、`sw.js`、图标）。
- 影响：
  - `pnpm build` 产物包含 SW；`pnpm dev` 不注册，不能用于复现 SW 问题。
  - 新增 `vite-plugin-pwa` 依赖；禁止再引入第二个 PWA/SW 插件。
- 文档：
  - [AGENTS.md](../AGENTS.md)
  - [docs/architecture.md](./architecture.md#68-pwaservice-worker-与安装)
  - [docs/engineering.md](./engineering.md#22-pwa-与-service-worker)
  - [docs/engineering.md](./engineering.md#7-依赖策略)
  - [docs/engineering.md](./engineering.md#9-ci-与部署)
  - [README.md](../README.md)
- 验证：`pnpm build`（生成 manifest/sw/图标）、`pnpm test:unit:run`（新增 install prompt 1 项）、`pnpm type-check`、`pnpm lint`、`pnpm test:e2e`。

> 2026-10-30 全部变更的合并验证：`pnpm docs:check`（17 files / 125 links）、`pnpm format:check`、`pnpm lint`（0 warnings / 0 errors，含 `check:components`）、`pnpm type-check`（TS7 + vue-tsc）、`pnpm test:unit:run`（10 files / 56 passed）、`pnpm build`、`bash deploy/build.sh --skip-install`、`CI=true pnpm test:e2e`（16 passed，preview 产物 + 系统 Edge，`PLAYWRIGHT_CHANNEL=msedge`；当前网络无法下载 Playwright 自带 Chromium）。

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
