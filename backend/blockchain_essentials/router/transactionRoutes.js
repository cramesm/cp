const express = require("express");
const TransactionController = require("../controller/transactionController");

const router = express.Router();

const { auth, superAdminOnly } = require("../../middleware/authMiddleware");

router.post("/", auth, TransactionController.createTransaction);
router.get("/my-transactions", auth, TransactionController.getMyTransactions);
router.get("/verify/:referenceNumber", TransactionController.verifyTransaction);
router.get("/verify-by-id/:studentIDNumber", TransactionController.verifyTransactionByStudentID);

// Super Admin delete endpoints
router.post("/bulk-delete", auth, superAdminOnly, TransactionController.bulkDeleteTransactions);
router.delete("/:id", auth, superAdminOnly, TransactionController.deleteTransaction);

module.exports = router;