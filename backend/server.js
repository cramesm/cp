require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded files (receipts, etc.) as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Supabase connection check + seed
async function initializeDatabase() {
    try {
        // Test connection
        const { data, error } = await supabase.from('system_admins').select('id').limit(1);
        if (error) throw error;
        console.log('Supabase connected successfully for Verifitor');

        await seedUsers();
    } catch (err) {
        console.error('Supabase connection error:', err.message);
    }
}

// Initial seed function
async function seedUsers() {
    try {
        // 1. Seed System Admin
        const { data: existingSysAdmin } = await supabase
            .from('system_admins')
            .select('id')
            .eq('email', 'sysadmin@verifitor.com')
            .single();

        if (!existingSysAdmin) {
            const hashedPassword = await bcrypt.hash('sysadmin123', 10);
            const { error } = await supabase.from('system_admins').insert({
                email: 'sysadmin@verifitor.com',
                password: hashedPassword,
                role: 'system admin',
                name: 'System Admin'
            });
            if (error) throw error;
            console.log('Default System Admin created (sysadmin@verifitor.com / sysadmin123)');
        }

        // 2. Seed Standard Admin
        const { data: existingAdmin } = await supabase
            .from('admins')
            .select('id')
            .eq('email', 'admin@verifitor.com')
            .single();

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const { error } = await supabase.from('admins').insert({
                email: 'admin@verifitor.com',
                password: hashedPassword,
                role: 'admin',
                name: 'Admin'
            });
            if (error) throw error;
            console.log('Default Admin created (admin@verifitor.com / admin123)');
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
}

// Initialize database
initializeDatabase();

// Import Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const requestRoutes = require('./routes/requests');
const transactionRoutes = require('./routes/transactions');
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
