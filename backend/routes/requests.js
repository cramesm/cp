const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../supabaseClient');
const { protect } = require('../middleware/authMiddleware');

// Get all requests
router.get('/', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('requests').select('*').order('date_requested', { ascending: false });
    if (error) throw error;
    res.json(requests || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests' });
  }
});

// Update a request (Logged)
router.put('/:id', protect, async (req, res) => {
    try {
        const { status, name } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (name) updateData.name = name;

        const { data: request, error } = await supabase
            .from('requests')
            .update(updateData)
            .eq('request_id', req.params.id)
            .select()
            .single();

        if (error || !request) return res.status(404).json({ message: 'Request not found' });

        // Log activity
        await supabase.from('activity_logs').insert({
            user_email: req.user.email,
            user_name: req.user.name || 'User',
            action: 'Update Request',
            type: '------',
            status: 'Successful',
            details: `Updated request ${req.params.id} status to ${status || 'unchanged'}`
        });

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error updating request' });
    }
});

// Generate Hash for request (Logged)
router.post('/:id/generate-hash', protect, async (req, res) => {
    try {
        const { data: request, error: fetchError } = await supabase
          .from('requests').select('*').eq('request_id', req.params.id).single();
        if (fetchError || !request) return res.status(404).json({ message: 'Request not found' });

        // Generate SHA-256 hash
        const hash = crypto.createHash('sha256')
            .update(`${request.request_id}-${request.name}-${Date.now()}`)
            .digest('hex');

        const { error: updateError } = await supabase
          .from('requests').update({ document_hash: hash }).eq('request_id', req.params.id);
        if (updateError) throw updateError;

        // Log activity
        await supabase.from('activity_logs').insert({
            user_email: req.user.email,
            user_name: req.user.name || 'User',
            action: 'Hash Generation',
            type: request.document_type || '------',
            status: 'Successful',
            details: `Generated secure SHA-256 hash for request ${req.params.id}`
        });

        res.json({ message: 'Hash generated successfully', hash });
    } catch (error) {
        res.status(500).json({ message: 'Error generating hash' });
    }
});

// Create a new request (Logged)
router.post('/', protect, async (req, res) => {
  try {
    const requestId = req.body.requestId || 'REQ-' + Date.now();
    const userName = req.user.name || 'User';

    const { data: newDoc, error } = await supabase.from('requests').insert({
      request_id: requestId,
      name: userName,
      status: req.body.status || 'Pending',
      document_type: req.body.documentType,
      sub_document_type: req.body.subDocumentType || '',
      purpose: req.body.purpose || '',
      other_purpose: req.body.otherPurpose || '',
      quantity: req.body.quantity || 1,
    }).select().single();

    if (error) throw error;

    // Log the activity
    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: userName,
      action: 'Create Request',
      type: req.body.documentType || '------',
      status: 'Successful',
      details: `Created new document request for: ${userName}`
    });

    res.json(newDoc);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
});

module.exports = router;
