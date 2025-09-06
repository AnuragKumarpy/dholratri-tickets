const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cors = require('cors');
const Joi = require('joi');
const { cleanEnv, str } = require('envalid');
require('dotenv').config();

// --- Environment Variable Validation ---
const env = cleanEnv(process.env, {
  MONGO_URI: str(),
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),
  JWT_SECRET: str(),
});

// --- Cloudinary Config ---
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// --- Multer Storage ---
const screenshotStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dholratri-screenshots',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const qrCodeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dholratri-config',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: 'payment-qr-code',
    overwrite: true,
  },
});

// --- Multer Uploaders ---
const uploadScreenshot = multer({
  storage: screenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 200KB limit
});

const uploadPaymentQr = multer({
  storage: qrCodeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 200KB limit for QR code
});

// --- Express App Setup ---
const app = express();
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'https://dholratri-tickets.vercel.app/'], // Adjust as needed
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true,
}));

// --- Fix for express-mongo-sanitize TypeError ---
const makeQueryWritable = (req, res, next) => {
  req.query = { ...req.query }; // Create a writable copy of req.query
  next();
};

// --- Rate Limiting for Sensitive Routes ---
const sensitiveRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests...',
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Multer Error Handler ---
const handleMulterError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: `File too large. Max size is ${uploadMiddleware.limits.fileSize / 1024}KB.` });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'File upload error.' });
    }
    next();
  });
};

// --- DB Connect & Admin Create ---
const client = new MongoClient(env.MONGO_URI, { useUnifiedTopology: true });
let db;

