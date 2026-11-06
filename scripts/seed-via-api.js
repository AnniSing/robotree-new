import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iapugxyypquaxhrxxwfh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_-k9eVXRlYxVsfgqRNasGAg_GBgEjsxP';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: WebSocket },
});

async function seed() {
  console.log('--- SEEDING SUPABASE VIA API ---');

  // 1. Products
  const productsFile = path.join(ROOT, 'data', 'products.json');
  if (fs.existsSync(productsFile)) {
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    console.log(`Seeding ${products.length} products...`);
    const { error } = await supabase.from('products').upsert(
      products.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        original_price: p.originalPrice || null,
        in_stock: p.inStock,
        stock_quantity: p.stockQuantity,
        sku: p.sku || '',
        image: p.image || '',
        description: p.description || '',
        features: p.features || [],
        featured: Boolean(p.featured),
        specifications: p.specifications || {},
      }))
    );
    if (error) console.log('Products seed error:', error.message);
    else console.log('✔ Products seeded successfully!');
  }

  // 2. Courses
  const coursesFile = path.join(ROOT, 'data', 'courses.json');
  if (fs.existsSync(coursesFile)) {
    const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));
    console.log(`Seeding ${courses.length} courses...`);
    const { error } = await supabase.from('courses').upsert(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category || 'Robotics',
        price: c.price || 0,
        currency: c.currency || 'INR',
        duration: c.duration || 'Flexible',
        level: c.level || 'Beginner',
        image: c.image || '',
        description: c.description || '',
      }))
    );
    if (error) console.log('Courses seed error:', error.message);
    else console.log('✔ Courses seeded successfully!');
  }

  // 3. Certificates
  const certsFile = path.join(ROOT, 'data', 'certificates.json');
  if (fs.existsSync(certsFile)) {
    const certs = JSON.parse(fs.readFileSync(certsFile, 'utf8'));
    console.log(`Seeding ${certs.length} certificates...`);
    const { error } = await supabase.from('certificates').upsert(
      certs.map((c) => ({
        id: c.id || c.code,
        code: c.code || c.id,
        student_name: c.studentName,
        student_email: c.studentEmail || null,
        course_title: c.courseTitle || c.course,
        issue_date: c.issueDate || '2026-01-01',
        status: c.status || 'ISSUED',
        verification_hash: c.verificationHash || 'verified_hash_' + (c.id || c.code),
      }))
    );
    if (error) console.log('Certificates seed error:', error.message);
    else console.log('✔ Certificates seeded successfully!');
  }

  // 4. Team Members
  const teamFile = path.join(ROOT, 'data', 'team.json');
  if (fs.existsSync(teamFile)) {
    const team = JSON.parse(fs.readFileSync(teamFile, 'utf8'));
    console.log(`Seeding ${team.length} team members...`);
    const { error } = await supabase.from('team_members').upsert(
      team.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        department: m.department || 'Training',
        category: m.category || 'operations',
        image: m.image || '',
        email: m.email || '',
        responsibilities: m.responsibilities || '',
        qualification: m.qualification || '',
        experience: m.experience || '',
        skills: m.skills || [],
      }))
    );
    if (error) console.log('Team seed error:', error.message);
    else console.log('✔ Team members seeded successfully!');
  }

  console.log('--- SEEDING COMPLETE ---');
}

seed();
