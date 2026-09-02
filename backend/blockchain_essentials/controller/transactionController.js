const mongoose = require("mongoose");  
const BlockchainTransaction = require("../modelBC/blockchainTransactionModel");
const {
    recordTransactionOnBlockchain,
    verifyTransactionOnBlockchain,
} = require("../middlewareBC/blockchainMiddleware");

const createReferenceNumber = () => {
    return `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getUserIdentifier = (reqUser) => {
    if (!reqUser) return null;
    return reqUser.id || reqUser._id || reqUser.userId || null;
};

const buildStoredBlockchainRecord = (transaction, errorMessage) => ({
    referenceNumber: transaction.referenceNumber,
    typeOfDocument: transaction.typeOfDocument,
    nameOfStudent: transaction.nameOfStudent,
    studentIDNumber: transaction.studentIDNumber,
    nameOfSchool: transaction.nameOfSchool,
    yearGraduated: String(transaction.yearGraduated),
    ownerType: transaction.ownerType,
    course: transaction.course,
    yearLevel: transaction.yearLevel,
    recordedBy: transaction.createdByEmail || '',
    timestamp: transaction.createdAt ? String(Math.floor(new Date(transaction.createdAt).getTime() / 1000)) : '0',
    exists: Boolean(transaction.blockchainTxHash || transaction.blockchainStatus === 'Recorded'),
    fallback: true,
    error: errorMessage,
});

const TransactionController = {

    /* CREATE TRANSACTION */
    createTransaction: async (req, res) => {
        try {
            const { typeOfDocument, nameOfStudent, studentIDNumber, nameOfSchool, yearGraduated, ownerType, course, yearLevel } = req.body;
            const userId = getUserIdentifier(req.user);

            if (!userId) {
                return res.status(401).json({ message: "User session is invalid" });
            }

            if (!mongoose.isValidObjectId(userId)) {
                console.warn("Invalid user identifier for blockchain transaction creation:", userId);
                return res.status(401).json({ message: "User session is invalid" });
            }

            const referenceNumber = createReferenceNumber();
            const transaction = await BlockchainTransaction.create({
                user: new mongoose.Types.ObjectId(userId),
                referenceNumber,
                typeOfDocument,
                nameOfStudent,
                studentIDNumber,
                nameOfSchool,
                yearGraduated: yearGraduated || 0,
                ownerType: ownerType || 'Student',
                course: course || '',
                yearLevel: yearLevel || '',
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
                    yearGraduated: yearGraduated || 0,
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
        const userId = getUserIdentifier(req.user);

        if (!userId) {
            return res.status(401).json({ message: "User session is invalid" });
        }

        if (!mongoose.isValidObjectId(userId)) {
            console.warn("Invalid user identifier for fetching blockchain transactions:", userId);
            return res.json([]);
        }

        const query = {};
        const transactions = await BlockchainTransaction.find(query).sort({ createdAt: -1 });

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

            if (blockchainRecord.error && transaction.blockchainStatus === 'Recorded') {
                const storedBlockchainRecord = buildStoredBlockchainRecord(
                    transaction,
                    blockchainRecord.error
                );

                return res.json({
                    databaseRecord: transaction,
                    blockchainRecord: storedBlockchainRecord,
                    verified: true,
                    message: 'Verified from stored blockchain record because live contract verification is unavailable.',
                });
            }

            return res.json({
                databaseRecord: transaction,
                blockchainRecord,
                verified: blockchainRecord.exists,
                message: blockchainRecord.error || undefined,
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
            const studentIDNumber = (req.params.studentIDNumber || '').trim();

            if (!studentIDNumber) {
                return res.status(400).json({
                    message: "Student ID number is required",
                });
            }

            const normalizedStudentId = escapeRegex(studentIDNumber);
            const transaction = await BlockchainTransaction.findOne({
                $or: [
                    { studentIDNumber: studentIDNumber },
                    { studentIDNumber: new RegExp(`^${normalizedStudentId}$`, 'i') },
                    { studentSONumber: studentIDNumber },
                    { studentSONumber: new RegExp(`^${normalizedStudentId}$`, 'i') },
                ],
            }).sort({ createdAt: -1 });

            if (!transaction) {
                return res.status(404).json({
                    message: "No transaction found for this student ID number",
                });
            }

            const blockchainRecord = await verifyTransactionOnBlockchain(
                transaction.referenceNumber
            );

            if (blockchainRecord.error && transaction.blockchainStatus === 'Recorded') {
                const storedBlockchainRecord = buildStoredBlockchainRecord(
                    transaction,
                    blockchainRecord.error
                );

                return res.json({
                    databaseRecord: transaction,
                    blockchainRecord: storedBlockchainRecord,
                    verified: true,
                    message: 'Verified from stored blockchain record because live contract verification is unavailable.',
                });
            }

            return res.json({
                databaseRecord: transaction,
                blockchainRecord,
                verified: blockchainRecord.exists,
                message: blockchainRecord.error || undefined,
            });
        } catch (error) {
            return res.status(500).json({
                message: "Verification failed",
                error: error.message,
            });
        }
    },

    /* BULK DELETE BLOCKCHAIN TRANSACTIONS (Super Admin only) */
    bulkDeleteTransactions: async (req, res) => {
        try {
            const { transactionIds, referenceNumbers } = req.body;
            const idsToDelete = transactionIds || referenceNumbers;

            if (!Array.isArray(idsToDelete) || idsToDelete.length === 0) {
                return res.status(400).json({ success: false, message: "Please provide an array of transaction IDs or reference numbers to delete." });
            }

            const objectIds = idsToDelete.filter(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));

            const result = await BlockchainTransaction.deleteMany({
                $or: [
                    { referenceNumber: { $in: idsToDelete } },
                    { _id: { $in: objectIds } }
                ]
            });

            try {
                const ActivityLog = require("../../models/ActivityLog");
                await ActivityLog.create({
                    userEmail: req.user?.email || 'admin@verifitor.com',
                    userName: req.user?.name || 'Super Admin',
                    action: 'Bulk Delete Blockchain Transactions',
                    type: 'Blockchain',
                    status: 'Successful',
                    details: `Bulk deleted ${result.deletedCount} blockchain transaction record(s).`
                });
            } catch (logErr) {
                console.warn('Failed to create activity log for bulk blockchain deletion:', logErr.message);
            }

            return res.json({
                success: true,
                message: `Successfully deleted ${result.deletedCount} blockchain transaction(s).`,
                deletedCount: result.deletedCount
            });
        } catch (error) {
            console.error("Bulk delete blockchain transactions error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to bulk delete blockchain transactions",
                error: error.message
            });
        }
    },

    /* DELETE SINGLE BLOCKCHAIN TRANSACTION (Super Admin only) */
    deleteTransaction: async (req, res) => {
        try {
            const { id } = req.params;

            const isObjectId = typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);
            const transaction = await BlockchainTransaction.findOneAndDelete({
                $or: [
                    { referenceNumber: id },
                    ...(isObjectId ? [{ _id: id }] : [])
                ]
            });

            if (!transaction) {
                return res.status(404).json({ success: false, message: "Blockchain transaction not found." });
            }

            try {
                const ActivityLog = require("../../models/ActivityLog");
                await ActivityLog.create({
                    userEmail: req.user?.email || 'admin@verifitor.com',
                    userName: req.user?.name || 'Super Admin',
                    action: 'Delete Blockchain Transaction',
                    type: 'Blockchain',
                    status: 'Successful',
                    details: `Deleted blockchain transaction ${transaction.referenceNumber} (${transaction.nameOfStudent || 'User'}).`
                });
            } catch (logErr) {
                console.warn('Failed to create activity log for blockchain deletion:', logErr.message);
            }

            return res.json({
                success: true,
                message: `Blockchain transaction ${transaction.referenceNumber} deleted successfully.`
            });
        } catch (error) {
            console.error("Delete blockchain transaction error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete blockchain transaction",
                error: error.message
            });
        }
    }
};

module.exports = TransactionController;