async function connectToDb() {
  try {
    await client.connect();
    db = client.db('dholratriDB');
    await db.createCollection('purchases');
    await db.createCollection('tickets');
    await db.createCollection('admins');
    await db.createCollection('activity_logs');
    await db.createCollection('settings'); // Ensure settings collection exists
    console.log('🗄️ Successfully connected to MongoDB Atlas!');

    // MongoDB connection event handlers
    client.on('connected', () => console.log('MongoDB reconnected'));
    client.on('disconnected', () => console.warn('MongoDB disconnected, attempting to reconnect...'));
    client.on('error', (err) => console.error('MongoDB connection error:', err));
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

async function createAdminUser(username, password) {
  try {
    const adminCollection = db.collection('admins');
    const existingAdmin = await adminCollection.findOne({ username });
    if (existingAdmin) {
      console.log(`Admin user '${username}' already exists. Skipping creation.`);
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await adminCollection.insertOne({
      username,
      password: hashedPassword,
      createdAt: new Date(),
    });
    console.log(`✅ Admin user '${username}' created successfully!`);
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}

// --- Activity Logging ---
async function logActivity(userId, action, details) {
  try {
    await db.collection('activity_logs').insertOne({
      userId: new ObjectId(userId),
      action,
      details,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

// --- Input Validation Schemas ---
const purchaseSchema = Joi.object({
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  attendees: Joi.array().items(Joi.string().min(1).max(100)).min(1).required(),
  ticketType: Joi.string().valid('general', 'vip', 'premium').required(),
});

const settingsSchema = Joi.object({
  eventName: Joi.string().min(1).max(100).required(),
  paymentUpiId: Joi.string().min(1).max(100).required(),
  tiers: Joi.string().custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return helpers.error('array.base');
      return parsed;
    } catch {
      return helpers.error('string.json');
    }
  }).required(),
});

const verifySchema = Joi.object({
  id: Joi.string().custom((value, helpers) => {
    if (!ObjectId.isValid(value)) return helpers.error('string.objectId');
    return value;
  }).required(),
});

// --- Auth Verify Token Middleware ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token.' });
  }
};

// --- API Routes ---
app.post('/api/auth/login', sensitiveRouteLimiter, makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await db.collection('admins').findOne({ username });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = jwt.sign({ userId: admin._id, username: admin.username }, env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

app.post('/api/purchase/initiate', sensitiveRouteLimiter, makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    // THIS IS THE FIX: Added { allowUnknown: true } to the validation options
    const { error } = purchaseSchema.validate(req.body, { allowUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    // We only deconstruct the keys we know. The others (like wantsMarketingUpdates)
    // are still in req.body, and we can save them if we want, but Joi won't error.
    const { phone, attendees, ticketType } = req.body;
    const cleanPhone = phone.trim();
    
    // We can grab the other fields from req.body now
    const newPurchase = {
      phone: cleanPhone,
      ticketType,
      ticketCount: attendees.length,
      status: 'payment-pending',
      createdAt: new Date(),
      utr: null,
      screenshotPath: null,
      // Save our extra data
      wantsMarketingUpdates: req.body.wantsMarketingUpdates || false,
      appliedCoupon: req.body.appliedCoupon || 'none',
      finalAmountPaid: req.body.finalAmountPaid || 0,
    };
    const purchaseResult = await db.collection('purchases').insertOne(newPurchase);
    const purchaseId = purchaseResult.insertedId;
    const ticketDocs = attendees.map((name) => ({
      purchaseId, attendeeName: name, ticketType, phone: cleanPhone,
      status: 'payment-pending', checkedIn: false, qrCodeDataUrl: null,
    }));
    await db.collection('tickets').insertMany(ticketDocs);
    res.status(201).json({ message: 'Purchase initiated. Please proceed to payment.', purchaseId });
  } catch (error) {
    console.error('Error initiating purchase:', error);
    res.status(500).json({ message: 'Error initiating purchase.' });
  }
});

app.patch('/api/purchase/confirm/:id', handleMulterError(uploadScreenshot.single('screenshot')), makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    const { id } = req.params;
    const { utr } = req.body;
    if (!req.file || !utr) {
      return res.status(400).json({ message: 'UTR and screenshot file are required.' });
    }
    const result = await db.collection('purchases').updateOne(
      { _id: new ObjectId(id), status: 'payment-pending' },
      { $set: { utr, screenshotPath: req.file.path, status: 'pending-approval' } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Pending purchase not found or already processed.' });
    }
    await db.collection('tickets').updateMany(
      { purchaseId: new ObjectId(id) },
      { $set: { status: 'pending-approval' } }
    );
    res.status(200).json({ message: 'Booking received and is now under review.' });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Error processing your booking.' });
  }
});

app.get('/api/admin/purchases', verifyToken, makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    const purchases = await db.collection('purchases').find({ status: 'pending-approval' }).toArray();
    for (let purchase of purchases) {
      const tickets = await db.collection('tickets').find({ purchaseId: purchase._id }).project({ attendeeName: 1 }).toArray();
      purchase.attendees = tickets.map((t) => t.attendeeName);
    }
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Failed to fetch pending purchases' });
  }
});

app.patch('/api/admin/purchases/:id/approve', verifyToken, makeQueryWritable, mongoSanitize(), async (req, res) => {
  const session = client.startSession();
  try {
    const { id } = req.params;
    const purchaseId = new ObjectId(id);
    let approvedTickets = [];
    await session.withTransaction(async () => {
      const purchaseUpdate = await db.collection('purchases').updateOne(
        { _id: purchaseId },
        { $set: { status: 'approved' } },
        { session }
      );
      if (purchaseUpdate.matchedCount === 0) throw new Error('Purchase not found');
      const ticketsToApprove = await db.collection('tickets').find({ purchaseId }, { session }).toArray();
      if (ticketsToApprove.length === 0) throw new Error('No tickets found for this purchase.');
      for (const ticket of ticketsToApprove) {
        const ticketIdString = ticket._id.toString();
        const qrCodeDataUrl = await qrcode.toDataURL(ticketIdString);
        await db.collection('tickets').updateOne(
          { _id: ticket._id },
          { $set: { status: 'approved', qrCodeDataUrl } },
          { session }
        );
        approvedTickets.push(ticket.attendeeName);
      }
      await logActivity(req.user.userId, 'approve_purchase', { purchaseId, ticketCount: approvedTickets.length });
    });
    res.json({ message: `Purchase approved. ${approvedTickets.length} tickets generated for: ${approvedTickets.join(', ')}` });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ message: 'Failed to approve purchase: ' + error.message });
  } finally {
    await session.endSession();
  }
});

