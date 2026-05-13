require('dotenv').config();
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');

async function seedMockTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const requestId = 'TEST-VERIFY-123';
        const mockHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; // Example SHA-256

        // 1. Create Mock Request
        await Request.deleteMany({ requestId }); // Clean old ones
        const request = await Request.create({
            requestId,
            name: 'Sarah Jane Doe',
            status: 'Released',
            documentType: 'Transcript of Records',
            documentHash: mockHash,
            dateRequested: new Date()
        });
        console.log('Mock Request created');

        // 2. Create Mock Transaction
        await Transaction.deleteMany({ requestId });
        await Transaction.create({
            transactionId: 'TXN-BLOCK-999',
            requestId,
            name: 'Sarah Jane Doe',
            documentType: 'Transcript of Records',
            amount: '150.00',
            status: 'Completed',
            date: new Date()
        });
        console.log('Mock Transaction created');

        console.log('\n--- MOCK TEST DATA ---');
        console.log('Request ID:', requestId);
        console.log('Document Hash:', mockHash);
        console.log('----------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding mock test:', error);
        process.exit(1);
    }
}

seedMockTest();
