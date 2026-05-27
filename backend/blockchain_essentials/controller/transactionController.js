const mongoose = require("mongoose");  
const BlockchainTransaction = require("../modelBC/blockchainTransactionModel");
const {
    recordTransactionOnBlockchain,
    verifyTransactionOnBlockchain,
} = require("../middlewareBC/blockchainMiddleware");

const createReferenceNumber = () => {
    return `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const TransactionController = {

    /* CREATE TRANSACTION */
    createTransaction: async (req, res) => {
        try {
            const { typeOfDocument, nameOfStudent, studentIDNumber, nameOfSchool, yearGraduated } = req.body;
            const referenceNumber = createReferenceNumber();
            const transaction = await BlockchainTransaction.create({
                user: new mongoose.Types.ObjectId(req.user.id),
                referenceNumber,
                typeOfDocument,
                nameOfStudent,
                studentIDNumber,
                nameOfSchool,
                yearGraduated,
                blockchainTxHash: "",
                blockchainBlockNumber: null,
                blockchainStatus: "Pending",
                createdByEmail: req.user.email, 
            });

            try {
                const blockchainResult = await recordTransactionOnBlockchain({
                    referenceNumber,
                    typeOfDocument,
                    nameOfStudent,
                    studentIDNumber,
                    nameOfSchool,
                    yearGraduated,
                });

                transaction.blockchainTxHash = blockchainResult.transactionHash;
                transaction.blockchainBlockNumber = blockchainResult.blockNumber;
                transaction.blockchainStatus = blockchainResult.status;

                await transaction.save();

                return res.status(201).json({
                    message: "Transaction recorded successfully",
                    transaction,
                });
            } catch (blockchainError) {
                console.error("Blockchain error full object:", blockchainError);
                console.error("Blockchain error message:", blockchainError.message);
                console.error("Blockchain error reason:", blockchainError.reason);
                console.error("Blockchain error shortMessage:", blockchainError.shortMessage);
                console.error("Blockchain error data:", blockchainError.data);

                transaction.blockchainStatus = "Failed";
                await transaction.save();

                return res.status(500).json({
                    message: "Transaction saved but blockchain recording failed",
                    transaction,
                    blockchainError: {
                        message: blockchainError.message,
                        reason: blockchainError.reason,
                        shortMessage: blockchainError.shortMessage,
                        data: blockchainError.data,
                    },
                });
            }
        } catch (error) {
    console.error("Transaction creation failed:", error); // ← add this
    return res.status(500).json({
        message: "Transaction creation failed",
        error: error.message,
    });
}
    },

    /* GET USER'S TRANSACTIONS */
getMyTransactions: async (req, res) => {
    try {
        console.log("=== getMyTransactions DEBUG ===");
        console.log("req.user:", req.user);
        console.log("req.user.id:", req.user.id);

        const userId = new mongoose.Types.ObjectId(req.user.id);
        console.log("userId as ObjectId:", userId);

       const query = req.user.role === 'super admin' ? {} : { user: userId };
    const transactions = await BlockchainTransaction.find(query).sort({ createdAt: -1 });

        console.log("Transactions found:", transactions.length);
        console.log("Sample user field in DB:", transactions[0]?.user);

        return res.json(transactions);
        } catch (error) {
            return res.status(500).json({
                message: "Failed to fetch transactions",
                error: error.message,
            });
        }
    },

    /* VERIFY TRANSACTION */
    verifyTransaction: async (req, res) => {
        try {
            const { referenceNumber } = req.params;

            const transaction = await BlockchainTransaction.findOne({ referenceNumber });

            if (!transaction) {
                return res.status(404).json({
                    message: "No transaction found in database",
                });
            }

            const blockchainRecord = await verifyTransactionOnBlockchain(
                referenceNumber
            );

            return res.json({
                databaseRecord: transaction,
                blockchainRecord,
                verified: blockchainRecord.exists,
            });
        } catch (error) {
            return res.status(500).json({
                message: "Verification failed",
                error: error.message,
            });
        }
    },

    /* VERIFY TRANSACTION BY STUDENT ID NUMBER */
    verifyTransactionByStudentID: async (req, res) => {
        try {
            const { studentIDNumber } = req.params;

            const transaction = await BlockchainTransaction.findOne({ studentIDNumber });

            if (!transaction) {
                return res.status(404).json({
                    message: "No transaction found for this student ID number",
                });
            }

            const blockchainRecord = await verifyTransactionOnBlockchain(
                transaction.referenceNumber
            );

            return res.json({
                databaseRecord: transaction,
                blockchainRecord,
                verified: blockchainRecord.exists,
            });
        } catch (error) {
            return res.status(500).json({
                message: "Verification failed",
                error: error.message,
            });
        }
    }
};

module.exports = TransactionController;