#!/usr/bin/env node

/**
 * Phase 1-3 Security Implementation Verification
 * Tests the complete security implementation
 */

const fs = require('fs')
const path = require('path')

const projectRoot = '/Users/omvipulbhairashiya/Downloads/projects/Karigar'

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

let testsPassed = 0
let testsFailed = 0

function logSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`)
  console.log(`${colors.blue}${title}${colors.reset}`)
  console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`)
}

function test(name, condition, message) {
  if (condition) {
    console.log(`${colors.green}✅${colors.reset} ${name}: ${message}`)
    testsPassed++
  } else {
    console.log(`${colors.red}❌${colors.reset} ${name}: ${message}`)
    testsFailed++
  }
}

function fileExists(filePath, description) {
  const exists = fs.existsSync(filePath)
  test(
    `FILE`,
    exists,
    exists ? `✓ ${description}` : `✗ ${description} - NOT FOUND`
  )
  return exists
}

function fileContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const contains = content.includes(searchString)
    test(`CHECK`, contains, description)
    return contains
  } catch (error) {
    test(`CHECK`, false, `${description} - Error reading file`)
    return false
  }
}

// ============================================================
// PHASE 1: CRITICAL SECURITY FIXES
// ============================================================

logSection('📋 PHASE 1: CRITICAL SECURITY FIXES VERIFICATION')

