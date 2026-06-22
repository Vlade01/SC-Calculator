const fs = require('fs');
const mongoose = require('mongoose');
(async () => {
  try {
    const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
    const m = env.match(/MONGODB_URI\s*=\s*\"?([^\"\r\n]+)/);
    const uri = m ? m[1] : process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not found in .env.local or env');
      process.exit(2);
    }

    await mongoose.connect(uri, { maxPoolSize: 5 });
    const db = mongoose.connection.db;

    // Create 'signin_attempts' collection if it doesn't exist
    const colName = 'signin_attempts';
    const collections = await db.listCollections({ name: colName }).toArray();
    if (collections.length === 0) {
      await db.createCollection(colName);
      console.log('Created collection', colName);
    } else {
      console.log('Collection already exists:', colName);
    }

    const coll = db.collection(colName);

    // Index on email for fast lookups
    await coll.createIndex({ email: 1 });
    console.log('Created index: email');

    // Index on userId for queries by user
    await coll.createIndex({ userId: 1 });
    console.log('Created index: userId');

    // TTL index to auto-remove old records after 90 days (adjust as needed)
    await coll.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
    console.log('Created TTL index: createdAt (90 days)');

    // Ensure createdAt exists on insert via a simple helper for future inserts (not enforced here)
    console.log('Collection setup complete.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();