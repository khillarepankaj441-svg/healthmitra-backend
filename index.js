import cors from 'cors'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import fs from 'node:fs'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { connectDatabase, isDatabaseConnected } from './db.js'
import { articles, doctors } from './data.js'
import { Appointment, ContactMessage, MedicalRecord, Notification, Reminder, User } from './models.js'

const app = express()
const port = Number(process.env.PORT || 4000)
const jwtSecret = process.env.JWT_SECRET || 'dev-healthmitra-change-this-secret'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })
const allowedOrigins = new Set([
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean))
const localDevOrigin = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/

const state = {
  appointments: [],
  bmiEntries: [],
  contactMessages: [],
  notifications: [],
  profiles: {},
  records: [],
  reminders: [],
  sosAlerts: [],
  users: [],
}

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    const frontendOrigin = process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.replace(/\/$/, '') : null;
    if (!origin || allowedOrigins.has(origin) || localDevOrigin.test(origin) || origin === frontendOrigin || !frontendOrigin) {
      callback(null, true)
      return
    }
    callback(new Error('Origin not allowed'))
  },
}))
app.use(express.json({ limit: '32kb' }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

const text = z.string().trim().min(1).max(500)
const email = z.string().trim().email().max(254)
const phone = z.string().trim().transform((value) => value.replace(/\D/g, '').slice(-10)).refine((value) => /^\d{10}$/.test(value), {
  message: 'Phone number must contain 10 digits',
})

const loginSchema = z.object({
  email,
  password: z.string().min(8).max(128),
  role: z.enum(['Patient', 'Doctor', 'Healthcare Provider']).optional(),
})

const signupSchema = loginSchema.extend({
  name: text.max(80),
  phone,
  role: z.enum(['Patient', 'Doctor', 'Healthcare Provider']),
})

const appointmentSchema = z.object({
  doctorId: z.string().min(1).max(60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().min(4).max(20),
})

const reminderSchema = z.object({
  medicine: text.max(80),
  dose: text.max(60),
  frequency: text.max(60),
  time: text.max(20),
})

const contactSchema = z.object({
  name: text.max(80),
  email,
  phone: z.string().trim().max(20).optional().default(''),
  subject: text.max(120),
  message: text.max(1000),
})

const profileSchema = z.object({
  name: text.max(80),
  email,
  phone,
  role: z.enum(['Patient', 'Doctor', 'Healthcare Provider']),
  dateOfBirth: z.string().trim().max(40).optional().default(''),
  bloodGroup: z.string().trim().max(10).optional().default(''),
  gender: z.string().trim().max(40).optional().default(''),
  maritalStatus: z.string().trim().max(40).optional().default(''),
  emergencyContact: z.string().trim().max(80).optional().default(''),
  address: z.string().trim().max(300).optional().default(''),
})

const bmiSchema = z.object({
  age: z.number().min(2).max(120),
  height: z.number().min(50).max(260),
  weight: z.number().min(2).max(350),
  value: z.number().min(1).max(100),
  label: text.max(40),
})

const sosSchema = z.object({
  message: text.max(160).optional().default('Emergency alert triggered'),
  location: z.string().trim().max(160).optional().default('Location not shared'),
})

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png'])
    callback(null, allowed.has(file.mimetype))
  },
})

function parseBody(schema, req, res) {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.issues.map((issue) => issue.message) })
    return null
  }
  return result.data
}

function nextId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function publicUser(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    joinedOn: user.createdAt || user.joinedOn || null,
  }
}

function addNotification(user, title, message, type = 'System') {
  const notification = {
    id: nextId('note'),
    title,
    message,
    type,
    time: new Date().toLocaleString(),
    read: false,
    userId: user.id,
  }
  state.notifications.unshift(notification)
  return notification
}

function signToken(user) {
  return jwt.sign(publicUser(user), jwtSecret, { expiresIn: '2h', issuer: 'healthmitra-local' })
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    req.user = jwt.verify(token, jwtSecret, { issuer: 'healthmitra-local' })
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'Healthcare Provider') {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'HealthMitra API' })
})

app.post('/api/auth/login', async (req, res) => {
  const body = parseBody(loginSchema, req, res)
  if (!body) return
  const user = isDatabaseConnected()
    ? await User.findOne({ email: body.email.toLowerCase() })
    : state.users.find((item) => item.email.toLowerCase() === body.email.toLowerCase())
  const ok = user ? await bcrypt.compare(body.password, user.passwordHash) : false
  if (!ok) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }
  res.json({
    token: signToken(user),
    user: publicUser(user),
    message: 'Login successful.',
  })
})

