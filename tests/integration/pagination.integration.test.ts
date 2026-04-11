import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { MongoMemoryServer } from 'mongodb-memory-server'

let memoryServer: MongoMemoryServer
let mongooseLib: typeof import('mongoose')
let connectToDatabase: typeof import('../../lib/mongodb').connectToDatabase
let mongoStore: typeof import('../../lib/mongo-store').mongoStore
let models: typeof import('../../lib/mongodb-models')
let parsePaginationParams: typeof import('../../lib/pagination').parsePaginationParams
let createPaginationMeta: typeof import('../../lib/pagination').createPaginationMeta

describe('Pagination contract and bounds handling', () => {
  beforeAll(async () => {
    const mem = await import('mongodb-memory-server')
    memoryServer = await mem.MongoMemoryServer.create()
    process.env.MONGODB_URI = memoryServer.getUri()
    process.env.NODE_ENV = 'test'

    mongooseLib = await import('mongoose')
    ;({ connectToDatabase } = await import('../../lib/mongodb'))
    ;({ mongoStore } = await import('../../lib/mongo-store'))
    models = await import('../../lib/mongodb-models')
    ;({ parsePaginationParams, createPaginationMeta } = await import('../../lib/pagination'))

    await connectToDatabase()
  })

  beforeEach(async () => {
    await Promise.all([
      models.AttendanceModel.deleteMany({}),
      models.CreditModel.deleteMany({}),
      models.TaskModel.deleteMany({}),
      models.HistoryModel.deleteMany({}),
    ])
  })

  afterAll(async () => {
    await mongooseLib.disconnect()
    await memoryServer.stop()
  })

  it('clamps invalid and oversized query params to safe bounds', () => {
    const query = new URLSearchParams({ page: '-2', pageSize: '9999' })
    const parsed = parsePaginationParams(query)

    expect(parsed.enabled).toBe(true)
    expect(parsed.page).toBe(1)
    expect(parsed.pageSize).toBe(200)

    const meta = createPaginationMeta(501, parsed.page, parsed.pageSize)
    expect(meta.totalPages).toBe(3)
    expect(meta.hasPreviousPage).toBe(false)
    expect(meta.hasNextPage).toBe(true)
  })

  it('returns deterministic page slices and accurate totals from store methods', async () => {
    const ownerId = 'owner-pagination-1'
    const employeeId = 'employee-pagination-1'

    for (let i = 0; i < 35; i++) {
      const day = String((i % 28) + 1).padStart(2, '0')
      await models.AttendanceModel.create({
        ownerId,
        employeeId,
        date: `2026-03-${day}`,
        status: i % 2 === 0 ? 'present' : 'absent',
      })
    }

    const pageOne = await mongoStore.getAttendancePage(ownerId, { page: 1, pageSize: 10 })
    const pageTwo = await mongoStore.getAttendancePage(ownerId, { page: 2, pageSize: 10 })

    expect(pageOne.total).toBe(35)
    expect(pageTwo.total).toBe(35)
    expect(pageOne.data).toHaveLength(10)
    expect(pageTwo.data).toHaveLength(10)

    const firstPageIds = new Set(pageOne.data.map((record) => record.id))
    const overlap = pageTwo.data.some((record) => firstPageIds.has(record.id))
    expect(overlap).toBe(false)

    const meta = createPaginationMeta(pageOne.total, 2, 10)
    expect(meta.totalPages).toBe(4)
    expect(meta.hasPreviousPage).toBe(true)
    expect(meta.hasNextPage).toBe(true)
  })
})
