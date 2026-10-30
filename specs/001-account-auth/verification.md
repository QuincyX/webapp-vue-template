# Verification: 账号鉴权与受保护路由

- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Status: `Verified`
- Date: `2026-10-27`

## 验收结果

| 验收场景             | 结果 | 证据                                                         |
| -------------------- | ---- | ------------------------------------------------------------ |
| US1 注册并进入工作台 | ✅   | E2E「registers an account…」；注册后跳转 `/` 并显示账号名称  |
| US1 登录与错误凭据   | ✅   | E2E 演示账号登录；错误密码显示「邮箱或密码不正确，请重试。」 |
| US1 刷新后保持会话   | ✅   | E2E 注册/登录后 reload 仍停留在业务页                        |
| US2 未登录拦截与回跳 | ✅   | E2E `/tasks` → `/login?redirect=/tasks` → 登录后回 `/tasks`  |
| US2 退出后无法访问   | ✅   | E2E 退出后访问 `/settings` 再次被拦截                        |
| US2 401 统一处理     | ✅   | Auth Store 单测 + Axios 401 单测 + `main.ts` 事件处理        |
| US3 修改显示名称     | ✅   | E2E 设置页保存名称，刷新后侧边栏/顶栏仍显示新名称            |
| US3 修改密码         | ✅   | E2E 旧密码失效、新密码可登录；修改后当前会话退出             |
| i18n 双语言          | ✅   | 登录/注册/账号设置文案同时更新；E2E 语言切换通过             |
| 现有任务功能保持可用 | ✅   | 任务创建、完成、刷新持久化 E2E 通过                          |

## 命令与结果

```text
pnpm docs:check      17 files, 119 relative links，通过
pnpm format:check    All matched files use Prettier code style
pnpm lint            0 warnings / 0 errors
pnpm type-check      通过（tsc 7 app/node + vue-tsc）
pnpm test:unit:run   5 files / 29 tests passed
pnpm build           通过；服务端适配层未进入前端 bundle
pnpm test:e2e        8 tests passed（PLAYWRIGHT_CHANNEL=msedge）
```

E2E 覆盖：

1. 总览与主导航
2. 任务创建、完成、刷新持久化
3. 主题持久化
4. 中英文切换与持久化
5. 未登录拦截与登录回跳
6. 注册、刷新会话、资料修改、退出
7. 修改密码、旧凭据被拒绝、新凭据登录
8. 移动端抽屉导航

人工检查：登录页桌面布局、账号设置页、移动端总览截图。

## 未覆盖范围

- 生产鉴权后端、数据库、邮件验证、找回密码、MFA
- 第三方登录
- HttpOnly Cookie + CSRF 的生产部署
- 账号注销、团队/角色权限
- 多设备任务同步

## 文档更新

- [x] `docs/framework-changelog.md`
- [x] `README.md`
- [x] `docs/architecture.md`
- [x] `docs/engineering.md`
- [x] 中英文 i18n
- [x] `specs/README.md` 状态与索引

## 遗留缺口

无阻塞缺口。生产化前必须替换本地鉴权适配层，并重新评估 Cookie/CSRF、限流、审计与邮件能力。

## 结论

- [x] Verified
- [ ] Partial
- [ ] Failed

## 收敛记录

1. 初次 E2E 全部失败：登录页没有渲染。
   - 原因：`you@example.com` 被 vue-i18n 当作 linked message 语法解析。
   - 修复：占位符改为 `you{'@'}example.com`，增加日志检查。
2. 两个 E2E 的 redirect 断言失败。
   - 原因：Vue Router 输出 `redirect=/tasks`，不是百分号编码。
   - 修复：断言接受两种等价形式。
3. 全量 E2E 通过；单元测试、类型检查、Lint、构建、文档检查全部通过。
