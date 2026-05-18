const express = require("express");
const TransactionController = require("../controller/transactionController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, TransactionController.createTransaction);
router.get("/my-transactions", protect, TransactionController.getMyTransactions);
router.get("/verify/:referenceNumber", protect, TransactionController.verifyTransaction);
router.get("/verify-by-so/:studentSONumber", protect, TransactionController.verifyTransactionByStudentSO);

module.exports = router;