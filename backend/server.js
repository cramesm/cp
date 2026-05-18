require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
        await seedUsers();
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Initial seed function for MongoDB
async function seedUsers() {
    const SystemAdmin = require('./models/Users/SystemAdmin');
    const Registrar = require('./models/Registrar');
    
    try {
        // 1. Seed System Admin
        const existingSysAdmin = await SystemAdmin.findOne({ email: 'sysadmin@verifitor.com' });
        if (!existingSysAdmin) {
            await SystemAdmin.create({
                email: 'sysadmin@verifitor.com',
                password: 'sysadmin123', // Model handles hashing
                role: 'system admin',
                name: 'System Admin'
            });
            console.log('Default System Admin created (sysadmin@verifitor.com / sysadmin123)');
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

console.log('Routes imported successfully');

// Mount Routes
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

console.log('Routes mounted successfully');

app.get('/api/health', (req, res) => {
    res.json({ status: 'API is running' });
});

// Test route for debugging
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
