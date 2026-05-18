const { ethers } = require("ethers");

let provider;
let wallet;

try {
  const rpcUrl = process.env.BESU_RPC_URL || "http://127.0.0.1:8545";
  provider = new ethers.JsonRpcProvider(rpcUrl);

  // Resilient private key fallback to avoid server crash on start
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
  wallet = new ethers.Wallet(privateKey, provider);

  console.log(`[Blockchain Config] Resilient setup loaded with RPC URL: ${rpcUrl}`);
} catch (error) {
  console.warn("[Blockchain Config] WARNING: Live RPC connection failed. Defaulting to mock config objects to prevent crash.");
  provider = null;
  wallet = null;
}

module.exports = {
  provider,
  wallet,
};