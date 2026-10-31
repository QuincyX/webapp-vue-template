#!/usr/bin/env node
/**
 * 禁止“纯转发组件”：页面/组件文件不承载任何逻辑，只是导入同目录私有组件并原样渲染。
 *
 * 判定条件（全部满足才报错）：
 * 1. `<script>` 去掉 import 与注释后为空；
 * 2. `<template>` 只有一个根节点，且该节点就是导入的组件；
 * 3. 组件来自相对路径（页面/目录私有组件），而不是 `@/components` 等共享层；
 * 4. 根节点没有子节点、插槽、绑定或指令。
 *
 * 允许：页面入口为共享组件绑定页面配置、或页面自身声明状态、生命周期、路由/SEO 配置、
 * 模板结构。比如 `<AppLogo />` 这类共享层组件不在检查范围内。
 *
 * 用法：node scripts/check-components.mjs [--quiet]
 * 退出码 1 表示存在违规文件。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'

const SOURCE_ROOT = join(process.cwd(), 'src')
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git'])
const quiet = process.argv.includes('--quiet')

function walk(directory) {
  const files = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue
      files.push(...walk(path))
    } else if (entry.endsWith('.vue')) {
      files.push(path)
    }
  }
  return files
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

function scriptBody(source) {
  const match = source.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  return match ? match[1] : ''
}

function templateBody(source) {
  const match = source.match(/<template>([\s\S]*)<\/template>/i)
  return match ? match[1].trim() : ''
}

function hasOwnLogic(script) {
  const withoutImports = script
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?$/gm, '')

  return stripComments(withoutImports).trim().length > 0
}

function importedComponents(script) {
  const imports = new Map()
  const pattern = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g
  for (const match of script.matchAll(pattern)) {
    imports.set(match[1], match[2])
  }
  return imports
}

function singleRootComponent(template) {
  const selfClosing = template.match(/^<([A-Z][\w]*)\b([^<>]*?)\/?>$/s)
  const paired = template.match(/^<([A-Z][\w]*)\b([^<>]*?)>\s*<\/\1>$/s)
  const match = selfClosing ?? paired
  if (!match) return null

  const [, name, attributes = ''] = match
  const interactive = /(^|\s)(:|@|v-)/.test(attributes)

  return interactive ? null : name
}

const violations = []

for (const file of walk(SOURCE_ROOT)) {
  const source = readFileSync(file, 'utf8')
  const script = scriptBody(source)
  if (hasOwnLogic(script)) continue

  const root = singleRootComponent(templateBody(source))
  if (!root) continue

  const specifier = importedComponents(script).get(root)
  if (!specifier || !specifier.startsWith('.')) continue

  violations.push({ file: relative(process.cwd(), file), component: root, specifier })
}

if (violations.length > 0) {
  console.error('检测到纯转发组件（只导入并原样渲染另一个组件）：')
  for (const violation of violations) {
    console.error(`  - ${violation.file} 只渲染了 ${violation.component}（${violation.specifier}）`)
  }
  console.error(
    '\n请把被引用组件的实现合并进该文件，或让该文件承载自己的状态 / 模板结构 / 页面配置。',
  )
  process.exit(1)
}

if (!quiet) {
  console.log('组件检查通过：没有纯转发组件。')
}
