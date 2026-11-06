import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';

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

async function syncToMongoDB() {
  console.log('\n======================================================');
  console.log('  Robotree MongoDB Atlas Data Synchronization');
  console.log('======================================================\n');

  const env = loadEnv();
  const uri = process.env.MONGODB_URI || env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env file.');
    process.exit(1);
  }

  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
  console.log(`Connecting to: ${maskedUri}...`);

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000,
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas!\n');

    const db = client.db('robotree');

    const dataDir = path.resolve('data');
    const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

    let totalSyncedCollections = 0;
    let totalSyncedDocuments = 0;

    for (const file of jsonFiles) {
      const collectionName = path.basename(file, '.json').replace(/-/g, '_');
      const filePath = path.join(dataDir, file);

      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);

        const items = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);

        if (items.length === 0) {
          console.log(`ℹ️  [${collectionName}] Empty file, skipping.`);
          continue;
        }

        const col = db.collection(collectionName);

        // Clear previous seed for idempotency
        await col.deleteMany({});

        // Prepare documents (avoid mutating original, convert id to _id if appropriate)
        const docs = items.map((item, idx) => {
          const doc = { ...item };
          if (doc.id && !doc._id) {
            doc._id = String(doc.id);
          } else if (!doc._id) {
            doc._id = `${collectionName}_${idx + 1}`;
          }
          return doc;
        });

        const insertRes = await col.insertMany(docs);
        console.log(`✅ [${collectionName}]: Synchronized ${insertRes.insertedCount} documents`);

        totalSyncedCollections++;
        totalSyncedDocuments += insertRes.insertedCount;
      } catch (err) {
        console.error(`⚠️  [${collectionName}] Error processing ${file}:`, err.message);
      }
    }

    // Set up indexes
    try {
      await db.collection('certificates').createIndex({ enrollmentNo: 1 });
      await db.collection('certificates').createIndex({ certificateId: 1 });
      await db.collection('users').createIndex({ email: 1 });
      await db.collection('products').createIndex({ id: 1 });
      console.log('\n✅ Performance and lookup indexes created on key collections.');
    } catch (idxErr) {
      console.warn('Index notice:', idxErr.message);
    }

    console.log('\n------------------------------------------------------');
    console.log(`🎉 Synchronization Complete!`);
    console.log(`   Collections populated: ${totalSyncedCollections}`);
    console.log(`   Total documents:        ${totalSyncedDocuments}`);
    console.log('------------------------------------------------------\n');
  } catch (err) {
    console.error('\n❌ MongoDB synchronization failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

syncToMongoDB();
