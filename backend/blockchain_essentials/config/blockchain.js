const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.BESU_RPC_URL);

const wallet = new ethers.Wallet(
  process.env.SERVER_WALLET_PRIVATE_KEY,
  provider
);

module.exports = {
  provider,
  wallet,
};