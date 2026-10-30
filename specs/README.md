# 功能规格索引

本目录采用轻量 Spec-Driven Development 流程，参考 Spec Kit 的工作方式，但不依赖 Spec Kit CLI 或自动生成 skill。

## 使用方式

- 流程规则：[constitution.md](./constitution.md)
- 模板目录：[_templates/](./_templates/)
- 功能目录：`specs/NNN-feature-slug/`
- 一个功能目录至少包含：`spec.md`、`plan.md`、`tasks.md`、`verification.md`
- 涉及外部接口时可增加 `contracts/api.md`；涉及复杂模型时可增加 `data-model.md`

## 状态

`Draft → Clarified → Planned → Implementing → Verified → Superseded`

已验收目录冻结为历史记录。新需求创建新编号，并在 spec 中写 `Supersedes`。

## 功能索引

| 编号 | 功能                                               | 状态     | 说明                                          |
| ---- | -------------------------------------------------- | -------- | --------------------------------------------- |
| 001  | [账号鉴权与受保护路由](./001-account-auth/spec.md) | Verified | 邮箱密码注册/登录/会话/账号设置；无第三方登录 |

## 只在这些场景使用

- 新业务模块
- API/数据模型变更
- 多页面或多角色流程
- 高不确定性需求

纯文案、样式、单组件、明确 bugfix 和依赖升级继续使用任务契约或工程文档，不创建 spec。

## 闭环

1. `spec.md` 评审通过
2. `plan.md` 评审通过
3. `tasks.md` 按 P1 切片实现
4. `verification.md` 记录验收证据
5. 有缺口则回到 tasks，直到 Verified
6. 关闭并冻结目录
