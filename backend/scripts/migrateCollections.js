const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  if (!uri) {
    console.error('Error: No MONGODB_URI or MONGO_URI found in environment.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log('✓ Connected to MongoDB');

  const db = mongoose.connection.db;

  // 1. Migrate `registrars` -> `staff`
  console.log('\n--- 1. Migrating `registrars` -> `staff` ---');
  const registrarsCol = db.collection('registrars');
  const staffCol = db.collection('staff');

  const registrarsCount = await registrarsCol.countDocuments();
  console.log(`Found ${registrarsCount} documents in 'registrars'.`);

  if (registrarsCount > 0) {
    const registrarsDocs = await registrarsCol.find({}).toArray();
    const existingStaffCount = await staffCol.countDocuments();

    if (existingStaffCount === 0) {
      await staffCol.insertMany(registrarsDocs);
      console.log(`✓ Copied ${registrarsDocs.length} documents into 'staff'.`);
    } else {
      console.log(`'staff' already has ${existingStaffCount} documents. Upserting missing docs...`);
      for (const doc of registrarsDocs) {
        await staffCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
      }
      console.log(`✓ Synchronized documents into 'staff'.`);
    }

    // Recreate indexes
    try {
      await staffCol.createIndex({ email: 1 }, { unique: true });
      await staffCol.createIndex({ registrarId: 1 }, { unique: true, sparse: true });
      console.log("✓ Created unique indexes on 'staff' (email, registrarId).");
    } catch (idxErr) {
      console.warn('Notice: Index creation note:', idxErr.message);
    }

    const verifiedStaffCount = await staffCol.countDocuments();
    console.log(`Verification: 'staff' now contains ${verifiedStaffCount} documents (Original: ${registrarsCount}).`);
  }

  // 2. Migrate `Blockchain_Transaction` -> `blockchain_transactions`
  console.log('\n--- 2. Migrating `Blockchain_Transaction` -> `blockchain_transactions` ---');
  const oldBlockchainCol = db.collection('Blockchain_Transaction');
  const newBlockchainCol = db.collection('blockchain_transactions');

  const oldTxCount = await oldBlockchainCol.countDocuments();
  console.log(`Found ${oldTxCount} documents in 'Blockchain_Transaction'.`);

  if (oldTxCount > 0) {
    const oldTxDocs = await oldBlockchainCol.find({}).toArray();
    const existingNewTxCount = await newBlockchainCol.countDocuments();

    if (existingNewTxCount === 0) {
      await newBlockchainCol.insertMany(oldTxDocs);
      console.log(`✓ Copied ${oldTxDocs.length} documents into 'blockchain_transactions'.`);
    } else {
      console.log(`'blockchain_transactions' already has ${existingNewTxCount} documents. Upserting missing docs...`);
      for (const doc of oldTxDocs) {
        await newBlockchainCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
      }
      console.log(`✓ Synchronized documents into 'blockchain_transactions'.`);
    }

    // Recreate index
    try {
      await newBlockchainCol.createIndex({ referenceNumber: 1 }, { unique: true });
      console.log("✓ Created unique index on 'blockchain_transactions' (referenceNumber).");
    } catch (idxErr) {
      console.warn('Notice: Index creation note:', idxErr.message);
    }

    const verifiedNewTxCount = await newBlockchainCol.countDocuments();
    console.log(`Verification: 'blockchain_transactions' now contains ${verifiedNewTxCount} documents (Original: ${oldTxCount}).`);
  }

  // 3. Clean up empty/stale collections
  console.log('\n--- 3. Cleaning up stale collections ---');
  
  // Drop empty `admins` collection (0 docs)
  const adminsCol = db.collection('admins');
  const adminsCount = await adminsCol.countDocuments();
  if (adminsCount === 0) {
    try {
      await adminsCol.drop();
      console.log("✓ Dropped empty 'admins' collection.");
    } catch (e) {
      console.log("'admins' collection was already absent or could not be dropped:", e.message);
    }
  } else {
    console.warn(`Skipping drop of 'admins' because it has ${adminsCount} documents.`);
  }

  // Drop stale legacy `users` collection (1 old test document)
  const usersCol = db.collection('users');
  const usersCount = await usersCol.countDocuments();
  if (usersCount <= 1) {
    try {
      await usersCol.drop();
      console.log("✓ Dropped stale legacy 'users' collection.");
    } catch (e) {
      console.log("'users' collection was already absent or could not be dropped:", e.message);
    }
  }

  console.log('\n✓ Migration completed successfully.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
