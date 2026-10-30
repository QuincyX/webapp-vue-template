# 工程说明与约束

本文是开发、评审和自动化执行的操作手册。Agent 的协作规则见 [AGENTS.md](../AGENTS.md)，系统结构见 [架构说明](./architecture.md)。

## 1. 环境要求

| 项       | 要求                                        |
| -------- | ------------------------------------------- |
| Node.js  | `^22.18.0 \|\| >=24.12.0`，推荐 Node 24 LTS |
| pnpm     | `>=11`，仓库固定 `11.28.5`                  |
| 包管理器 | 仅 pnpm；使用 `pnpm-lock.yaml`              |
| 浏览器   | 最近两个大版本的 evergreen 浏览器           |

项目在 `pnpm-workspace.yaml` 中固定了 `nodeLinker: hoisted`，用于兼容 Windows 上不擅长处理符号链接的工具链。不要随意改回 isolated。

## 2. 安装与启动

```bash
corepack enable
corepack prepare pnpm@11.28.5 --activate
pnpm install
pnpm dev
```

本地开发地址为 `http://localhost:5173`，生产预览为 `http://localhost:4173`。

不要在仓库中提交 `node_modules/`、`dist/`、覆盖率、Playwright 报告或缓存。

### 2.1 本地鉴权适配层

当前仓库没有生产后端，`pnpm dev` 与 `pnpm preview` 通过 [server/auth-mock.ts](../server/auth-mock.ts) 挂载 `/api/auth/*` 与 `/api/health`：

- 演示账号：`demo@orbit.app` / `OrbitDemo123!`
- 注册数据写入 `.data/auth-users.json`（已 Git 忽略）
- 密码使用 Node `scrypt` + 随机 salt 哈希
- 会话 token 只存在进程内存，默认 7 天；服务重启后需重新登录
- 用户数据在服务重启后保留
- 该适配层只在 Vite 开发/预览服务器中运行，不进入前端 bundle

