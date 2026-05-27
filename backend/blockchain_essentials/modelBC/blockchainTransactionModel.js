const mongoose = require("mongoose");

const blockchainTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByEmail: { 
      type: String, 
      default: '' 
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    typeOfDocument: {
      type: String,
      required: true,
    },
    nameOfStudent: {
      type: String,
      required: true,
    },
    studentIDNumber: {
      type: String,
      required: true,
    },
    nameOfSchool: {
      type: String,
      required: true,
    },
    yearGraduated: {
      type: Number,
      required: true,
    },
    blockchainTxHash: {
      type: String,
      default: "",          // ← removed required
    },
    blockchainBlockNumber: {
      type: Number,
      default: null,        // ← removed required, allow null
    },
    blockchainStatus: {
      type: String,
      enum: ["Pending", "Recorded", "Failed"],
      default: "Pending",   // ← changed from "Recorded" to "Pending"
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Blockchain_Transaction ||
  mongoose.model("Blockchain_Transaction", blockchainTransactionSchema, "Blockchain_Transaction");