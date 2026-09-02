const express = require("express");
const TransactionController = require("../controller/transactionController");

const router = express.Router();

const { protect, superAdminOnly } = require("../../middleware/authMiddleware");

router.post("/", protect, TransactionController.createTransaction);
router.get("/my-transactions", protect, TransactionController.getMyTransactions);
router.get("/verify/:referenceNumber", TransactionController.verifyTransaction);
router.get("/verify-by-id/:studentIDNumber", TransactionController.verifyTransactionByStudentID);

// Super Admin delete endpoints
router.post("/bulk-delete", protect, superAdminOnly, TransactionController.bulkDeleteTransactions);
router.delete("/:id", protect, superAdminOnly, TransactionController.deleteTransaction);

module.exports = router;