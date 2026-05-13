require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    console.log('Testing connection to:', process.env.MONGODB_URI.split('@')[1]); // Log cluster info only
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Test Connection Successful!');
        process.exit(0);
    } catch (error) {
        console.error('Test Connection Failed:', error.message);
        process.exit(1);
    }
}

testConnection();
