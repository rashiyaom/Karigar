import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const API_ROOT = path.join(process.cwd(), 'app', 'api')

function walkTsFiles(dir: string): string[] {
  const items = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      files.push(...walkTsFiles(fullPath))
      continue
    }

    if (item.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

describe('CSRF and write-route hardening coverage', () => {
  it('ensures write routes use shared guard or explicit CSRF middleware', () => {
    const writeRoutePattern = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/g
    const guardedPattern = /guardWriteRequest|verifyCsrfMiddleware/

    // Public auth endpoints do not require CSRF prior to session establishment.
    const allowedWithoutCsrf = new Set([
      path.join(API_ROOT, 'auth', 'login', 'route.ts'),
      path.join(API_ROOT, 'auth', 'register', 'route.ts'),
    ])

    const violations: string[] = []

    for (const filePath of walkTsFiles(API_ROOT)) {
      const source = fs.readFileSync(filePath, 'utf8')
      if (!writeRoutePattern.test(source)) {
        continue
      }

      if (allowedWithoutCsrf.has(filePath)) {
        continue
      }

      if (!guardedPattern.test(source)) {
        violations.push(path.relative(process.cwd(), filePath))
      }
    }

    expect(violations, `Write routes missing CSRF guard: ${violations.join(', ')}`).toEqual([])
  })
})
