/**
 * CSRF removed – all functions are stubs that perform no-ops.
 * Authentication security is handled entirely by the HTTP-only
 * auth-token session cookie (sameSite=strict).
 */

export function generateCsrfToken(): string { return '' }
export async function setCsrfToken(): Promise<string> { return '' }
export async function verifyCsrfToken(_token: string): Promise<boolean> { return true }
export async function getCsrfToken(): Promise<string | null> { return null }
export async function clearCsrfToken(): Promise<void> {}
export async function resetCsrfToken(): Promise<string> { return '' }
