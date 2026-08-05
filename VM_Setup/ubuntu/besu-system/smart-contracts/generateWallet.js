const {ethers} = require('ethers');

const wallet = ethers.Wallet.createRandom();

console.log("==================================")
console.log("YOUR GENERATED KEY WALLET")
console.log("===================================")
console.log("Address: ", wallet.address)
console.log("Private key: ". wallet.privateKey)
console.log("Mnemonic: ", wallet.mnemonic.phrase)
console.log("=====================================")
console.log("Save this securely. Do not save it to GIthub")