app.patch('/api/admin/purchases/:id/reject', verifyToken, makeQueryWritable, mongoSanitize(), async (req, res) => {
  const session = client.startSession();
  try {
    const { id } = req.params;
    const purchaseId = new ObjectId(id);
    await session.withTransaction(async () => {
      await db.collection('purchases').updateOne({ _id: purchaseId }, { $set: { status: 'rejected' } }, { session });
      await db.collection('tickets').updateMany({ purchaseId }, { $set: { status: 'rejected' } }, { session });
      await logActivity(req.user.userId, 'reject_purchase', { purchaseId });
    });
    res.json({ message: 'Booking rejected' });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ message: 'Failed to reject booking' });
  } finally {
    await session.endSession();
  }
});

app.get('/api/tickets/status/:phone', makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = phone.trim();
    const purchases = await db.collection('purchases').find({ phone: cleanPhone }).toArray();
    if (!purchases || purchases.length === 0) {
      return res.status(404).json({ message: 'No booking found for this phone number.' });
    }
    const purchaseIds = purchases.map((p) => p._id);
    const tickets = await db.collection('tickets').find({
      purchaseId: { $in: purchaseIds },
      status: { $in: ['approved', 'pending-approval', 'rejected', 'payment-pending'] },
    }).toArray();
    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ message: 'Purchase found, but no matching tickets.' });
    }
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching ticket status:', error);
    res.status(500).json({ message: 'Error fetching booking status.' });
  }
});

app.post('/api/verify', verifyToken, makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    const { error } = verifySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { id } = req.body;
    const ticket = await db.collection('tickets').findOne({ _id: new ObjectId(id) });
    if (!ticket) return res.status(404).json({ valid: false, message: 'Ticket Not Found' });
    if (ticket.status !== 'approved') return res.status(403).json({ valid: false, message: `Ticket status is: ${ticket.status.toUpperCase()}` });
    if (ticket.checkedIn) return res.status(409).json({ valid: false, message: 'Ticket Already Checked In', name: ticket.attendeeName });

    await db.collection('tickets').updateOne(
      { _id: new ObjectId(id) },
      { $set: { checkedIn: true, checkedInAt: new Date() } }
    );
    await logActivity(req.user.userId, 'verify_ticket', { ticketId: id, attendeeName: ticket.attendeeName });
    res.status(200).json({ valid: true, message: 'Check-in Successful', name: ticket.attendeeName });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- Event Settings Routes ---
const settingsId = 'global_config';

app.get('/api/settings', makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    const settings = await db.collection('settings').findOne({ _id: settingsId });
    if (!settings) {
      return res.status(404).json({ message: 'Configuration not found. Please set up in admin panel.' });
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error fetching settings.' });
  }
});

app.get('/api/admin/settings', verifyToken, makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    const settings = await db.collection('settings').findOne({ _id: settingsId });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ message: 'Server error fetching settings.' });
  }
});

app.patch('/api/admin/settings', verifyToken, handleMulterError(uploadPaymentQr.single('paymentQrFile')), makeQueryWritable, mongoSanitize(), async (req, res) => {
  try {
    const { error } = settingsSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { eventName, paymentUpiId, tiers } = req.body;
    let updateData = {
      eventName,
      paymentUpiId,
      tiers: JSON.parse(tiers),
    };
    if (req.file && req.file.path) {
      updateData.paymentQrUrl = req.file.path;
    }
    await db.collection('settings').updateOne(
      { _id: settingsId },
      { $set: updateData },
      { upsert: true }
    );
    await logActivity(req.user.userId, 'update_settings', { eventName, paymentUpiId });
    res.json({ message: 'Settings saved successfully!' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ message: 'Error saving settings.' });
  }
});

// --- Server Start & Graceful Shutdown ---
const PORT = 5001;

connectToDb().then(() => {
  createAdminUser('admin', 'DholRatri2025!');
  const server = app.listen(PORT, () => {
    console.log(`🎉 Server is running with SECURE logic on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    server.close();
    await client.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
