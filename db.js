import mongoose from 'mongoose'

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn('MONGODB_URI is not set. Using in-memory fallback data.')
    return false
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  })

  console.log('MongoDB connected')
  return true
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1
}
