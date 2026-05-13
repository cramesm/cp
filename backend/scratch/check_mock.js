require('dotenv').config();
const mongoose = require('mongoose');
const Request = require('../models/Request');

async function checkHash() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const req = await Request.findOne({ requestId: 'TEST-VERIFY-123' });
        console.log('Request in DB:', req);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
checkHash();
