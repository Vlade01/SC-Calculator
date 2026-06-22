const fs = require('fs');
const mongoose = require('mongoose');
(async () => {
  try {
    const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
    const m = env.match(/MONGODB_URI\s*=\s*\"?([^\"\r\n]+)/);
    const uri = m ? m[1] : process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not found');
      process.exit(2);
    }
    await mongoose.connect(uri, { maxPoolSize: 5 });
    const coll = mongoose.connection.db.collection('users');

    const query = { $or: [ { username: null }, { username: { $exists: false } } ] };
    const cursor = coll.find(query);
    let updated = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const local = (doc.email || 'user').split('@')[0].replace(/[^a-zA-Z0-9_+.-]/g, '').slice(0, 30) || 'user';
      let username = `${local}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;
      let attempts = 0;
      while (await coll.findOne({ username })) {
        attempts += 1;
        username = `${local}_${Date.now().toString(36)}${attempts}`;
        if (attempts > 10) break;
      }
      await coll.updateOne({ _id: doc._id }, { $set: { username } });
      updated += 1;
    }

    console.log('Updated username count:', updated);

    // Drop existing username index if present
    const indexes = await coll.indexes();
    for (const idx of indexes) {
      if (idx.key && idx.key.username === 1) {
        try {
          await coll.dropIndex(idx.name);
          console.log('Dropped index', idx.name);
        } catch (e) {
          console.warn('Could not drop index', idx.name, e.message || e);
        }
      }
    }

    // Create partial unique index to avoid null collisions (only on docs where username exists)
    await coll.createIndex({ username: 1 }, { unique: true, partialFilterExpression: { username: { $exists: true } } });
    console.log('Created partial unique index on username');

    // Report remaining docs with null username
    const remaining = await coll.countDocuments(query);
    console.log('Remaining null/missing username docs:', remaining);

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();