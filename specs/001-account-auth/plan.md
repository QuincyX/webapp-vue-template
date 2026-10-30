# Implementation Plan: 账号鉴权与受保护路由

- Spec: [spec.md](./spec.md)
- Status: `Verified`
- Date: `2026-10-27`

## 技术方案

采用“真实 API 契约 + 本地开发适配层”的方式：

- 前端始终通过 `src/api/auth.ts` 调用 HTTP，不感知数据存储位置。
- 开发、`vite preview` 与 E2E 由 Vite 插件 `server/auth-mock.ts` 提供最小 HTTP 鉴权服务；生产静态部署必须由真实后端实现同一契约。
- 账号状态进入 Pinia，路由守卫统一拦截；禁止页面各自判断登录。
- 登录/注册使用独立 `AuthLayout`，不再套用带侧边栏的 `DefaultLayout`。
- 现有本地个人资料 Store 由真实账号 Store 替代，避免身份双写。

## 受影响区域

| 区域     | 文件/模块                                                                  | 变更                                          |
| -------- | -------------------------------------------------------------------------- | --------------------------------------------- |
| 开发服务 | `server/auth-mock.ts`、`vite.config.ts`、`tsconfig.node.json`              | 本地鉴权 HTTP 适配层 + `/api/health`          |
| API      | `src/api/auth.ts`                                                          | 注册、登录、会话、资料、密码、退出            |
| 类型     | `src/types/auth.ts`                                                        | Zod 请求/响应/用户 Schema                     |
| 状态     | `src/stores/auth.ts`、`src/stores/pinia.ts`                                | 会话状态、bootstrap、登录/注册/退出/资料/密码 |
| 路由     | `src/router/index.ts`、`src/types/router.ts`                               | `requiresAuth`、`guestOnly`、`layout`、守卫   |
| 布局     | `src/layouts/AuthLayout.vue`、`src/App.vue`                                | 认证布局与默认布局切换                        |
| 页面     | `src/views/login/index.vue`、`src/views/register/index.vue`                | 登录/注册                                     |
| 账号设置 | `src/views/settings/index.vue`                                             | 资料、密码、退出                              |
| 现有 UI  | Header/Sidebar/Dashboard                                                   | 从真实用户获取名称/邮箱，移除本地 profile     |
| 清理     | `src/stores/preferences.ts`、`src/data/profile.ts`、`src/types/profile.ts` | 删除旧本地资料边界                            |
| i18n     | `src/i18n/messages/zh-CN.ts`、`en-US.ts`                                   | 新增 auth/route/validation 文案               |
| 测试     | `src/__tests__/auth.spec.ts`、`e2e/app.spec.ts`                            | Store 单测 + 登录/注册/守卫 E2E               |
| 文档     | `specs`、`docs`、`README`                                                  | 流程、真实 API、开发适配层与验收记录          |

## 数据与接口

### User

```ts
{
  id: string
  name: string
  email: string
}
```

### API 契约

| 方法  | 路径                 | 请求                               | 成功                   |
| ----- | -------------------- | ---------------------------------- | ---------------------- |
| POST  | `/api/auth/register` | `{ name, email, password }`        | `201 { token, user }`  |
| POST  | `/api/auth/login`    | `{ email, password }`              | `200 { token, user }`  |
| GET   | `/api/auth/me`       | Bearer token                       | `200 { user }`         |
| PATCH | `/api/auth/profile`  | `{ name }`                         | `200 { user }`         |
| PUT   | `/api/auth/password` | `{ currentPassword, newPassword }` | `204`                  |
| POST  | `/api/auth/logout`   | Bearer token                       | `204`                  |
| GET   | `/api/health`        | 无                                 | `200 { status: "ok" }` |

错误：

- `400`：字段校验失败 / 当前密码错误
- `401`：未认证 / 登录凭据错误
- `409`：邮箱已存在
- `500`：本地适配层内部错误

前端通过 `ApiError` 统一接收；登录/注册页按 HTTP 状态显示 i18n 错误。

