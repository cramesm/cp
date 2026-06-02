const { ethers, FetchRequest } = require("ethers");

let provider;
if (process.env.BESU_RPC_URL && process.env.BESU_RPC_URL.includes("ngrok")) {
  const req = new FetchRequest(process.env.BESU_RPC_URL);
  req.setHeader("ngrok-skip-browser-warning", "69420");
  provider = new ethers.JsonRpcProvider(req);
} else {
  provider = new ethers.JsonRpcProvider(process.env.BESU_RPC_URL);
}

const wallet = new ethers.Wallet(
  process.env.SERVER_WALLET_PRIVATE_KEY,
  provider
);

module.exports = {
  provider,
  wallet,
};