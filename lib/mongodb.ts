import mongoose, { type Mongoose } from 'mongoose'

declare global {
  var mongoose: {
    conn: Mongoose | null
    promise: Promise<Mongoose> | null
  } | undefined
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
  }
  return uri
}

const cached = global.mongoose ?? { conn: null, promise: null }
if (!global.mongoose) {
  global.mongoose = cached
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const mongoUri = getMongoUri()
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose
      .connect(mongoUri, opts)
      .then((mongoose) => {
        console.log('✓ Connected to MongoDB')
        return mongoose
      })
      .catch((error) => {
        console.error('✗ Failed to connect to MongoDB:', error)
        throw error
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
