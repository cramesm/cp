const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Registrar = require('../models/Registrar');
const Admin = require('../models/Admin');
const BlockchainTransaction = require('../models/BlockchainTransaction');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function verify() {
  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  // Test 1: Registrar model querying 'staff'
  const staffMembers = await Registrar.find({});
  console.log(`\nTest 1: Registrar.find({}) returned ${staffMembers.length} documents.`);
  if (staffMembers.length !== 15) {
    throw new Error(`Expected 15 staff members, got ${staffMembers.length}`);
  }

  // Test 2: Check distinct departments & roles in staff
  const departments = [...new Set(staffMembers.map(s => s.department).filter(Boolean))];
  const roles = [...new Set(staffMembers.map(s => s.role).filter(Boolean))];
  console.log('Departments present in staff:', departments);
  console.log('Roles present in staff:', roles);

  const accAdmin = staffMembers.find(s => s.role === 'Accounting Admin');
  const regAdmin = staffMembers.find(s => s.role === 'Registrar Admin');
  const itAdmin = staffMembers.find(s => s.role === 'IT Administrator');
  const accStaff = staffMembers.find(s => s.role === 'Accounting Staff');

  console.log('Found Accounting Admin:', accAdmin?.name);
  console.log('Found Registrar Admin:', regAdmin?.name);
  console.log('Found IT Administrator:', itAdmin?.name);
  console.log('Found Accounting Staff:', accStaff?.name);

  if (!accAdmin || !regAdmin || !itAdmin || !accStaff) {
    throw new Error('Missing expected department roles in staff collection!');
  }

  // Test 3: BlockchainTransaction querying 'blockchain_transactions'
  const txCount = await BlockchainTransaction.countDocuments();
  console.log(`\nTest 3: BlockchainTransaction.countDocuments() returned ${txCount} records.`);
  if (txCount !== 116) {
    throw new Error(`Expected 116 blockchain transactions, got ${txCount}`);
  }

  // Test 4: Verify Admin model fallback
  const adminQuery = await Admin.find({});
  console.log(`\nTest 4: Admin.find({}) fallback returned ${adminQuery.length} documents from staff.`);

  console.log('\n✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  await mongoose.disconnect();
}

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