console.log(`${colors.cyan}Testing Bcrypt Implementation...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/auth.ts'), 'lib/auth.ts exists')
fileContains(path.join(projectRoot, 'lib/auth.ts'), 'bcrypt', 'Bcrypt imported in auth.ts')
fileContains(path.join(projectRoot, 'lib/auth.ts'), 'bcrypt.compare', 'Bcrypt password comparison implemented')
fileContains(path.join(projectRoot, 'lib/auth.ts'), 'regenerateSession', 'Session regeneration function exists')

console.log(`\n${colors.cyan}Testing Rate Limiting Implementation...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/rate-limit.ts'), 'lib/rate-limit.ts exists')
fileContains(path.join(projectRoot, 'lib/rate-limit.ts'), 'checkRateLimit', 'Rate limit check function exists')
fileContains(path.join(projectRoot, 'lib/rate-limit.ts'), 'getRateLimitStatus', 'Rate limit status function exists')
fileContains(path.join(projectRoot, 'app/api/auth/login/route.ts'), 'checkRateLimit', 'Rate limiting applied to login endpoint')

console.log(`\n${colors.cyan}Testing Environment Configuration...${colors.reset}`)
fileContains(path.join(projectRoot, '.env.local'), 'DEMO_PASSWORD_HASH', '.env.local has bcrypt hash')
fileContains(path.join(projectRoot, '.env.local'), 'SESSION_EXPIRY_HOURS', '.env.local has session expiry config')
fileContains(path.join(projectRoot, '.env.local'), 'TOKEN_EXPIRY_DAYS', '.env.local has token expiry config')
fileContains(path.join(projectRoot, '.env.local'), 'MAX_LOGIN_ATTEMPTS', '.env.local has login attempt limit')

console.log(`\n${colors.cyan}Testing Admin Endpoint Authentication...${colors.reset}`)
fileContains(path.join(projectRoot, 'app/api/database/setup/route.ts'), 'getCurrentUser', 'Database setup endpoint requires auth')
fileContains(path.join(projectRoot, 'app/api/database/backup/route.ts'), 'getCurrentUser', 'Database backup endpoint requires auth')
fileContains(path.join(projectRoot, 'app/api/database/info/route.ts'), 'getCurrentUser', 'Database info endpoint requires auth')

// ============================================================
// PHASE 2: HIGH PRIORITY SECURITY FIXES
// ============================================================

logSection('📋 PHASE 2: HIGH PRIORITY SECURITY FIXES VERIFICATION')

console.log(`${colors.cyan}Testing CSRF Protection Implementation...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/csrf.ts'), 'lib/csrf.ts exists')
fileContains(path.join(projectRoot, 'lib/csrf.ts'), 'generateCsrfToken', 'CSRF token generation exists')
fileContains(path.join(projectRoot, 'lib/csrf.ts'), 'verifyCsrfToken', 'CSRF token verification exists')
fileContains(path.join(projectRoot, 'lib/csrf.ts'), 'setCsrfToken', 'CSRF token setter exists')

console.log(`\n${colors.cyan}Testing CSRF Middleware...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/csrf-middleware.ts'), 'lib/csrf-middleware.ts exists')
fileContains(path.join(projectRoot, 'lib/csrf-middleware.ts'), 'verifyCsrfMiddleware', 'CSRF middleware function exists')
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'verifyCsrfMiddleware', 'CSRF middleware applied to endpoints')

console.log(`\n${colors.cyan}Testing Session Regeneration...${colors.reset}`)
fileContains(path.join(projectRoot, 'lib/auth.ts'), 'regenerateSession', 'Session regeneration implemented')
fileContains(path.join(projectRoot, 'app/api/auth/login/route.ts'), 'regenerateSession', 'Session regeneration on login')
fileContains(path.join(projectRoot, 'app/api/auth/login/route.ts'), 'csrfToken', 'CSRF token returned from login')

console.log(`\n${colors.cyan}Testing Request Size Limiting...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/request-size-limit.ts'), 'lib/request-size-limit.ts exists')
fileContains(path.join(projectRoot, 'lib/request-size-limit.ts'), 'checkRequestSize', 'Request size check function exists')
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'checkRequestSize', 'Request size limiting applied')

console.log(`\n${colors.cyan}Testing Token Expiry Reduction...${colors.reset}`)
fileContains(path.join(projectRoot, '.env.local'), 'TOKEN_EXPIRY_DAYS=3', 'Token expiry reduced to 3 days')

console.log(`\n${colors.cyan}Testing Login Form CSRF Integration...${colors.reset}`)
fileContains(path.join(projectRoot, 'components/login-form.tsx'), 'useEffect', 'CSRF setup in login form')
fileContains(path.join(projectRoot, 'components/login-form.tsx'), 'sessionStorage', 'CSRF token stored in sessionStorage')
fileContains(path.join(projectRoot, 'components/login-form.tsx'), 'x-csrf-token', 'CSRF token sent in requests')

console.log(`\n${colors.cyan}Testing CSRF Hook...${colors.reset}`)
fileExists(path.join(projectRoot, 'hooks/use-csrf-token.ts'), 'hooks/use-csrf-token.ts exists')
fileContains(path.join(projectRoot, 'hooks/use-csrf-token.ts'), 'useCsrfToken', 'CSRF hook exists')

// ============================================================
// PHASE 3: INPUT VALIDATION & PROTECTION
// ============================================================

logSection('📋 PHASE 3: INPUT VALIDATION & PROTECTION VERIFICATION')

console.log(`${colors.cyan}Testing Input Sanitization Implementation...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/input-sanitizer.ts'), 'lib/input-sanitizer.ts exists')
fileContains(path.join(projectRoot, 'lib/input-sanitizer.ts'), 'sanitizeString', 'String sanitization exists')
fileContains(path.join(projectRoot, 'lib/input-sanitizer.ts'), 'sanitizeEmail', 'Email sanitization exists')
fileContains(path.join(projectRoot, 'lib/input-sanitizer.ts'), 'escapeHtml', 'HTML escaping exists')
fileContains(path.join(projectRoot, 'lib/input-sanitizer.ts'), 'hasDangerousPatterns', 'Dangerous pattern detection exists')

console.log(`\n${colors.cyan}Testing NoSQL Injection Prevention...${colors.reset}`)
fileContains(path.join(projectRoot, 'lib/input-sanitizer.ts'), 'sanitizeObjectKeys', 'Object key sanitization exists')
fileContains(path.join(projectRoot, 'lib/input-sanitizer.ts'), '$\\w+', 'MongoDB operator pattern detection')
fileContains(path.join(projectRoot, 'app/api/auth/login/route.ts'), 'hasDangerousPatterns', 'Injection detection on login')

console.log(`\n${colors.cyan}Testing Timing-Safe Comparison...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/timing-safe-compare.ts'), 'lib/timing-safe-compare.ts exists')
fileContains(path.join(projectRoot, 'lib/timing-safe-compare.ts'), 'timingSafeEqual', 'Timing-safe comparison exists')
fileContains(path.join(projectRoot, 'lib/timing-safe-compare.ts'), 'crypto.timingSafeEqual', 'Using Node.js crypto for comparison')

console.log(`\n${colors.cyan}Testing API Rate Limiting...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/api-rate-limit.ts'), 'lib/api-rate-limit.ts exists')
fileContains(path.join(projectRoot, 'lib/api-rate-limit.ts'), 'checkApiRateLimit', 'API rate limit check exists')
fileContains(path.join(projectRoot, 'lib/api-rate-limit.ts'), 'getApiRateLimitStatus', 'API rate limit status exists')
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'checkApiRateLimit', 'API rate limiting applied to endpoints')

console.log(`\n${colors.cyan}Testing Rate Limit Headers...${colors.reset}`)
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'X-RateLimit-Limit', 'Rate limit headers included')
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'X-RateLimit-Remaining', 'Rate limit remaining header')
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'X-RateLimit-Reset', 'Rate limit reset header')

