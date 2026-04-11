export type PaginationQuery = {
  page: number
  pageSize: number
  enabled: boolean
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 200

export function parsePaginationParams(searchParams: URLSearchParams): PaginationQuery {
  const pageParam = searchParams.get('page')
  const pageSizeParam = searchParams.get('pageSize')

  const enabled = pageParam !== null || pageSizeParam !== null

  const page = Number(pageParam || DEFAULT_PAGE)
  const pageSize = Number(pageSizeParam || DEFAULT_PAGE_SIZE)

  return {
    enabled,
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGE,
    pageSize:
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(MAX_PAGE_SIZE, Math.floor(pageSize))
        : DEFAULT_PAGE_SIZE,
  }
}

export function createPaginationMeta(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}
