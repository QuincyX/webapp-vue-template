import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const requiredDocuments = [
  'AGENTS.md',
  'README.md',
  'docs/README.md',
  'docs/architecture.md',
  'docs/engineering.md',
  'docs/framework-changelog.md',
  'specs/README.md',
  'specs/constitution.md',
  'specs/_templates/spec.md',
  'specs/_templates/plan.md',
  'specs/_templates/tasks.md',
  'specs/_templates/verification.md',
  'specs/001-account-auth/spec.md',
  'specs/001-account-auth/plan.md',
  'specs/001-account-auth/tasks.md',
  'specs/001-account-auth/verification.md',
  '.github/pull_request_template.md',
]

const errors = []
let checkedLinks = 0

for (const documentPath of requiredDocuments) {
  if (!existsSync(join(root, documentPath))) {
    errors.push(`Missing required document: ${documentPath}`)
  }
}

function markdownFiles(directory) {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name)

    if (entry.isDirectory()) return markdownFiles(fullPath)
    return extname(entry.name).toLowerCase() === '.md' ? [fullPath] : []
  })
}

const documents = new Set([
  join(root, 'README.md'),
  join(root, 'AGENTS.md'),
  ...markdownFiles(join(root, 'docs')),
  ...markdownFiles(join(root, 'specs')),
  ...markdownFiles(join(root, '.github')),
])

function stripCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
}

function normalizeTarget(rawTarget) {
  let target = rawTarget.trim()

  if (target.startsWith('<')) {
    const closingBracket = target.indexOf('>')
    target = closingBracket > 0 ? target.slice(1, closingBracket) : ''
  } else {
    target = target.split(/\s+/)[0] ?? ''
  }

  target = target.replace(/^['"]|['"]$/g, '')
  if (!target || target.startsWith('#')) return null
  if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(target)) return null
  if (target.startsWith('//')) return null

  try {
    target = decodeURIComponent(target)
  } catch {
    // Keep the original target so the existence check reports the problem.
  }

  return target.split(/[?#]/)[0] || null
}

for (const documentPath of documents) {
  if (!existsSync(documentPath)) continue

  const content = stripCodeBlocks(readFileSync(documentPath, 'utf8'))
  const linkPatterns = [/!?\[[^\]]*\]\(([^)\n]+)\)/g, /\b(?:src|href)=["']([^"']+)["']/g]
  const targets = new Set()

  for (const pattern of linkPatterns) {
    for (const match of content.matchAll(pattern)) {
      const rawTarget = match[1]
      if (!rawTarget) continue

      const target = normalizeTarget(rawTarget)
      if (target) targets.add(target)
    }
  }

  for (const target of targets) {
    checkedLinks += 1
    const resolvedTarget = target.startsWith('/')
      ? join(root, target)
      : resolve(dirname(documentPath), target)

    if (!existsSync(resolvedTarget)) {
      errors.push(`Broken relative link in ${relative(root, documentPath)}: ${target}`)
    }
  }
}

if (errors.length > 0) {
  console.error('Documentation check failed:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(`Documentation check passed: ${documents.size} files, ${checkedLinks} relative links.`)
