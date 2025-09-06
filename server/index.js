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
const cloudinary = require('cloudinary').v2; // Import Cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Import Cloudinary storage
require('dotenv').config();

// --- CONFIGURE CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- CONFIGURE CLOUDINARY STORAGE for MULTER ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dholratri-screenshots', // A folder name in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

// --- UPDATE MULTER configuration ---
const upload = multer({ 
  storage: storage, // Use Cloudinary storage instead of diskStorage
  limits: {
    fileSize: 200 * 1024 // 200KB limit (unchanged)
  }
});

// --- Setup Express App ---
const app = express();
app.use(helmet());
app.use(express.json({ limit: '10kb' })); 
app.use(mongoSanitize());

// REMOVED: app.use('/uploads', ...) This is no longer needed.

const apiLimiter = rateLimit({ /* ... (limiter config unchanged) ... */ });
app.use('/api', apiLimiter);

const client = new MongoClient(process.env.MONGO_URI);
let db;

// --- All other code (connectToDb, createAdminUser, all API routes) remains 100% the same ---
// The `app.patch('/api/purchase/confirm/:id'...)` route works perfectly as-is,
// because it just saves `req.file.path`, which is now a Cloudinary URL.
// All other routes are identical.

// --- (Full unchanged server logic below) ---

async function connectToDb() {
  try {
    await client.connect();
    db = client.db('dholratriDB');
    await db.createCollection('purchases');
    await db.createCollection('tickets');
    await db.createCollection('admins');
    await db.createCollection('activity_logs');
    console.log("🗄️ Successfully connected to MongoDB Atlas!");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}
async function createAdminUser(username, password) {
  try {
    const adminCollection = db.collection('admins');
    const existingAdmin = await adminCollection.findOne({ username: username });
    if (existingAdmin) {
      console.log(`Admin user '${username}' already exists. Skipping creation.`);
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await adminCollection.insertOne({
      username: username,
      password: hashedPassword,
      createdAt: new Date(),
    });
    console.log(`✅ Admin user '${username}' created successfully!`);
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}
const PORT = 5001;
const JWT_SECRET_KEY = process.env.JWT_SECRET || 'YOUR_FALLBACK_SECRET_KEY_HERE';
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await db.collection('admins').findOne({ username });
    if (!admin) { return res.status(401).json({ message: 'Invalid credentials.' }); }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) { return res.status(401).json({ message: 'Invalid credentials.' }); }
    const token = jwt.sign({ userId: admin._id, username: admin.username }, JWT_SECRET_KEY, { expiresIn: '8h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) { return res.status(401).json({ message: 'Access denied. No token provided.' }); }
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    req.user = decoded; 
    next(); 
  } catch (error) {
    res.status(403).json({ message: 'Invalid token.' });
  }
};
app.post('/api/purchase/initiate', async (req, res) => {
  try {
    const { phone, attendees, ticketType } = req.body;
    if (!phone || !attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ message: 'Missing required information.' });
    }
    const cleanPhone = phone.trim();
    const newPurchase = {
      phone: cleanPhone, ticketType, ticketCount: attendees.length, status: 'payment-pending',
      createdAt: new Date(), utr: null, screenshotPath: null,
    };
    const purchaseResult = await db.collection('purchases').insertOne(newPurchase);
    const purchaseId = purchaseResult.insertedId;
    const ticketDocs = attendees.map(name => ({
      purchaseId: purchaseId, attendeeName: name, ticketType: ticketType,
      phone: cleanPhone, status: 'payment-pending', checkedIn: false, qrCodeDataUrl: null,
    }));
    await db.collection('tickets').insertMany(ticketDocs);
    res.status(201).json({ message: 'Purchase initiated. Please proceed to payment.', purchaseId: purchaseId });
  } catch (error) {
    console.error('Error initiating purchase:', error);
    res.status(500).json({ message: 'Error initiating purchase.' });
  }
});

const screenshotUploadMiddleware = upload.single('screenshot');
app.patch('/api/purchase/confirm/:id', (req, res, next) => {
  screenshotUploadMiddleware(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Max size is 200KB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'An unknown error occurred during file upload.' });
    }
    next();
  });
}, 
async (req, res) => {
  try {
    const { id } = req.params;
    const { utr } = req.body;
    if (!req.file || !utr) {
      return res.status(400).json({ message: 'UTR and screenshot file are required.' });
    }
    // req.file.path is now a Cloudinary URL, e.g: "http://res.cloudinary.com/..."
    const result = await db.collection('purchases').updateOne(
      { _id: new ObjectId(id), status: 'payment-pending' },
      { $set: { utr: utr, screenshotPath: req.file.path, status: 'pending-approval' } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Pending purchase not found or already processed.' });
    }
    await db.collection('tickets').updateMany(
      { purchaseId: new ObjectId(id) }, { $set: { status: 'pending-approval' } }
    );
    res.status(200).json({ message: 'Booking received and is now under review.' });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Error processing your booking.' });
  }
});

