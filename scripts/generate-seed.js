import fs from 'node:fs';

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function escapeArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "'{}'";
  const items = arr.map(i => `"${String(i).replace(/"/g, '\\"')}"`);
  return `'{${items.join(',')}}'`;
}

let sql = `-- ==============================================================================
-- 1. Enable Application Access (Disable RLS for public catalog & store)
-- ==============================================================================
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Seed Team Members (20 Active Members)
-- ==============================================================================
`;

const team = JSON.parse(fs.readFileSync('./data/team.json', 'utf8'));
for (const m of team) {
  sql += `INSERT INTO team_members (name, role, department, category, image, email, responsibilities, qualification, experience, skills)
VALUES (${escapeSql(m.name)}, ${escapeSql(m.role)}, ${escapeSql(m.department || 'Training')}, ${escapeSql(m.category || 'operations')}, ${escapeSql(m.image || '')}, ${escapeSql(m.email || '')}, ${escapeSql(m.responsibilities || '')}, ${escapeSql(m.qualification || '')}, ${escapeSql(m.experience || '')}, ${escapeArray(m.skills)});\n`;
}

sql += `\n-- ==============================================================================
-- 3. Seed Courses
-- ==============================================================================
`;

const courses = JSON.parse(fs.readFileSync('./data/courses.json', 'utf8'));
for (const c of courses) {
  sql += `INSERT INTO courses (id, title, category, price, currency, duration, level, image, description)
VALUES (${escapeSql(c.id)}, ${escapeSql(c.title)}, ${escapeSql(c.category || 'Robotics')}, ${c.price || 0}, 'INR', ${escapeSql(c.duration || 'Flexible')}, ${escapeSql(c.level || 'Beginner')}, ${escapeSql(c.image || '')}, ${escapeSql(c.description || '')})
ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- ==============================================================================
-- 4. Seed Store Products
-- ==============================================================================
`;

const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
for (const p of products) {
  sql += `INSERT INTO products (id, title, category, price, original_price, in_stock, stock_quantity, sku, image, description, features, featured)
VALUES (${escapeSql(p.id)}, ${escapeSql(p.title)}, ${escapeSql(p.category)}, ${p.price || 0}, ${p.originalPrice || 'NULL'}, ${p.inStock !== false}, ${p.stockQuantity || 0}, ${escapeSql(p.sku || '')}, ${escapeSql(p.image || '')}, ${escapeSql(p.description || '')}, ${escapeArray(p.features)}, ${Boolean(p.featured)})
ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- ==============================================================================
-- 5. Seed Certificates
-- ==============================================================================
`;

const certs = JSON.parse(fs.readFileSync('./data/certificates.json', 'utf8'));
for (const c of certs) {
  sql += `INSERT INTO certificates (id, code, student_name, student_email, course_title, issue_date, status, verification_hash)
VALUES (${escapeSql(c.id || c.code)}, ${escapeSql(c.code || c.id)}, ${escapeSql(c.studentName)}, ${escapeSql(c.studentEmail)}, ${escapeSql(c.courseTitle || c.course)}, ${escapeSql(c.issueDate || '2026-01-01')}, ${escapeSql(c.status || 'ISSUED')}, ${escapeSql(c.verificationHash || 'verified_hash')})
ON CONFLICT (id) DO NOTHING;\n`;
}

fs.writeFileSync('./scripts/seed-supabase.sql', sql);
console.log('Seed SQL created successfully.');
