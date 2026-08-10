require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Helmet Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://vercel.live"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "http://localhost:5000", "https://*.vercel.app", "https://vercel.live", "wss://ws-us3.pusher.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    },
  },
  crossOriginEmbedderPolicy: false, 
  crossOriginOpenerPolicy: { policy: "same-origin" }
}));

// Allow CORS dynamically for all Vercel environments
const corsOptions = {
  origin: true, // This automatically reflects the requesting origin perfectly
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.options('*', cors(corsOptions)); // Explicitly handle all preflight requests
app.use(cors(corsOptions));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectDB = async () => {
    try {
        console.log('Connecting to primary MongoDB (Atlas)...');
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
        console.log('MongoDB (Atlas) connected successfully');
        await seedUsers();
    } catch (err) {
        console.warn('MongoDB Atlas connection failed:', err.message);
        console.log('Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/verifitor)...');
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/verifitor', { serverSelectionTimeoutMS: 4000 });
            console.log('MongoDB (Local Fallback) connected successfully!');
            await seedUsers();
        } catch (localErr) {
            console.error('Critical Database Error: Both Atlas and Local MongoDB connections failed!');
            console.error('Local error:', localErr.message);
            process.exit(1);
        }
    }
};

// Initial seed function for MongoDB
async function seedUsers() {
    const SuperAdmin = require('./models/Users/SuperAdmin');
    const Registrar = require('./models/Registrar');
    
    try {
        // 1. Seed Super Admin
        const existingSuperAdmin = await SuperAdmin.findOne({ email: 'sysadmin@verifitor.com' });
        if (!existingSuperAdmin) {
            await SuperAdmin.create({
                email: 'sysadmin@verifitor.com',
                password: 'sysadmin123', // Model handles hashing
                role: 'super admin',
                name: 'Super Admin'
            });
            console.log('Default Super Admin created (sysadmin@verifitor.com / sysadmin123)');
        }

        // 2. Seed Standard Registrars
        const registrarsToSeed = [
            { email: 'admin@verifitor.com', password: 'admin123', name: 'Admin', registrarId: 'REG-001' },
            { email: 'saetsmurf1@gmail.com', password: 'admin123', name: 'Primary Admin', registrarId: 'REG-002' }
        ];

        for (const reg of registrarsToSeed) {
            const existingReg = await Registrar.findOne({ email: reg.email });
            if (!existingReg) {
                await Registrar.create({
                    email: reg.email,
                    password: reg.password,
                    role: 'registrar',
                    name: reg.name,
                    registrarId: reg.registrarId
                });
                console.log(`Default Registrar created (${reg.email} / ${reg.password})`);
            }
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
}

connectDB();

// Import Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const requestRoutes = require('./routes/requests');
const transactionRoutes = require('./routes/transactions');
const blockchainTransactionRoutes = require('./blockchain_essentials/router/transactionRoutes');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/adminManagement');
const activityLogRoutes = require('./routes/activityLogs');
const registrarRoutes = require('./routes/registrars');
const verifyRoutes = require('./routes/verify');
const torRoutes = require('./routes/tor');
const documentRoutes = require('./routes/documents');
const studentRoutes = require('./routes/students');
const diplomaRoutes = require('./routes/diploma');
const documentUploadRoutes = require('./routes/documentUploads');
const alumniRoutes = require('./routes/alumni');

console.log('Routes imported successfully');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/blockchain/transactions', blockchainTransactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/registrars', registrarRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/tor', torRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/v1/students', studentRoutes); // V1 Migration
app.use('/api/diploma', diplomaRoutes);
app.use('/api/requests', documentUploadRoutes);
app.use('/api/v1/alumni', alumniRoutes); // V1 Migration

console.log('Routes mounted successfully');

app.get('/api/health', (req, res) => {
    res.json({ status: 'API is running' });
});

// Test route for debugging
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

// Global error handler for Express 5 async errors
app.use((err, req, res, next) => {
    console.error('=== GLOBAL ERROR HANDLER ===');
    console.error('Route:', req.method, req.originalUrl);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
