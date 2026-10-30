# Tasks: 账号鉴权与受保护路由

- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Status: `Verified`

## Phase 1: Spec 与工程约束

- [x] T001 [US0] 新增 `specs/constitution.md`、`specs/README.md` 与四个模板
- [x] T002 [US0] 新增 `specs/001-account-auth/spec.md`、`plan.md`、`tasks.md`
- [x] T003 [US0] 更新 `AGENTS.md` 的 spec 使用规则与上下文路由
- [x] T004 [US0] 更新 `docs/README.md`、`docs/engineering.md` 的规格流程与事实归属
- [x] T005 [US0] 扩展 `scripts/check-docs.mjs` 覆盖 `specs/**/*.md`
- [x] T006 [US0] 更新 PR 模板，加入 spec/verification 链接与验收证据

## Phase 2: Foundation

- [x] T007 [US1] `server/auth-mock.ts`：本地注册/登录/me/资料/密码/退出/health HTTP 适配层
- [x] T008 [US1] `vite.config.ts` + `tsconfig.node.json`：挂载本地鉴权适配层
- [x] T009 [US1] `.gitignore`：忽略 `.data/`
- [x] T010 [US1] `src/types/auth.ts`：Zod 请求、响应、用户 Schema
- [x] T011 [US1] `src/api/auth.ts`：六类鉴权请求
- [x] T012 [US1] `src/stores/pinia.ts`、`src/stores/auth.ts`：Auth Store 与 bootstrap
- [x] T013 [US1] `src/main.ts`：Pinia 单例、401 事件监听
- [x] T014 [US1] `src/types/router.ts`、`src/router/index.ts`、`src/App.vue`：路由 meta、守卫、布局切换

## Phase 3: User Story 1 - 注册并登录（P1）

- [x] T015 [US1] `src/layouts/AuthLayout.vue`：认证页应用壳
- [x] T016 [US1] `src/views/login/index.vue`：邮箱密码登录、错误、密码显隐、redirect
- [x] T017 [US1] `src/views/register/index.vue`：昵称/邮箱/密码/确认密码
- [x] T018 [P] [US1] `src/i18n/messages/zh-CN.ts` + `en-US.ts`：auth 文案与校验
- [x] T019 [US1] 更新现有 Header/Sidebar/Dashboard 使用真实账号

## Phase 4: User Story 2 - 受保护访问与退出（P1）

- [x] T020 [US2] 路由守卫：未登录重定向、guestOnly、会话恢复
- [x] T021 [US2] 设置页退出登录与会话清理
- [x] T022 [US2] 401 未授权事件与统一跳转

## Phase 5: User Story 3 - 账号资料与密码（P2）

- [x] T023 [US3] 设置页账号资料：名称编辑、邮箱只读、保存
- [x] T024 [US3] 设置页修改密码：校验、错误、成功后退出
- [x] T025 [US3] 清理 `src/stores/preferences.ts`、`src/data/profile.ts`、`src/types/profile.ts` 及引用

## Phase 6: Tests

- [x] T026 [US1] `src/__tests__/auth.spec.ts`：Schema、Store、token/session、401
- [x] T027 [US1] `e2e/app.spec.ts`：共享登录 helper，更新全部既有用例
- [x] T028 [US1] E2E：未登录守卫、注册、刷新、退出、资料、密码
- [x] T029 [US?] 运行 unit / E2E 并修复

## Phase 7: Verification 与文档

- [x] T030 [US0] `verification.md`：逐条验收、命令、证据、gaps
- [x] T031 [US0] `docs/framework-changelog.md`：账号模块与 Spec Kit Lite 记录
- [x] T032 [US0] `README.md`、`docs/architecture.md`、`docs/engineering.md`：功能、开发适配层、生产边界
- [x] T033 [US0] 运行 docs:check / format / lint / type-check / unit / build / E2E
- [x] T034 [US0] 将 spec 状态更新为 `Verified`，冻结目录