app.post('/api/auth/signup', async (req, res) => {
  const body = parseBody(signupSchema, req, res)
  if (!body) return
  if (state.users.some((item) => item.email.toLowerCase() === body.email.toLowerCase())) {
    if (!isDatabaseConnected()) {
      res.status(409).json({ error: 'Email already exists' })
      return
    }
  }
  if (isDatabaseConnected() && await User.exists({ email: body.email.toLowerCase() })) {
    res.status(409).json({ error: 'Email already exists' })
    return
  }
  const user = {
    id: nextId('user'),
    name: body.name,
    email: body.email,
    phone: body.phone,
    passwordHash: await bcrypt.hash(body.password, 10),
    role: body.role,
  }
  if (isDatabaseConnected()) {
    await User.create(user)
  } else {
    state.users.push(user)
  }
  res.status(201).json({
    token: signToken(user),
    user: publicUser(user),
    message: 'Account created.',
  })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ profile: state.profiles[req.user.id] || req.user })
})

app.put('/api/profile', requireAuth, async (req, res) => {
  const body = parseBody(profileSchema, req, res)
  if (!body) return
  state.profiles[req.user.id] = { ...req.user, ...body }
  const user = state.users.find((item) => item.id === req.user.id)
  if (user) {
    user.name = body.name
    user.email = body.email
    user.phone = body.phone
    user.role = body.role
  }
  if (isDatabaseConnected()) {
    await User.updateOne({ _id: req.user.id }, { name: body.name, email: body.email, phone: body.phone, role: body.role }).catch(() => {})
  }
  res.json({ profile: state.profiles[req.user.id], message: 'Profile saved.' })
})

app.get('/api/doctors', (req, res) => {
  const query = String(req.query.q || '').toLowerCase()
  const specialty = String(req.query.specialty || 'All Specializations')
  const sort = String(req.query.sort || 'Experience')
  const filtered = doctors
    .filter((doctor) => {
      const matchesQuery = [doctor.name, doctor.specialty, doctor.hospital].join(' ').toLowerCase().includes(query)
      const matchesSpecialty = specialty === 'All Specializations' || doctor.specialty === specialty
      return matchesQuery && matchesSpecialty
    })
    .sort((a, b) => sort === 'Rating' ? b.rating - a.rating : b.experience - a.experience)
  res.json(filtered)
})

app.get('/api/articles', (req, res) => {
  const query = String(req.query.q || '').toLowerCase()
  const category = String(req.query.category || 'All')
  res.json(articles.filter((article) => {
    const matchesQuery = [article.title, article.summary, article.category].join(' ').toLowerCase().includes(query)
    const matchesCategory = category === 'All' || article.category === category
    return matchesQuery && matchesCategory
  }))
})

app.get('/api/appointments', requireAuth, async (_req, res) => {
  if (isDatabaseConnected()) {
    res.json(await Appointment.find().sort({ createdAt: -1 }).lean())
    return
  }
  res.json(state.appointments)
})

app.post('/api/appointments', requireAuth, async (req, res) => {
  const body = parseBody(appointmentSchema, req, res)
  if (!body) return
  const doctor = doctors.find((item) => item.id === body.doctorId)
  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found' })
    return
  }
  const appointment = {
    id: nextId('apt'),
    doctorId: doctor.id,
    doctor: doctor.name,
    specialty: doctor.specialty,
    date: body.date,
    time: body.time,
    status: 'Confirmed',
    location: doctor.hospital,
    patient: req.user.name,
  }
  state.appointments.unshift(appointment)
  addNotification(req.user, 'Appointment booked', `Your appointment with ${doctor.name} is confirmed.`, 'Appointment')
  if (isDatabaseConnected()) {
    const created = await Appointment.create({ ...appointment, userId: req.user.id })
    res.status(201).json(created)
    return
  }
  res.status(201).json(appointment)
})

app.get('/api/records', requireAuth, async (_req, res) => {
  if (isDatabaseConnected()) {
    res.json(await MedicalRecord.find().sort({ createdAt: -1 }).lean())
    return
  }
  res.json(state.records)
})

app.post('/api/records/upload', requireAuth, upload.single('report'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'PDF, JPG or PNG report is required' })
    return
  }
  const record = {
    id: nextId('rec'),
    fileName: req.file.originalname,
    storageName: req.file.filename,
    type: req.file.mimetype === 'application/pdf' ? 'Lab Report' : 'Scan / Image',
    date: new Date().toISOString().slice(0, 10),
    uploadedBy: req.user.name,
    size: `${Math.max(1, Math.round(req.file.size / 1024))} KB`,
  }
  state.records.unshift(record)
  addNotification(req.user, 'Medical record uploaded', `${record.fileName} has been added to your records.`, 'Records')
  if (isDatabaseConnected()) {
    const created = await MedicalRecord.create({ ...record, userId: req.user.id })
    res.status(201).json(created)
    return
  }
  res.status(201).json(record)
})

app.get('/api/records/:id/download', requireAuth, (req, res) => {
  const record = state.records.find((item) => item.id === req.params.id)
  if (!record?.storageName) {
    res.status(404).json({ error: 'Stored file not found' })
    return
  }
  res.download(path.join(uploadsDir, record.storageName), record.fileName)
})