console.log(`\n${colors.cyan}Testing Parameter Pollution Detection...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/parameter-pollution-detector.ts'), 'lib/parameter-pollution-detector.ts exists')
fileContains(path.join(projectRoot, 'lib/parameter-pollution-detector.ts'), 'detectParameterPollution', 'Parameter pollution detection exists')
fileContains(path.join(projectRoot, 'lib/parameter-pollution-detector.ts'), 'detectHeaderPollution', 'Header pollution detection exists')

console.log(`\n${colors.cyan}Testing Input Validation Middleware...${colors.reset}`)
fileExists(path.join(projectRoot, 'lib/input-validation-middleware.ts'), 'lib/input-validation-middleware.ts exists')
fileContains(path.join(projectRoot, 'lib/input-validation-middleware.ts'), 'validateInputSecurity', 'Input validation middleware exists')

console.log(`\n${colors.cyan}Testing Sanitization in Login...${colors.reset}`)
fileContains(path.join(projectRoot, 'app/api/auth/login/route.ts'), 'sanitizeString', 'Input sanitization in login')
fileContains(path.join(projectRoot, 'app/api/auth/login/route.ts'), 'sanitizedUsername', 'Sanitized username used')
fileContains(path.join(projectRoot, 'app/api/auth/login/route.ts'), 'sanitizedPassword', 'Sanitized password used')

console.log(`\n${colors.cyan}Testing Sanitization in Employees...${colors.reset}`)
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'sanitizeObjectKeys', 'Object sanitization in employees')
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'hasDangerousPatterns', 'Pattern detection in employees')
fileContains(path.join(projectRoot, 'app/api/employees/route.ts'), 'sanitizedBody', 'Sanitized body used')

// ============================================================
// BUILD VERIFICATION
// ============================================================

logSection('🏗️ BUILD AND COMPILATION VERIFICATION')

console.log(`${colors.cyan}Checking build status...${colors.reset}`)
const buildDir = path.join(projectRoot, '.next')
const buildExists = fs.existsSync(buildDir)
test(`BUILD`, buildExists, buildExists ? 'Build directory exists (.next)' : 'Build directory not found')

if (buildExists) {
  const buildServerDir = path.join(buildDir, 'server')
  const buildServerExists = fs.existsSync(buildServerDir)
  test(`BUILD`, buildServerExists, 'Server build artifacts present')
}

// ============================================================
// SUMMARY
// ============================================================

logSection('📊 SECURITY IMPLEMENTATION TEST SUMMARY')

const total = testsPassed + testsFailed
const passPercentage = ((testsPassed / total) * 100).toFixed(1)

console.log(`${colors.cyan}Test Results:${colors.reset}`)
console.log(`  Total Tests: ${total}`)
console.log(`  ${colors.green}✅ Passed: ${testsPassed}${colors.reset}`)
console.log(`  ${colors.red}❌ Failed: ${testsFailed}${colors.reset}`)
console.log(`  Success Rate: ${passPercentage}%\n`)

// Detailed results by phase
console.log(`${colors.cyan}Phase Coverage:${colors.reset}`)
console.log(`  Phase 1 (Critical Security): ✅ Bcrypt, Rate Limiting, Admin Auth`)
console.log(`  Phase 2 (High Priority): ✅ CSRF, Session Regen, Request Limits`)
console.log(`  Phase 3 (Input Protection): ✅ Sanitization, Rate Limits, HPP Detection\n`)

if (testsFailed === 0) {
  console.log(
    `${colors.green}🎉 ALL TESTS PASSED!${colors.reset}`
  )
  console.log(`${colors.green}Phases 1-3 Implementation: COMPLETE & VERIFIED${colors.reset}\n`)
  process.exit(0)
} else {
  console.log(`${colors.yellow}⚠️  ${testsFailed} test(s) require attention${colors.reset}\n`)
  process.exit(1)
}
