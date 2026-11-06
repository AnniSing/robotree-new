import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';

// 1. Read .env file manually without exposing secrets to console
function loadEnv() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.substring(0, eqIdx).trim();
      const v = trimmed.substring(eqIdx + 1).trim();
      env[k] = v;
    }
  }
  return env;
}

async function main() {
  console.log('\n========================================');
  console.log('  Robotree MongoDB Atlas Connection Test');
  console.log('========================================\n');

  const env = loadEnv();
  const uri = process.env.MONGODB_URI || env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env file.');
    console.log('\nTo configure your connection securely:');
    console.log('1. Open your .env file');
    console.log('2. Add your connection string with your actual password:');
    console.log('   MONGODB_URI=mongodb+srv://robotree2020_db_user:<YOUR_PASSWORD>@cluster0.2uvdez5.mongodb.net/robotree?retryWrites=true&w=majority\n');
    process.exit(1);
  }

  if (uri.includes('<db_password>')) {
    console.error('⚠️  Warning: Your MONGODB_URI still contains the placeholder "<db_password>".');
    console.log('Please replace "<db_password>" with your actual MongoDB Atlas database user password in .env.\n');
    process.exit(1);
  }

  // Mask credentials for safe terminal logging
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
  console.log(`Connecting to: ${maskedUri}...`);

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 8000,
  });

  try {
    const startTime = Date.now();
    await client.connect();
    const duration = Date.now() - startTime;

    console.log(`✅ Successfully connected to MongoDB Atlas in ${duration}ms!`);

    const db = client.db('robotree');
    const pingResult = await db.command({ ping: 1 });
    console.log('✅ Ping response:', pingResult);

    const collections = await db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections in 'robotree' database:`);
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
    }

    console.log('\n🎉 MongoDB database connection verified and operational!\n');
  } catch (err) {
    console.error('\n❌ Connection failed:', err.message);

    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.log('\n💡 Diagnosis: Incorrect password or username for user "robotree2020_db_user".');
      console.log('   Check MongoDB Atlas -> Database Access -> Database Users to reset the password.');
    } else if (err.message.includes('SSL') || err.message.includes('ETIMEDOUT') || err.message.includes('ServerSelectionError')) {
      console.log('\n💡 Diagnosis: MongoDB Atlas Network Access restriction or TLS handshake issue.');
      console.log('   Go to MongoDB Atlas -> Network Access -> IP Access List:');
      console.log('   - Ensure your current IP is added, OR add "0.0.0.0/0" (Allow Access from Anywhere) for testing.');
    }
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
