import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 20 },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Patient', 'Doctor', 'Healthcare Provider'], required: true },
}, { timestamps: true })

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: String, required: true },
  doctor: { type: String, required: true },
  specialty: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'Confirmed' },
  location: { type: String, required: true },
  userId: { type: String },
}, { timestamps: true })

const recordSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  storageName: { type: String },
  type: { type: String, required: true },
  date: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  size: { type: String, required: true },
  userId: { type: String },
}, { timestamps: true })

const reminderSchema = new mongoose.Schema({
  medicine: { type: String, required: true },
  dose: { type: String, required: true },
  frequency: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'Active' },
  userId: { type: String },
}, { timestamps: true })

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true },
  read: { type: Boolean, default: false },
  userId: { type: String },
}, { timestamps: true })

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true })

export const User = mongoose.model('User', userSchema)
export const Appointment = mongoose.model('Appointment', appointmentSchema)
export const MedicalRecord = mongoose.model('MedicalRecord', recordSchema)
export const Reminder = mongoose.model('Reminder', reminderSchema)
export const Notification = mongoose.model('Notification', notificationSchema)
export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema)
