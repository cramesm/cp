// Last updated: 2026-03-26
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const SystemAdmin = require('./models/Users/SystemAdmin');
const Admin = require('./models/Users/Admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/verifitor')
.then(async () => {
    console.log('MongoDB Initialized for Verifitor');
    await seedUsers();
})
.catch(err => console.error('MongoDB error:', err));

// Initial seed function
async function seedUsers() {
    try {
        // 1. Seed System Admin
        const sysCount = await SystemAdmin.countDocuments();
        if (sysCount === 0) {
            const sysAdmin = new SystemAdmin({
                email: 'sysadmin@verifitor.com',
                password: 'sysadmin123',
                role: 'system admin'
            });
            await sysAdmin.save();
            console.log('Default System Admin created (sysadmin@verifitor.com / sysadmin123)');
        }

        // 2. Seed Standard Admin
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const admin = new Admin({
                email: 'admin@verifitor.com',
                password: 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log('Default Admin created (admin@verifitor.com / admin123)');
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
}

// Import Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const requestRoutes = require('./routes/requests');
const transactionRoutes = require('./routes/transactions');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/adminManagement');
const activityLogRoutes = require('./routes/activityLogs');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/activity-logs', activityLogRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'API is running' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
