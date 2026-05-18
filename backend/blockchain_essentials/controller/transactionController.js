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
            const { typeOfDocument, nameOfStudent, studentSONumber, nameOfSchool, yearGraduated } = req.body;

            const referenceNumber = createReferenceNumber();

            const transaction = await BlockchainTransaction.create({
                user: new mongoose.Types.ObjectId(req.user.id),
                referenceNumber,
                typeOfDocument,
                nameOfStudent,
                studentSONumber,
                nameOfSchool,
                yearGraduated,
                blockchainTxHash: "",
                blockchainBlockNumber: null,
                blockchainStatus: "Pending",
            });

            try {
                const blockchainResult = await recordTransactionOnBlockchain({
                    referenceNumber,
                    typeOfDocument,
                    nameOfStudent,
                    studentSONumber,
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
            const transactions = await BlockchainTransaction.find({ user: new mongoose.Types.ObjectId(req.user.id) }).sort({
                createdAt: -1,
            });

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

    /* VERIFY TRANSACTION BY STUDENT SO NUMBER */
    verifyTransactionByStudentSO: async (req, res) => {
        try {
            const { studentSONumber } = req.params;

            const transaction = await BlockchainTransaction.findOne({ studentSONumber });

            if (!transaction) {
                return res.status(404).json({
                    message: "No transaction found for this student S/O number",
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