**这不是生产鉴权服务。** 生产静态部署必须由真实后端实现同一契约，包括数据库、限流、审计、邮件、Cookie/CSRF 和密钥管理。接口契约见 [001 账号模块计划](../specs/001-account-auth/plan.md#数据与接口)。不接入第三方登录。

## 3. 命令

| 命令                   | 用途                             | 是否进入 CI           |
| ---------------------- | -------------------------------- | --------------------- |
| `pnpm dev`             | Vite 开发服务器                  | 否                    |
| `pnpm build`           | 类型检查 + 生产构建              | 是                    |
| `pnpm preview`         | 预览生产产物                     | E2E 的 CI 路径        |
| `pnpm docs:check`      | 关键文档存在性与相对链接检查     | 是                    |
| `pnpm format:check`    | Prettier 检查                    | 是                    |
| `pnpm format`          | 格式化并写回                     | 否                    |
| `pnpm lint`            | Oxlint + ESLint，只检查          | 是                    |
| `pnpm lint:fix`        | 自动修复可修复问题               | 否                    |
| `pnpm type-check`      | TS7 应用/配置检查 + Vue SFC 检查 | 是                    |
| `pnpm type-check:app`  | 使用 TS7 检查 `.ts`              | 否                    |
| `pnpm type-check:node` | 使用 TS7 检查 Node 配置          | 否                    |
| `pnpm type-check:vue`  | 使用 vue-tsc 检查 SFC（TS6 API） | 是（并入 type-check） |
| `pnpm test:unit`       | Vitest watch                     | 否                    |
| `pnpm test:unit:run`   | 单测单次运行                     | 是                    |
| `pnpm test:coverage`   | V8 覆盖率                        | 否                    |
| `pnpm test:e2e`        | Playwright，自动管理服务器       | 是                    |
| `pnpm test:e2e:ui`     | Playwright UI 调试               | 否                    |

## 4. 完整质量门禁

框架变更在本地提交前至少执行：

```bash
pnpm docs:check
pnpm format:check
pnpm lint
pnpm type-check
pnpm test:unit:run
pnpm build
```

涉及路由、交互、主题、语言或持久化时，再执行：

```bash
$env:CI = "true"                 # PowerShell，模拟生产预览
pnpm test:e2e
```

本地没有 Playwright Chromium 且网络受限时：

```powershell
pnpm exec playwright install chromium
# 或复用系统浏览器
$env:PLAYWRIGHT_CHANNEL = "msedge"
pnpm test:e2e
```

## 5. 变更分类与文档义务

这是硬性要求，详细矩阵见 [AGENTS.md](../AGENTS.md)。

### 业务变更

只修改示例任务领域（任务字段、任务页面交互、示例任务内容）时：

- 至少运行格式、Lint、类型检查与相关测试
- 影响用户可见功能时，检查 README 和截图是否仍准确
- 不强制写框架变更记录

### 框架变更

涉及依赖、构建、脚本、TypeScript、路由/状态/API 架构、i18n、主题、全局样式、共享 UI、环境变量、CI、部署或 Agent 规则时：

1. 更新 [框架变更记录](./framework-changelog.md)。
2. 按矩阵更新 [架构说明](./architecture.md)、本文、[README](../README.md) 或 [AGENTS](../AGENTS.md)。
3. 执行完整质量门禁。
4. 在最终说明中列出更新过的文档。

**“代码先合并，文档以后补”不被接受。**

各类事实的权威来源见 [文档事实归属表](./README.md#事实归属)。命令、CI、环境变量和发布流程只在本文件维护。

### Agent 规则生命周期与审计

`AGENTS.md` 中的全局规则会进入所有任务上下文，因此必须像依赖一样审计，而不是只增不减。新增规则先通过 [全局规则准入](../AGENTS.md#33-全局规则准入)。

审计触发时机：

- 模型、DSH、TypeScript、Vite、测试工具或主要依赖升级后
- 至少每季度一次
- 出现规则冲突、反复过早停止、重复读取、上下文异常增长等信号时

审计方法：

1. 列出 `AGENTS.md`、`docs/` 和任务模板中的强制规则。
2. 标记重复、冲突、无条件适用范围、已被 DSH 覆盖、没有证据的规则。
3. 选取三类真实任务做对照：小型修改、常规功能、跨文件/架构改动。
4. 对比当前规则版与精简版的成功率、返工次数、人工打断次数和上下文成本。
5. 只保留项目事实、风险边界和有证据的失败检查；删除或合并其余规则。
6. 将规则变更、理由和验证结果写入 [框架变更记录](./framework-changelog.md)。

不要因为“规则看起来专业”而保留它；也不要因为某次模型表现好就删除安全性或数据边界。规则变更必须有证据，且保持可回滚。

### 功能规格流程（Spec Kit Lite）

非平凡业务功能使用 [specs/](../specs/README.md) 中的轻量 SDD 流程。目标是减少需求歧义和跨会话漂移，不是给每个任务增加仪式。

| 阶段 | 产物                     | 门禁                                      |
| ---- | ------------------------ | ----------------------------------------- |
| 规格 | `specs/NNN-slug/spec.md` | 目标、非目标、P1 故事和验收场景经人工确认 |
| 计划 | `plan.md`                | 复用现有架构，列明文件、测试和文档影响    |
| 任务 | `tasks.md`               | 任务可追溯到 spec/plan，含精确路径        |
| 实现 | 代码 + 勾选 tasks        | 按 P1 切片验收                            |
| 收敛 | `verification.md`        | 验收场景有命令、测试或人工证据            |

规则：

- 不要求安装 Spec Kit CLI，也不要求完整 `/speckit-*` 九步流程。
- `tasks.md` 是跨会话任务源；当前会话 todo 只作为执行镜像。
- 已验收目录冻结；新需求新建编号并写 `Supersedes`。
- 纯 bugfix、文案、样式、单组件和工具链升级不创建 spec。
- spec 只写 What/Why，技术方案放 plan，项目约束仍以 `AGENTS.md`/`docs/` 为准。

## 6. 编码约束

### 6.1 TypeScript

- 使用严格模式；禁止用 `any`、`@ts-ignore` 或关闭 strict 绕过问题。
- 未知数据用 `unknown`，通过 Zod 收窄。
- 公共类型优先从 Schema 推导：`z.infer<typeof schema>`。
- 路径别名统一使用 `@/`。
- 类型检查的实际编译器是 TS 7；Vue SFC 暂时由 TS 6 API 兼容层检查。
- 不要删除 `@typescript/native`、`typescript` 别名、`types/vue-shim.d.ts` 或 `tsconfig.typecheck.json`。调整前先看 [架构说明](./architecture.md#9-已知约束与技术债)。

### 6.2 Vue 与组件

- 使用 Composition API + `<script setup lang="ts">`。
- 页面必须使用 `src/views/<page>/index.vue`：`/foo` → `src/views/foo/index.vue`；根路径用 `src/views/home/index.vue`，404 用 `src/views/not-found/index.vue`。
- 页面私有的子组件、composables、数据、类型和资源放在该页面目录内，可继续分子目录；**只能被当前页面目录引用**。
- 页面目录之间禁止互相导入。需要复用时先提升到 `src/components/`、`src/composables/`、`src/stores/`、`src/types/`、`src/utils/` 或 `src/api/`；共享层也不得反向导入页面目录。
- 路由只引用页面的 `index.vue`；不要新增 `src/views/FooView.vue` 这类平铺页面文件。
- 共享 UI 放 `src/components/ui/`，应用壳放 `src/components/layout/`，任务示例组件放 `src/components/tasks/`。
- Props/emits 使用类型声明，不用运行时 `any` 兜底。
- 可复用逻辑放 `src/composables/`，不复制多个页面。
- 组件不得直接发起 HTTP 请求；请求经 API 模块与 Store。
- 复杂交互必须考虑键盘、焦点、屏幕阅读器和 reduced motion。

### 6.3 状态与持久化

- Pinia Store 使用 Setup Store。
- 持久化键必须带版本号，并写明在 [架构说明](./architecture.md#5-状态与数据所有权)。
- 读取持久化数据必须通过 Schema 校验，失败要安全回退。
- 视图不直接读写业务 `localStorage`。
- 主题和语言是基础设施状态，分别由 `useTheme`、i18n 模块管理。
- 当前账号是服务端会话状态，由 [Auth Store](../src/stores/auth.ts) 唯一持有；不写入本地 profile 存储。
- 旧 `orbit.profile.v1` 不再读取；不要为兼容旧示例资料新增迁移层。

### 6.4 API 与数据边界

- 所有 HTTP 请求走 `src/api/`。
- 外部响应必须经 Zod 校验。
- 错误统一为 `ApiError`，使用 `code` 做 i18n 展示。
- 组件不得感知 Axios 的 error/config/response 结构。
- 401 处理集中在一个响应拦截器中；不要在页面重复清理 token。
- 新增环境变量必须同时更新：
  - `env.d.ts`
  - `src/config/env.ts`
  - `.env.example`
  - [README](../README.md#环境变量)
  - [工程说明](./engineering.md)（如有新约束）
- 仓库不提交 `.env`；默认值在 `src/config/env.ts`，本地覆盖使用 `.env.local`。

### 6.5 i18n

- 不允许在 `.vue` 模板中直接写用户可见的硬编码文案。
- 修改任何文案必须同时更新 `src/i18n/messages/zh-CN.ts` 与 `en-US.ts`。
- 日期、时间、货币和相对时间必须使用当前 locale。
- 路由标题使用 `meta.titleKey`，不要写死中文/英文。
- 新增语言必须更新 `SUPPORTED_LOCALES`、语言包和文档。

### 6.6 样式与设计系统

- 优先使用 Tailwind 工具类和 `main.css` 中的 Design Token。
- 共享组件不要硬编码一次性品牌色；优先语义色（`primary`、`muted`、`border` 等）。
- 新增全局 CSS 只用于 Token、基础层、可复用的组件类，不放页面专属样式。
- 必须保留深色模式与 `prefers-reduced-motion` 行为。

### 6.7 安全

- 只有 `VITE_` 变量可进入客户端；不存放密钥。
- 不使用 `v-html` 渲染不可信内容。
- 不在日志中输出 token、Cookie、完整请求体或个人信息。
- 本地 token 是示例；生产应使用更安全的会话机制。
- 本地鉴权适配层使用 scrypt 哈希和随机 token，但仍是开发工具，不得作为生产服务部署。
- 登录失败返回通用凭据错误，不暴露邮箱是否存在；注册重复邮箱例外（409）。

## 7. 依赖策略

- 新增依赖前先确认现有库能否解决。
- 禁止同时引入两套同类基础库。
- 明确依赖用途，并在框架变更记录中写明。
- 大版本升级必须：
  1. 阅读 breaking changes。
  2. 更新锁文件。
  3. 运行完整质量门禁与 E2E。
  4. 更新 README/工程说明/变更记录。
- 依赖安装使用 `pnpm add` / `pnpm remove`，不要手工编辑 `pnpm-lock.yaml`。
- Dependabot 更新视为代码变更，同样需要 Review 与验证。

## 8. 测试约束

- 新增纯函数、Schema、Store、API 拦截器行为：必须有单元测试。
- 修改共享组件事件契约：必须有组件测试。
- 修改用户路径、路由、持久化、主题或语言：必须有 E2E。
- Bugfix 优先补回归测试。
- 测试必须可重复，不依赖真实外部网络、系统时间或本地机器路径。
- 测试中的 `localStorage` 必须清理；时间使用 fake timers。
- 不为通过测试而删断言或跳过测试。
- E2E 使用本地鉴权适配层；`demo@orbit.app` 只读使用，注册/改密场景使用唯一邮箱，避免污染演示账号。
- `.data/auth-users.json` 不进入版本库；测试不得依赖其中已有的非演示账号。

## 9. CI 与部署

CI 在 `.github/workflows/ci.yml` 中按顺序执行：

1. 安装依赖（frozen lockfile）
2. 验证 TS7 / TS6 版本
3. 文档链接检查
4. 格式检查
5. Lint
6. 类型检查
7. 单元测试
8. 构建
9. Playwright E2E
10. 失败时上传 Playwright 报告

部署使用 `dist/` 静态产物和 SPA history fallback，参考 [deploy/nginx.conf](../deploy/nginx.conf)。账号模块要求生产环境提供真实 `/api/auth/*` 与 `/api/health`；本地 Vite 插件不会进入静态产物。部署行为变化必须更新 README 和本文。

## 10. Pull Request 要求

PR 模板位于 [`.github/pull_request_template.md`](../.github/pull_request_template.md)，至少包含：

- 变更摘要
- 目标、验收证据、未执行检查
- 业务/框架分类
- 文档更新勾选
- 执行的验证命令
- 风险与回滚说明（如适用）

非平凡任务还应提供 [任务契约](../AGENTS.md#71-非平凡任务契约) 中定义的目标、不可变约束、自主范围、验收证据和停止条件。Reviewer 发现框架变更未带文档更新时，应直接要求补充，而不是合并后补。

## 11. 常见问题

### TS7 与 vue-tsc 版本不一致

这是有意的并存方案，不是配置错误。检查：

```bash
pnpm exec tsc --version    # 7.x
pnpm exec tsc6 --version   # 6.0.x
```

### `pnpm install` 在 Windows 失败

确认 `pnpm-workspace.yaml` 仍是 `nodeLinker: hoisted`，并使用支持的 Node 版本。

### E2E 找不到浏览器

执行 `pnpm exec playwright install chromium`，或设置 `PLAYWRIGHT_CHANNEL=msedge` 复用系统 Edge。

### 页面出现未翻译的 key

检查中英文语言包是否同时添加了该 key，并确认没有在模板中写死文案。运行 `pnpm test:e2e` 验证语言切换路径。

### `docs:check` 失败

按报错修正文档中的相对链接或缺失的关键文档；不要删除检查脚本。

## 12. 完成定义

完整清单见 [AGENTS.md](../AGENTS.md#8-完成定义definition-of-done)。最低要求：

- 功能实现符合架构边界
- 框架变更有文档和变更记录
- 文档链接检查通过
- 格式、Lint、类型、单测、构建通过
- 用户路径变更有 E2E
- 风险和限制已说明
