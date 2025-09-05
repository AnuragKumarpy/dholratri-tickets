const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const qrcode = require('qrcode');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectToDb() {
  try {
    await client.connect();
    db = client.db('dholratriDB');
    console.log("🗄️ Successfully connected to MongoDB Atlas!");
  } catch (err) { console.error("Failed to connect to MongoDB", err); process.exit(1); }
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const PORT = 5001;

// All previous routes (bookings, admin, status) remain the same...
app.post('/api/bookings', upload.single('screenshot'), async (req, res) => {
  try {
    const { fullName, phone, utr } = req.body;
    const newBooking = { fullName, phone, utr, screenshotPath: req.file.path, status: 'pending', createdAt: new Date() };
    const result = await db.collection('bookings').insertOne(newBooking);
    res.status(201).json({ status: 'pending', message: `Booking for ${fullName} received and is now under review.` });
  } catch (error) { res.status(500).json({ message: 'Error processing your booking.' }); }
});
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await db.collection('bookings').find({ status: 'pending' }).toArray();
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch bookings' }); }
});
app.patch('/api/admin/bookings/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const qrCodeDataUrl = await qrcode.toDataURL(id);
    await db.collection('bookings').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'approved', qrCodeDataUrl: qrCodeDataUrl } });
    res.json({ message: 'Booking approved and QR code generated' });
  } catch (error) { res.status(500).json({ message: 'Failed to approve booking' }); }
});
app.patch('/api/admin/bookings/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('bookings').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'rejected' } });
        res.json({ message: 'Booking rejected' });
    } catch (error) { res.status(500).json({ message: 'Failed to reject booking' }); }
});
app.get('/api/bookings/status/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const booking = await db.collection('bookings').findOne({ phone: phone });
    if (booking) { res.json(booking); } 
    else { res.status(404).json({ message: 'No booking found for this phone number.' }); }
  } catch (error) { res.status(500).json({ message: 'Error fetching booking status.' }); }
});

// --- NEW SCANNER VERIFICATION ROUTE ---
app.post('/api/verify', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ valid: false, message: 'Invalid QR Code' });
    }

    const booking = await db.collection('bookings').findOne({ _id: new ObjectId(id) });

    if (!booking) {
      return res.status(404).json({ valid: false, message: 'Ticket Not Found' });
    }

    if (booking.status !== 'approved') {
      return res.status(403).json({ valid: false, message: `Ticket status is: ${booking.status}` });
    }

    if (booking.checkedIn) {
      return res.status(409).json({ valid: false, message: 'Ticket Already Checked In', name: booking.fullName });
    }

    // Success! Mark as checked in
    await db.collection('bookings').updateOne(
      { _id: new ObjectId(id) },
      { $set: { checkedIn: true, checkedInAt: new Date() } }
    );

    res.status(200).json({ valid: true, message: 'Check-in Successful', name: booking.fullName });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ valid: false, message: 'Server Error' });
  }
});

connectToDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🎉 Server is running on http://localhost:${PORT}`);
  });
});