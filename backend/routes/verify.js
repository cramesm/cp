const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// @route   GET /api/verify/:hash
// @desc    Verify a document by its hash
router.get('/:hash', async (req, res) => {
    try {
        const { data: request } = await supabase
          .from('requests').select('*').eq('document_hash', req.params.hash).single();
        
        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid Document Hash. This document was not issued by our system.' 
            });
        }

        // Check for blockchain record
        const { data: transaction } = await supabase
          .from('transactions').select('*').eq('request_id', request.request_id).single();

        res.json({
            success: true,
            data: {
                requestId: request.request_id,
                ownerName: request.name,
                status: request.status,
                issuedDate: request.updated_at,
                blockchainRecord: transaction ? {
                    txID: transaction.transaction_id,
                    date: transaction.date
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

module.exports = router;
