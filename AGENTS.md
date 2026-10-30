# Agent 工程指南

本文件适用于所有在 `vue-vite-starter` 目录内工作的 AI Agent、自动化脚本维护者和代码审查者。它是本项目的协作契约，不是建议清单。

## 1. 指令优先级与上下文路由

1. 用户当前的明确指令。
2. 本文件。
3. [docs/architecture.md](./docs/architecture.md) 与 [docs/engineering.md](./docs/engineering.md) 中与当前任务相关的部分。
4. 其他文档与历史实现。

DSH 会自动加载本文件；其他不自动加载仓库指令的工具，开始工作前必须先读本文件。不要一次性读取全部文档，先按任务类型路由。

### 1.1 始终遵守

- 本文件的规则与边界。
- 当前工作区未被覆盖的现状。
- 用户明确限制的范围和交付方式。

### 1.2 按任务读取

| 任务类型                         | 读取范围                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent 规则 / 文档治理            | 本文件 + [docs/README.md](./docs/README.md) + [docs/framework-changelog.md](./docs/framework-changelog.md)                                                               |
| 功能 / 业务模块                  | [specs/README.md](./specs/README.md) + 目标 feature 的 `spec.md` / `plan.md` / `tasks.md` + 相关源码与测试                                                               |
| 页面、组件、i18n 文案            | 相关 view/component + `src/i18n/messages/zh-CN.ts` + `en-US.ts`；用户可见行为变化时再看 README                                                                           |
| 状态、持久化、API                | [architecture.md 的状态/数据流章节](./docs/architecture.md#5-状态与数据所有权) + [engineering.md 的数据边界章节](./docs/engineering.md#63-状态与持久化) + 目标代码和测试 |
| 依赖、构建、TypeScript、CI、脚本 | [engineering.md 的环境/命令/依赖/CI 章节](./docs/engineering.md) + `package.json` + 框架变更记录                                                                         |
| 部署、静态托管                   | [engineering.md 的 CI 与部署章节](./docs/engineering.md#9-ci-与部署) + `deploy/` + README 部署段                                                                         |
| 纯任务业务改动                   | 目标 view/component/store + 相关测试；不强制阅读架构文档                                                                                                                 |
| 不确定需要哪些上下文             | 先看 [docs/README.md](./docs/README.md) 的索引，再读目标章节                                                                                                             |

多领域任务取并集，不要退化为“全部读一遍”。如果文档与代码不一致，以当前代码行为为事实，但必须在本次变更中修正文档或记录为已知差异。不能默许文档失效。

## 2. 项目定位

这是一个**通用 Vue 3 + Vite + TypeScript 工程模板**，不是某个具体产品的代码仓库。

- 任务工作台是用于展示工程能力的业务示例，不是产品需求的边界。
- 不要擅自引入兄弟目录 `../aiv_unity` 的业务概念（认证、模板、生成任务、积分、支付、PWA 等）；已确认的 [001 账号模块](./specs/001-account-auth/spec.md) 是本项目例外，后续扩展仍需用户明确要求。
- 不要把 starter 改造成一个重业务产品；除非用户明确要求。
- 新增能力优先沉淀为可复用的框架能力，而不是某个页面的临时补丁。

## 3. 最高优先级：框架变更必须更新文档

**任何非业务层的框架功能变更，都必须在同一次变更中更新文档。没有更新文档的框架变更是未完成变更，不得声称已完成。**

框架变更指包括但不限于：

- 依赖、Node/pnpm、TypeScript、Vite、构建、Lint、格式化、测试工具
- 路由架构、状态架构、API 客户端、拦截器、错误模型
- i18n、主题、全局样式、Design Token、共享布局/UI 组件
- 环境变量、配置校验、部署、CI、开发脚本
- Agent 协作规则、工程约束、文档治理规则
- 公共类型、Schema 约定、目录边界

业务变更指仅影响示例任务领域的内容，例如任务字段、示例任务文案、任务页面交互。业务变更不强制写框架变更记录，但影响最终用户时必须检查 README 是否仍准确。

### 3.1 强制文档更新矩阵

| 变更内容                                                   | 必须更新                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 分层、模块边界、数据流、路由/状态/API 架构                 | `docs/architecture.md` + `docs/framework-changelog.md`                               |
| 脚本、依赖、TypeScript、构建、测试、CI、环境变量、发布流程 | `docs/engineering.md` + `README.md`（涉及使用方式时）+ `docs/framework-changelog.md` |
| Agent 规则、完成定义、文档治理                             | `AGENTS.md` + `docs/engineering.md` + `docs/framework-changelog.md`                  |
| 全局用户可见的框架行为（主题、语言、导航等）               | `README.md` + 对应说明文档 + `docs/framework-changelog.md`                           |
| 仅示例任务业务内容                                         | README（仅当功能/截图失效时）                                                        |
| 文档链接/目录调整                                          | `docs/README.md` / `README.md` + `docs/framework-changelog.md`                       |
| 事实归属或去重调整                                         | `docs/README.md` + 受影响的来源文档 + `docs/framework-changelog.md`                  |

框架变更记录的格式与历史示例见 [docs/framework-changelog.md](./docs/framework-changelog.md)。记录采用追加方式，不重写历史。

### 3.2 变更分类流程

编辑前先写出判断：

- 这是业务变更还是框架变更？如果是混合变更，按框架变更处理。
- 哪些文档会因为行为、命令、目录或约束变化而失效？
- 验证命令是否变化？如果变化，必须同步 `docs/engineering.md` 和 `README.md`。

### 3.3 全局规则准入

`AGENTS.md` 是全局路由与契约，不是操作手册。新增一条全局规则前，必须至少满足一项：

1. 它是模型无法凭空推断的**项目事实**（命令、目录、发布约定、技术栈约束）。
2. 它是必须确定执行的**风险边界**（安全、数据、权限、生产操作）。
3. 它有**真实失败样本、回归记录或明确审计结论**作为证据。

同时必须满足：

- 写成“触发条件 → 动作/边界 → 验证方式”，不使用无条件的 `ALWAYS` / `NEVER`；确定性的安全/数据边界和文档硬约束除外，且必须写明适用范围。
- 范围具体；不使用“处理数据库、查询、模型或持久化时”这类过宽的领域词。
- 不与 DSH 已覆盖的能力、README 用户说明或其他工程文档重复。
- 不依赖某个模型的临时能力、偏好或“强模型会自动做对”的假设。
- 能通过命令、测试、Schema 或 Review 验证。

**禁止写入：**

- “认真思考”“不要犯错”“始终自检”“完成前反复测试”等泛化行为要求。
- “每次修改额外文件前询问”“每个任务固定十步流程”等仪式化流程。
- DSH 已覆盖的工具使用规则：读写顺序、搜索、计划/todo、命令审批、沙箱、后台任务、失败退出码处理和文件展示。
- 仅为了弥补旧模型缺陷、但没有当前失败证据的防御性规则。

详细流程放 `docs/`，`AGENTS.md` 只保留路由、边界和完成标准。

### 3.4 规则生命周期

全局规则会持续占用所有任务的上下文，必须像依赖一样维护：

- 每次模型、DSH、TypeScript、Vite 或测试工具升级后，审计一次规则。
- 至少每季度审计一次。
- 用小型修改、常规功能、跨文件/架构改动三类真实任务对照：成功率、返工、人工打断、上下文成本。
- 删除无证据、重复、冲突、过宽或已被 DSH/文档覆盖的规则；保留项目事实、风险边界和真实失败经验。
- 规则变更必须写入 [框架变更记录](./docs/framework-changelog.md)。

完整审计方法见 [docs/engineering.md 的 Agent 规则生命周期](./docs/engineering.md#agent-规则生命周期与审计)。

## 4. 架构红线

修改必须遵守 [docs/architecture.md](./docs/architecture.md) 中的职责边界，至少包括：

1. **视图不直接请求后端**。HTTP 访问只能通过 `src/api/`。
2. **API 响应必须经过 Zod 校验**，禁止把 `unknown` 直接断言为业务类型。
3. **组件/页面不直接读写业务 `localStorage`**。持久化属于 Store、`src/api/token.ts`、i18n 或主题模块。
4. **所有界面文案走 i18n**。修改文案必须同时更新 `src/i18n/messages/zh-CN.ts` 与 `en-US.ts`；不允许只改其中一种语言。
5. **路由必须保留 `meta.titleKey`**，页面组件默认使用懒加载。
6. **共享 UI 使用设计 Token 与既有组件模式**，不要在共享组件中硬编码品牌色或一次性样式。
7. **公共类型/数据边界优先复用 `src/types/` 的 Zod Schema**，避免为同一结构复制多份类型。
8. **不得引入第二套同类基础库**（第二个 HTTP 客户端、第二套状态库、第二套 i18n 库等），除非有明确理由并记录到框架变更记录。
9. **页面目录边界**。新建页面必须创建 `src/views/<page>/index.vue`，目录名对应页面地址：`/foo` → `src/views/foo/index.vue`，根路径 `/` 使用 `src/views/home/index.vue`，404 使用 `src/views/not-found/index.vue`。页面私有的 Vue 子组件、composables、数据、类型和页面专用资源必须放在该页面目录内（可继续分子目录），且只能被该页面目录引用；禁止从其他页面目录导入。跨页面复用的代码必须先提升到 `src/components/`、`src/composables/`、`src/stores/`、`src/types/` 或 `src/utils/` 等共享层，再被多个页面引用。路由只允许引用页面的 `index.vue`，不得新增 `src/views/FooView.vue` 这类平铺页面文件。

## 5. 工具链约束

### TypeScript

- 本项目的实际编译器版本必须保持 `pnpm exec tsc --version` 为 **7.x**。
- 兼容层 `typescript`（`@typescript/typescript6`）只用于 `vue-tsc` 与 `typescript-eslint` 尚依赖的 Compiler API，**不能把它当作应用编译器**。
- 禁止随意删除 `@typescript/native`、`typescript` 别名、`types/vue-shim.d.ts` 或 `tsconfig.typecheck.json`。调整该方案必须更新架构、工程说明和变更记录。
- 不允许用 `@ts-ignore`、`any` 或关闭 strict 来绕过类型问题；必要时用 `unknown` + Schema 收窄。

### 包管理

- 使用 pnpm；禁止提交 `package-lock.json`、`yarn.lock` 或 npm/yarn 生成的锁文件。
- 依赖变更通过 `pnpm add` / `pnpm remove` 完成，并提交更新后的 `pnpm-lock.yaml`。
- 保持 `pnpm-workspace.yaml` 的 `nodeLinker: hoisted`，除非在 Windows 与 CI 上重新验证。
- 不允许无理由升级大版本；升级后更新工程说明、README 兼容性描述和框架变更记录。

## 6. 安全与合规

- 只有 `VITE_` 前缀变量可以进入客户端；禁止把密钥、私钥、支付密钥写入任何前端环境变量。
- 不得引入 `v-html` 渲染不可信内容；本模板默认不使用 `v-html`。
- 当前演示把 access token 放在 `localStorage`，这是工程示例的取舍。生产接入时应改为 HttpOnly Cookie 或等价的更安全方案，并在文档中说明。
- 支付、认证、上传等能力若接入，必须复用统一 API 层，并补充幂等、超时、取消、错误归一化与测试。
- 不在日志中输出 token、Cookie、完整请求体或个人信息。

## 7. 工作流程

### 7.1 非平凡任务契约

以下任务开始前，先在任务描述、执行计划或 PR 中写清契约：

- 涉及多个文件或模块
- 框架/基础设施变更
- API、状态、持久化、权限、安全或性能变更
- 预计需要超过一次验证循环

契约包含：

```text
目标：要解决的具体问题，不写操作步骤。
不可变约束：现有接口、数据、交互、兼容性和禁止改动的范围。
可自主执行：允许读取、编辑、运行本地检查、修复本次改动引入的失败的范围。
验收证据：看到什么命令输出、测试结果或行为，才算完成。
停止条件：哪些情况必须停下来询问，例如生产变更、破坏性数据操作、凭据、跨项目改动。
```

契约定义结果和边界，不规定“先分析再列计划、每步汇报”的操作仪式。小改动（拼写、链接、单个文案、明确的单行修复）不需要填写完整契约。

### 7.2 执行流程

1. **检查现状**：读取与任务相关的源码、测试、文档；查看工作区是否有用户未提交的改动，不要覆盖。
2. **分类变更**：按第 3 节判断业务/框架，列出必须更新的文档。
3. **最小实现**：只改与任务直接相关的文件，不做顺手的无关重构。
4. **同步文档**：框架变更在同一变更中完成文档更新。
5. **执行验证**：至少运行与改动相关的检查；框架变更必须运行完整质量门禁。
6. **报告结果**：说明改了什么、文档更新了哪些、执行了哪些命令、还有哪些限制；未执行的检查必须明确说明。

### 7.3 功能规格（Spec Kit Lite）

非平凡业务功能按 [specs/constitution.md](./specs/constitution.md) 执行。规范层级：

```text
用户指令 → AGENTS + docs → specs/constitution.md → spec.md → plan.md → tasks.md → verification.md
```

- 先用 [specs/README.md](./specs/README.md) 判断是否值得写 spec。
- `spec.md` 只写 What / Why；技术方案写入 `plan.md`。
- `specs/NNN-slug/tasks.md` 是跨会话任务源；当前会话 todo 只是执行镜像。
- 已完成 feature 目录冻结；新需求新建编号并使用 `Supersedes`。
- 纯文案、样式、单组件、明确 bugfix 和工具链升级不创建 spec。
- 不要求安装 Spec Kit CLI，也不要求每个任务运行完整 `/speckit-*` 流程。

### 不要做

- 不要修改 `../aiv_unity` 或工作区中与本项目无关的目录。
- 不要提交 `node_modules/`、`dist/`、`coverage/`、`playwright-report/` 或缓存文件。
- 不要为了让检查通过而删除测试、放宽规则或加入无依据的忽略项。
- 不要在没有用户要求时启动长期开发服务器；需要浏览器验证时优先使用 `pnpm test:e2e` 自动管理的服务器。
- 不要在没有用户要求时执行 git commit、push 或改写历史。
- 不要把“文档稍后补”当作可接受的交付状态。

## 8. 完成定义（Definition of Done）

框架变更只有在以下全部满足时才算完成：

- [ ] 功能实现符合架构边界与工程约束
- [ ] 同一次变更中更新了 `docs/framework-changelog.md`
- [ ] 按矩阵更新了受影响的架构/工程/README/AGENTS 文档
- [ ] `pnpm docs:check` 通过
- [ ] `pnpm format:check` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test:unit:run` 通过
- [ ] `pnpm build` 通过
- [ ] 涉及交互/路由/主题/语言时，`pnpm test:e2e` 通过
- [ ] 非平凡业务功能有 spec/plan/tasks，且 `verification.md` 为 `Verified`
- [ ] 非平凡任务有明确的验收证据
- [ ] 未执行的检查、剩余风险和未覆盖范围已说明
- [ ] 没有未说明的兼容性、迁移或回滚风险

业务变更至少要通过格式、Lint、类型检查和对应单元/组件测试；影响用户操作时补充 E2E。

## 9. 命令来源

完整命令、参数、CI 状态和故障处理只维护在 [docs/engineering.md](./docs/engineering.md#3-命令) 与 [完整质量门禁](./docs/engineering.md#4-完整质量门禁)。本文只保留完成定义所需的检查项，不重复维护命令说明。

项目事实以文档归属表为准：[docs/README.md](./docs/README.md#事实归属)。
