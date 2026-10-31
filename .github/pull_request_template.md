## 变更摘要

<!-- 说明改了什么，以及为什么。 -->

## 目标与验收

- 目标：
- 功能规格目录（如适用）：
- 验收证据（命令、测试结果或可复现行为）：
- 未执行的检查及原因：
- [ ] 非平凡任务已写清目标、不可变约束、自主范围、验收证据和停止条件
- [ ] 非平凡功能已更新 `specs/NNN-*/verification.md`，状态为 `Verified`

## 变更类型

- [ ] 业务变更：仅涉及示例任务领域或文案
- [ ] 框架变更：依赖、构建、路由、状态、API、i18n、主题、共享 UI、环境变量、CI、部署、Agent 规则等
- [ ] 混合变更（按框架变更处理）

## 页面结构

- [ ] 新页面使用 `src/views/<page>/index.vue`
- [ ] 页面私有模块只被当前页面目录引用，无跨页面导入
- [ ] 跨页面复用已提升到共享层（components/composables/stores/types/utils/api）
- [ ] 页面入口不是纯转发组件（`pnpm check:components`，已并入 `pnpm lint`）

## 文档更新

- [ ] 业务变更：已确认 README / 截图仍然准确（如适用）
- [ ] 框架变更：已更新 `docs/framework-changelog.md`
- [ ] 框架变更：已按 `AGENTS.md` 的文档矩阵更新受影响的架构/工程/README/AGENTS 文档
- [ ] Agent 规则变更：已通过准入检查，并按规则生命周期做过验证（如适用）
- [ ] 文档链接检查通过（`pnpm docs:check`）

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm type-check`
- [ ] `pnpm test:unit:run`
- [ ] `pnpm build`
- [ ] `bash deploy/build.sh --skip-install`（涉及构建/发布脚本或 `vite.config.ts` 时）
- [ ] `pnpm test:e2e`（涉及交互、路由、主题、语言或持久化时）
- [ ] 其他：

## 风险与回滚

<!-- 兼容性、迁移、发布顺序、回滚方式；无风险可写“无”。 -->

## 截图（如适用）

<!-- UI 变更请附前后对比或最终状态。 -->
