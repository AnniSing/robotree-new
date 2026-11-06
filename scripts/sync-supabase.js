import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Load .env if present
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: DATABASE_URL or SUPABASE_DB_URL is not set.');
  console.log('\nPlease set your Supabase database connection string in .env:');
  console.log('DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"');
  process.exit(1);
}

const isSupabaseOrRemote =
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase.com') ||
  connectionString.includes('pooler.supabase.com') ||
  connectionString.includes('sslmode=') ||
  process.env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString,
  ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});

async function run() {
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');
  console.log('\x1b[36m%s\x1b[0m', '   ROBOTREE -> SUPABASE POSTGRESQL SYNCHRONIZER       ');
  console.log('\x1b[36m%s\x1b[0m', '=======================================================\n');

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    const client = await pool.connect();
    console.log('\x1b[32m%s\x1b[0m', '✔ Connected to Supabase successfully!\n');

    // 1. Run migrations
    const migration1 = path.join(ROOT, 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(migration1)) {
      console.log('Executing 001_initial_schema.sql...');
      const sql1 = fs.readFileSync(migration1, 'utf8');
      await client.query(sql1);
      console.log('\x1b[32m%s\x1b[0m', '✔ 001_initial_schema.sql executed successfully.');
    }

    const migration2 = path.join(ROOT, 'migrations', '002_products_and_orders.sql');
    if (fs.existsSync(migration2)) {
      console.log('Executing 002_products_and_orders.sql...');
      const sql2 = fs.readFileSync(migration2, 'utf8');
      await client.query(sql2);
      console.log('\x1b[32m%s\x1b[0m', '✔ 002_products_and_orders.sql executed successfully.');
    }

    // 2. Seed Team
    const teamFile = path.join(ROOT, 'data', 'team.json');
    if (fs.existsSync(teamFile)) {
      const { rows } = await client.query('SELECT COUNT(*) as count FROM team_members');
      if (parseInt(rows[0].count, 10) === 0) {
        console.log('Seeding team members from data/team.json...');
        const teamData = JSON.parse(fs.readFileSync(teamFile, 'utf8'));
        for (const m of teamData) {
          await client.query(
            `INSERT INTO team_members (name, role, department, category, image, email, responsibilities, qualification, experience, skills)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              m.name,
              m.role,
              m.department || 'Training',
              m.category || 'operations',
              m.image || '',
              m.email || '',
              m.responsibilities || '',
              m.qualification || '',
              m.experience || '',
              m.skills || [],
            ]
          );
        }
        console.log(`\x1b[32m✔ Seeded ${teamData.length} team members.\x1b[0m`);
      } else {
        console.log(`ℹ Team members table already has ${rows[0].count} records.`);
      }
    }

    // 3. Seed Courses
    const coursesFile = path.join(ROOT, 'data', 'courses.json');
    if (fs.existsSync(coursesFile)) {
      const { rows } = await client.query('SELECT COUNT(*) as count FROM courses');
      if (parseInt(rows[0].count, 10) === 0) {
        console.log('Seeding courses from data/courses.json...');
        const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));
        for (const c of courses) {
          await client.query(
            `INSERT INTO courses (id, title, category, price, currency, duration, level, image, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING`,
            [
              c.id,
              c.title,
              c.category || 'Robotics',
              c.price || 0,
              c.currency || 'INR',
              c.duration || 'Flexible',
              c.level || 'Beginner',
              c.image || '',
              c.description || '',
            ]
          );
        }
        console.log(`\x1b[32m✔ Seeded ${courses.length} courses.\x1b[0m`);
      } else {
        console.log(`ℹ Courses table already has ${rows[0].count} records.`);
      }
    }

    // 4. Seed Products
    const productsFile = path.join(ROOT, 'data', 'products.json');
    if (fs.existsSync(productsFile)) {
      const { rows } = await client.query('SELECT COUNT(*) as count FROM products');
      if (parseInt(rows[0].count, 10) === 0) {
        console.log('Seeding products from data/products.json...');
        const prods = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
        for (const p of prods) {
          await client.query(
            `INSERT INTO products (id, title, category, price, original_price, in_stock, stock_quantity, sku, image, description, features, featured, specifications)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO NOTHING`,
            [
              p.id,
              p.title,
              p.category,
              p.price || 0,
              p.originalPrice || null,
              p.inStock !== false,
              p.stockQuantity || 0,
              p.sku || '',
              p.image || '',
              p.description || '',
              p.features || [],
              p.featured || false,
              JSON.stringify(p.specifications || {}),
            ]
          );
        }
        console.log(`\x1b[32m✔ Seeded ${prods.length} store products.\x1b[0m`);
      } else {
        console.log(`ℹ Products table already has ${rows[0].count} records.`);
      }
    }

    // 5. Seed Certificates
    const certsFile = path.join(ROOT, 'data', 'certificates.json');
    if (fs.existsSync(certsFile)) {
      const { rows } = await client.query('SELECT COUNT(*) as count FROM certificates');
      if (parseInt(rows[0].count, 10) === 0) {
        console.log('Seeding certificates from data/certificates.json...');
        const certs = JSON.parse(fs.readFileSync(certsFile, 'utf8'));
        for (const c of certs) {
          await client.query(
            `INSERT INTO certificates (id, code, student_name, student_email, course_title, issue_date, status, verification_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            [
              c.id || c.code,
              c.code || c.id,
              c.studentName,
              c.studentEmail || null,
              c.courseTitle || c.course,
              c.issueDate || '2026-01-01',
              c.status || 'ISSUED',
              c.verificationHash || 'verified_hash_' + (c.id || c.code),
            ]
          );
        }
        console.log(`\x1b[32m✔ Seeded ${certs.length} certificates.\x1b[0m`);
      } else {
        console.log(`ℹ Certificates table already has ${rows[0].count} records.`);
      }
    }

    // Summary Verification
    console.log('\n\x1b[33m%s\x1b[0m', '--- SUPABASE DATABASE SUMMARY ---');
    const tables = ['users', 'roles', 'team_members', 'courses', 'products', 'certificates', 'events', 'inquiries'];
    for (const t of tables) {
      try {
        const { rows } = await client.query(`SELECT COUNT(*) as c FROM ${t}`);
        console.log(`• Table [${t}]: ${rows[0].c} records`);
      } catch {
        console.log(`• Table [${t}]: (table pending or not created)`);
      }
    }

    client.release();
    console.log('\n\x1b[32m%s\x1b[0m', '🎉 Supabase PostgreSQL database is completely synced and ready for production!');
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Supabase sync failed: ' + err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
