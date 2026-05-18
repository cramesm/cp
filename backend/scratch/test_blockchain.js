const blockchainService = require('../services/blockchainService');

async function testBlockchain() {
    console.log('--- Starting Blockchain Integration Test ---');

    const dummyDocId = 'DOC-TEST-' + Date.now();
    const dummyStudentId = 'STU-10293';
    const dummyStudentName = 'John Doe';
    const dummyHash = 'a7c938f382a8b9487c9d92b94e3e2b947c9d92b94e3e2b947c9d92b94e3e2b94';

    console.log('Anchoring test document hash...');
    const anchorResult = await blockchainService.anchorDocumentHash(
        dummyDocId,
        dummyStudentId,
        dummyStudentName,
        dummyHash
    );

    console.log('Anchor Result:\n', JSON.stringify(anchorResult, null, 2));

    if (!anchorResult.success) {
        console.error('FAILED: Hash anchoring failed!');
        process.exit(1);
    }

    console.log('\nVerifying anchored hash against ledger...');
    const verifyResult = await blockchainService.verifyDocumentHash(dummyHash);

    console.log('Verification Result:\n', JSON.stringify(verifyResult, null, 2));

    if (verifyResult.isVerified && verifyResult.documentId === dummyDocId) {
        console.log('\nSUCCESS: Blockchain service works 100% correctly!');
        process.exit(0);
    } else {
        console.error('\nFAILED: Hash verification did not match anchored details!');
        process.exit(1);
    }
}

testBlockchain();
