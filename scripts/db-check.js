const fs = require('fs');
const mongoose = require('mongoose');
(async () => {
  try {
    const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
    const m = env.match(/MONGODB_URI\s*=\s*["']?([^"'\n]+)["']?/);
    const uri = m ? m[1] : process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not found');
      process.exit(2);
    }
    await mongoose.connect(uri, { maxPoolSize: 2 });
    console.log('CONNECTED_TO:', (uri.split('@')[1] || uri).slice(0, 200));
    const db = mongoose.connection.db;
    const dbs = await db.admin().listDatabases();
    console.log('DATABASES:', dbs.databases.map(d => d.name));
    const cols = await db.listCollections().toArray();
    console.log('COLLECTIONS:', cols.map(c => c.name));
    const usersCount = await db.collection('users').countDocuments().catch(() => 0);
    console.log('USERS_COUNT:', usersCount);
    const users = await db.collection('users').find().limit(5).toArray().catch(() => []);
    console.log('USERS_SAMPLE:', JSON.stringify(users, null, 2));
    await mongoose.disconnect();
  } catch (e) {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
})();
