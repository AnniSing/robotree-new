import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { Logger } from '../telemetry/logger.js';
import { PROJECT_ROOT } from '../utils/paths.js';

export function isValidMongoUri(uri?: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (trimmed.includes('<YOUR_PASSWORD>') || trimmed.includes('<db_password>')) return false;
  return /^mongodb(\+srv)?:\/\//i.test(trimmed);
}

export class MongoConnection {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;
  private static isConnecting = false;
  private static connectionAttempted = false;

  public static async connect(customUri?: string): Promise<Db | null> {
    if (this.db) return this.db;
    const uri = (customUri || env.MONGODB_URI || process.env.MONGODB_URI || '').trim();

    if (!isValidMongoUri(uri)) {
      return null;
    }

    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return this.db;
    }

    this.isConnecting = true;
    this.connectionAttempted = true;

    try {
      const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
      Logger.info(`Connecting to MongoDB Atlas at ${maskedUri}...`);

      const client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 25,
      });

      await client.connect();
      const db = client.db('robotree');

      // Verify connection with ping
      await db.command({ ping: 1 });
      this.client = client;
      this.db = db;

      Logger.info('Successfully connected to MongoDB Atlas (database: robotree).');

      // Initialize indexes asynchronously
      this.initIndexes(db).catch((err) => {
        Logger.warn('MongoDB index initialization notice:', { details: { error: err.message } });
      });

      // Synchronize initial data once if collections are empty
      this.seedIfEmpty(db).catch((err) => {
        Logger.warn('MongoDB initial seed check notice:', { details: { error: err.message } });
      });

      return db;
    } catch (err: any) {
      Logger.error(`MongoDB Atlas connection error: ${err.message}`);
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  public static getDb(): Db | null {
    return this.db;
  }

  public static isConnected(): boolean {
    return this.db !== null;
  }

  public static async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      Logger.info('MongoDB Atlas connection closed.');
    }
  }

  private static async initIndexes(db: Db): Promise<void> {
    try {
      await db.collection('certificates').createIndex({ certificateId: 1 });
      await db.collection('certificates').createIndex({ code: 1 });
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('products').createIndex({ id: 1 });
      await db.collection('courses').createIndex({ id: 1 });
      await db.collection('team').createIndex({ id: 1 });
      await db.collection('institutes').createIndex({ id: 1 });
      await db.collection('showcase_gallery').createIndex({ id: 1 });
      await db.collection('events_gallery').createIndex({ id: 1 });
      await db.collection('data_history').createIndex({ entity: 1, entityId: 1, timestamp: -1 });
    } catch (_) {}
  }

  private static async seedIfEmpty(db: Db): Promise<void> {
    const dataDir = path.join(PROJECT_ROOT, 'data');
    if (!fs.existsSync(dataDir)) return;

    const fileMap: Record<string, string> = {
      'users.json': 'users',
      'certificates.json': 'certificates',
      'courses.json': 'courses',
      'team.json': 'team',
      'products.json': 'products',
      'events-gallery.json': 'events_gallery',
      'showcase-gallery.json': 'showcase_gallery',
      'institutes.json': 'institutes',
      'settings.json': 'settings',
      'inquiries.json': 'inquiries',
    };

    for (const [file, collectionName] of Object.entries(fileMap)) {
      try {
        const col = db.collection(collectionName);
        const count = await col.countDocuments();
        if (count > 0) continue; // Already has data, never overwrite

        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) continue;

        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const docs = parsed.map((item: any, idx: number) => {
            const doc = { ...item };
            if (doc.id && !doc._id) {
              doc._id = String(doc.id);
            } else if (!doc._id) {
              doc._id = `${collectionName}_${idx + 1}`;
            }
            return doc;
          });
          await col.insertMany(docs);
          Logger.info(`MongoDB seeded ${docs.length} records into ${collectionName}.`);
        } else if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          const doc = { ...parsed, _id: 'site_settings' };
          await col.insertOne(doc);
          Logger.info(`MongoDB seeded settings record.`);
        }
      } catch (err: any) {
        Logger.warn(`Initial seed notice for ${collectionName}: ${err.message}`);
      }
    }
  }
}
