const { ethers } = require("ethers");
const { wallet } = require("../config/blockchain");
const contractJson = require("../abis/TransactionLedger.json");

const getContract = () => {
  return new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractJson.abi,
    wallet
  );
};

const recordTransactionOnBlockchain = async ({
  referenceNumber,
  typeOfDocument,
  nameOfStudent,
  studentSONumber,
  nameOfSchool,
  yearGraduated,
}) => {
  const contract = getContract();

  console.log(contract);

  const tx = await contract.recordTransaction(
    referenceNumber,
    typeOfDocument,
    nameOfStudent,
    studentSONumber,
    nameOfSchool,
    yearGraduated
  );

  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status === 1 ? "Recorded" : "Failed",
  };
};

const verifyTransactionOnBlockchain = async (referenceNumber) => {
  const contract = getContract();

  const result = await contract.verifyTransaction(referenceNumber);

  return {
    referenceNumber: result[0],
    typeOfDocument: result[1],
    nameOfStudent: result[2],
    studentSONumber: result[3],
    nameOfSchool: result[4],
    yearGraduated: result[5].toString(),
    recordedBy: result[6],
    timestamp: result[7].toString(),
    exists: result[8],
  };
};

module.exports = {
  recordTransactionOnBlockchain,
  verifyTransactionOnBlockchain,
};