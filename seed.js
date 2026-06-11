import mongoose from 'mongoose'
import { doctors } from './data.js'
import { Doctor } from './models.js'
import 'dotenv/config'

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/healthmitra')
    console.log('Connected to MongoDB')
    
    await Doctor.deleteMany({})
    console.log('Cleared existing doctors')

    await Doctor.insertMany(doctors)
    console.log('Inserted updated doctors with casesHandled data')

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

seed()