app.get('/api/reminders', requireAuth, async (_req, res) => {
  if (isDatabaseConnected()) {
    res.json(await Reminder.find().sort({ createdAt: -1 }).lean())
    return
  }
  res.json(state.reminders)
})

app.post('/api/reminders', requireAuth, async (req, res) => {
  const body = parseBody(reminderSchema, req, res)
  if (!body) return
  const reminder = { id: nextId('med'), status: 'Active', ...body }
  state.reminders.unshift(reminder)
  addNotification(req.user, 'Medicine reminder saved', `${reminder.medicine} reminder is active.`, 'Reminder')
  if (isDatabaseConnected()) {
    const created = await Reminder.create({ ...reminder, userId: req.user.id })
    res.status(201).json(created)
    return
  }
  res.status(201).json(reminder)
})

app.get('/api/notifications', requireAuth, async (_req, res) => {
  if (isDatabaseConnected()) {
    const items = await Notification.find().sort({ createdAt: -1 }).lean()
    res.json(items.length ? items : state.notifications)
    return
  }
  res.json(state.notifications)
})

app.post('/api/notifications/:id/read', requireAuth, (req, res) => {
  const notification = state.notifications.find((item) => item.id === req.params.id)
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' })
    return
  }
  notification.read = true
  res.json(notification)
})

app.get('/api/bmi', requireAuth, (req, res) => {
  res.json(state.bmiEntries.filter((item) => item.userId === req.user.id))
})

app.post('/api/bmi', requireAuth, (req, res) => {
  const body = parseBody(bmiSchema, req, res)
  if (!body) return
  const entry = { id: nextId('bmi'), userId: req.user.id, date: new Date().toLocaleDateString(), ...body }
  state.bmiEntries.unshift(entry)
  addNotification(req.user, 'BMI calculated', `Your BMI is ${entry.value} (${entry.label}).`, 'Health')
  res.status(201).json(entry)
})

app.post('/api/sos', requireAuth, (req, res) => {
  const body = parseBody(sosSchema, req, res)
  if (!body) return
  const alert = { id: nextId('sos'), userId: req.user.id, patient: req.user.name, createdAt: new Date().toISOString(), status: 'Sent', ...body }
  state.sosAlerts.unshift(alert)
  addNotification(req.user, 'Emergency alert sent', 'Your emergency contacts have been notified.', 'Emergency')
  res.status(201).json(alert)
})

app.post('/api/contact', (req, res) => {
  const body = parseBody(contactSchema, req, res)
  if (!body) return
  const message = { id: nextId('msg'), createdAt: new Date().toISOString(), ...body }
  state.contactMessages.unshift(message)
  if (isDatabaseConnected()) {
    ContactMessage.create(body).catch(() => {})
  }
  res.status(201).json({ id: message.id, message: 'Message received.' })
})

app.get('/api/admin/users', requireAuth, requireAdmin, (_req, res) => {
  if (isDatabaseConnected()) {
    User.find().sort({ createdAt: -1 }).then((users) => res.json(users.map(publicUser))).catch(() => res.json([]))
    return
  }
  res.json(state.users.map(publicUser))
})

app.get('/api/admin/stats', requireAuth, requireAdmin, async (_req, res) => {
  if (isDatabaseConnected()) {
    const [usersCount, doctorsCount, appointmentsCount, recordsCount, remindersCount, contactsCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Doctor' }),
      Appointment.countDocuments(),
      MedicalRecord.countDocuments(),
      Reminder.countDocuments(),
      ContactMessage.countDocuments(),
    ])
    res.json({
      users: usersCount,
      doctors: doctorsCount,
      appointments: appointmentsCount,
      records: recordsCount,
      reminders: remindersCount,
      contacts: contactsCount,
      bmi: 0,
      sos: 0,
    })
    return
  }

  res.json({
    users: state.users.length,
    doctors: state.users.filter((user) => user.role === 'Doctor').length,
    appointments: state.appointments.length,
    records: state.records.length,
    reminders: state.reminders.length,
    contacts: state.contactMessages.length,
    bmi: state.bmiEntries.length,
    sos: state.sosAlerts.length,
  })
})

app.get('/api/admin/appointments', requireAuth, requireAdmin, async (_req, res) => {
  if (isDatabaseConnected()) {
    res.json(await Appointment.find().sort({ createdAt: -1 }).lean())
    return
  }
  res.json(state.appointments)
})

app.get('/api/admin/sos', requireAuth, requireAdmin, (_req, res) => {
  res.json(state.sosAlerts)
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((error, _req, res, _next) => {
  void _next
  const status = error.message === 'Origin not allowed' ? 403 : 500
  res.status(status).json({ error: status === 403 ? error.message : 'Internal server error' })
})

connectDatabase()
  .catch((error) => {
    console.error(`MongoDB connection failed: ${error.message}`)
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`HealthMitra API listening on http://localhost:${port}`)
    })
  })