app.get('/api/admin/purchases', verifyToken, async (req, res) => { 
  try {
    const purchases = await db.collection('purchases').find({ status: 'pending-approval' }).toArray();
    for (let purchase of purchases) {
      const tickets = await db.collection('tickets').find({ purchaseId: purchase._id }).project({ attendeeName: 1 }).toArray();
      purchase.attendees = tickets.map(t => t.attendeeName);
    }
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending purchases' });
  }
});
app.patch('/api/admin/purchases/:id/approve', verifyToken, async (req, res) => {
  const session = client.startSession();
  try {
    const { id } = req.params; const purchaseId = new ObjectId(id); let approvedTickets = [];
    await session.withTransaction(async () => {
      const purchaseUpdate = await db.collection('purchases').updateOne({ _id: purchaseId }, { $set: { status: 'approved' } }, { session });
      if (purchaseUpdate.matchedCount === 0) throw new Error('Purchase not found');
      const ticketsToApprove = await db.collection('tickets').find({ purchaseId: purchaseId }, { session }).toArray();
      if (ticketsToApprove.length === 0) throw new Error('No tickets found for this purchase.');
      for (const ticket of ticketsToApprove) {
        const ticketIdString = ticket._id.toString();
        const qrCodeDataUrl = await qrcode.toDataURL(ticketIdString);
        await db.collection('tickets').updateOne({ _id: ticket._id }, { $set: { status: 'approved', qrCodeDataUrl: qrCodeDataUrl } }, { session });
        approvedTickets.push(ticket.attendeeName);
      }
    });
    res.json({ message: `Purchase approved. ${approvedTickets.length} tickets generated for: ${approvedTickets.join(', ')}` });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ message: 'Failed to approve purchase: ' + error.message });
  } finally {
    await session.endSession();
  }
});
app.patch('/api/admin/purchases/:id/reject', verifyToken, async (req, res) => {
  const session = client.startSession();
  try {
    const { id } = req.params; const purchaseId = new ObjectId(id);
    await session.withTransaction(async () => {
      await db.collection('purchases').updateOne({ _id: purchaseId }, { $set: { status: 'rejected' } }, { session });
      await db.collection('tickets').updateMany({ purchaseId: purchaseId }, { $set: { status: 'rejected' } }, { session });
    });
    res.json({ message: 'Booking rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject booking' });
  } finally {
    await session.endSession();
  }
});
app.get('/api/tickets/status/:phone', async (req, res) => { 
  try {
    const { phone } = req.params;
    const cleanPhone = phone.trim(); 
    const purchases = await db.collection('purchases').find({ phone: cleanPhone }).toArray();
    if (!purchases || purchases.length === 0) {
      return res.status(404).json({ message: 'No booking found for this phone number.' });
    }
    const purchaseIds = purchases.map(p => p._id);
    const tickets = await db.collection('tickets').find({
      purchaseId: { $in: purchaseIds }, 
      status: { $in: ['approved', 'pending-approval', 'rejected', 'payment-pending'] } 
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
app.post('/api/verify', verifyToken, async (req, res) => { 
  try {
    const { id } = req.body;
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ valid: false, message: 'Invalid QR Code' });
    }
    const ticket = await db.collection('tickets').findOne({ _id: new ObjectId(id) });
    if (!ticket) { return res.status(404).json({ valid: false, message: 'Ticket Not Found' }); }
    if (ticket.status !== 'approved') { return res.status(403).json({ valid: false, message: `Ticket status is: ${ticket.status.toUpperCase()}` }); }
    if (ticket.checkedIn) { return res.status(409).json({ valid: false, message: 'Ticket Already Checked In', name: ticket.attendeeName }); }

    await db.collection('tickets').updateOne(
      { _id: new ObjectId(id) },
      { $set: { checkedIn: true, checkedInAt: new Date() } }
    );
    res.status(200).json({ valid: true, message: 'Check-in Successful', name: ticket.attendeeName });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ valid: false, message: 'Server Error' });
  }
});

connectToDb().then(() => {
  createAdminUser('admin', 'DholRatri2025!'); 
  app.listen(PORT, () => {
    console.log(`🎉 Server is running with SECURE logic on http://localhost:${PORT}`);
  });
});