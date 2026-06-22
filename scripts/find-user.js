const fs = require('fs');
const mongoose = require('mongoose');
const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/find-user.js <email>');
  process.exit(2);
}
const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const m = env.match(/MONGODB_URI\s*=\s*\"?([^\"\r\n]+)/);
const uri = m ? m[1] : process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not found');
  process.exit(2);
}
(async () => {
  try {
    await mongoose.connect(uri, { maxPoolSize: 2 });
    const u = await mongoose.connection.db.collection('users').findOne({ email: email });
    console.log(JSON.stringify(u, null, 2));
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();