### 本地开发适配层

- Vite 插件仅在 `vite` 开发服务器和 `vite preview` 中挂载，不进入前端 bundle。
- 用户数据写入 `.data/auth-users.json`，密码用 `scrypt` + 随机 salt 哈希。
- 会话 token 仅保存在进程内存，服务重启后需要重新登录；用户数据保留。
- 初始化演示账号：`demo@orbit.app` / `OrbitDemo123!`，仅用于本地开发/E2E。
- `.data/` 加入 Git 忽略。
- 该适配层不是生产后端，不实现限流、邮件、找回密码、审计、HttpOnly Cookie。

## 状态与交互

- Auth Store 状态：`idle | loading | authenticated | guest`。
- `bootstrap()` 在首次受保护导航前运行：
  - 无 token → guest
  - 有 token → `GET /auth/me`；401 清 token → guest
- 登录/注册成功后保存 token、user，跳转 `redirect` 或总览。
- `redirect` 只接受站内绝对路径（`/` 开头且非 `//`），防止开放重定向。
- 资料更新后立即更新侧边栏/顶栏/问候语。
- 密码修改成功后清理会话并回登录页。
- 401 全局事件统一清理会话并跳转登录，保留当前路径。

## i18n 与可访问性

- 登录/注册/账号设置/密码/错误文案全部中英文。
- 表单 label、`aria-invalid`、错误关联、密码显隐按钮 aria-label。
- 提交中禁用重复提交；错误使用 `role="alert"` 或等价 live region。
- Auth 页在移动端单列，桌面左右分栏；保留语言/主题切换。
- 输入框支持自动填充 `autocomplete`。

## 测试策略

- 单元：
  - Auth Store 登录/注册/退出/bootstrap/401
  - Zod 校验拒绝非法邮箱、短密码、空名称
- 组件：登录/注册表单校验与提交（可选，至少 E2E）
- E2E：
  - 未登录访问 `/tasks` 重定向并保留 redirect
  - 注册新账号 → 进入总览 → 刷新保持会话 → 退出 → 被拦截
  - 登录演示账号 → 现有任务创建/完成/持久化
  - 账号设置修改名称 → 刷新保留
  - 修改密码后旧密码失效
  - 中英文/主题测试在登录后执行
- 人工：移动端登录布局、键盘 Tab、错误提示。

## 宪法检查

- [x] 遵守 AGENTS 架构边界
- [x] 不重复已有工程规则
- [x] 明确非目标和范围
- [x] 有可验证的验收证据
- [x] 框架变更已列入文档任务

## 风险与回滚

| 风险                       | 处理                                            |
| -------------------------- | ----------------------------------------------- |
| 本地鉴权适配层被误用于生产 | README/架构/安全提示明确；生产必须替换 API      |
| localStorage token 不安全  | 保持示例明确标注；生产建议 HttpOnly Cookie      |
| 旧本地 profile 数据残留    | 删除 Store 与引用；旧键不再读取                 |
| 现有 E2E 全部需要登录      | 提供共享登录 helper，统一演示账号               |
| 401 登录失败触发全局跳转   | 守卫/登录页判断当前路由，仅清理会话，不循环跳转 |
| 本地 JSON 数据进入版本库   | `.data/` 加入 `.gitignore`                      |

## 文档影响

- `docs/framework-changelog.md`：账号模块框架变更
- `docs/architecture.md`：认证分层、路由守卫、开发适配层
- `docs/engineering.md`：本地鉴权 API、演示账号、生产边界
- `README.md`：功能、启动后的登录流程、演示凭据
- `AGENTS.md`：spec 使用规则、认证边界
- `specs/001-account-auth/verification.md`：验收证据

## 实施顺序

1. Spec Kit Lite 文档与工程约束
2. 本地鉴权 API + API 客户端 + Schema + Store
3. 路由守卫 + AuthLayout + 登录/注册
4. 现有页面身份切换 + 设置页账号管理
5. i18n、测试、文档、验收收敛
