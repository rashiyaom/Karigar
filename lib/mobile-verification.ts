export function normalizeMobile(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

export function isValidMobile(value: string): boolean {
  const normalized = normalizeMobile(value)
  return normalized.length >= 10 && normalized.length <= 15
}
