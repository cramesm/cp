const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const blockchainService = require('../services/blockchainService');

// @route   GET /api/verify/:hash
// @desc    Verify a document by its hash
router.get('/:hash', async (req, res) => {
    try {
        const request = await Request.findOne({ 
            $or: [
                { documentHash: req.params.hash },
                { requestId: req.params.hash }
            ]
        });
        
        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid Document Hash. This document was not issued by our system.' 
            });
        }

        // Query the Blockchain Ledger (Live RPC or Local Proof-of-Work Fallback)
        const blockchainResult = await blockchainService.verifyDocumentHash(request.documentHash || req.params.hash);

        // Fetch GCash/Maya transaction details for legacy compatibility
        const transaction = await Transaction.findOne({ requestId: request.requestId });

        res.json({
            success: true,
            data: {
                requestId: request.requestId,
                ownerName: request.name,
                status: request.status,
                issuedDate: request.updatedAt,
                documentHash: request.documentHash,
                blockchainRecord: blockchainResult.isVerified ? {
                    txID: blockchainResult.txID || (transaction ? transaction.transactionId : 'N/A'),
                    date: blockchainResult.date || (transaction ? transaction.date : new Date()),
                    blockNumber: blockchainResult.blockNumber,
                    blockHash: blockchainResult.blockHash,
                    nonce: blockchainResult.nonce,
                    miner: blockchainResult.miner,
                    status: blockchainResult.status,
                    contractAddress: blockchainResult.contractAddress,
                    isSimulated: blockchainResult.isSimulated
                } : (transaction ? {
                    txID: transaction.transactionId,
                    date: transaction.date,
                    status: 'Secured on Local Database Index Only'
                } : null)
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

module.exports = router;
