const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/stats', async (req, res) => {
  try {
    const { count: totalRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true });
    const { count: pendingRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    const { count: inProcessRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'In Process');
    const { count: approvedRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Approved');
    const { count: releasedRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Released');
    const { count: blockchainTransactions } = await supabase.from('transactions').select('*', { count: 'exact', head: true });

    res.json({
      totalRequests: totalRequests || 0,
      pendingRequests: pendingRequests || 0,
      inProcessRequests: inProcessRequests || 0,
      approvedRequests: approvedRequests || 0,
      releasedRequests: releasedRequests || 0,
      blockchainTransactions: blockchainTransactions || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

router.get('/recent', async (req, res) => {
   try {
     const { data: transactions } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(5);
     const { data: notifications } = await supabase.from('notifications').select('*').order('date', { ascending: false }).limit(5);
     const { data: pendingRequests } = await supabase.from('requests').select('*').eq('status', 'Pending').order('date_requested', { ascending: false }).limit(5);

     res.json({
         transactions: transactions || [],
         notifications: notifications || [],
         pendingRequests: pendingRequests || []
     });
   } catch (error) {
     res.status(500).json({ message: 'Error fetching recent activity' });
   }
});

module.exports = router;
