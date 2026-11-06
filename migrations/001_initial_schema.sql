-- ============================================================================
-- ROBOTREE ROBOTICS LLP — ENTERPRISE POSTGRESQL SCHEMA MIGRATION 001
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles & Permissions (RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(100) PRIMARY KEY,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Seed Default Roles
INSERT INTO roles (id, name, description) VALUES
  ('SUPER_ADMIN', 'Super Administrator', 'Full platform control and administrative rights'),
  ('ADMIN', 'Administrator', 'Operational management of courses, teams, and certificates'),
  ('STAFF', 'Staff Member', 'Training and curriculum staff'),
  ('STUDENT', 'Verified Student', 'Enrolled student with course and certificate access'),
  ('PUBLIC', 'Public Visitor', 'General public access')
ON CONFLICT (id) DO NOTHING;

-- 2. Users Table (Argon2id Hashed, Rate-Limited, Locked)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) REFERENCES roles(id) DEFAULT 'STUDENT',
  is_locked BOOLEAN DEFAULT FALSE,
  failed_login_attempts INT DEFAULT 0,
  lock_until TIMESTAMPTZ,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Sessions (HttpOnly Cookie / Bearer Token Storage)
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) REFERENCES roles(id),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 4. Team Members Directory (17 Active Members)
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'leadership', 'lead-trainers', 'assistant-trainers', 'operations'
  image TEXT,
  email VARCHAR(255) NOT NULL,
  responsibilities TEXT,
  qualification VARCHAR(100),
  experience VARCHAR(50),
  skills TEXT[], -- Array of strings
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_category ON team_members(category);

-- 5. Courses Catalog (Authoritative Server-Side Pricing)
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  duration VARCHAR(50) NOT NULL,
  level VARCHAR(50) NOT NULL,
  image VARCHAR(500),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_modules (
  id SERIAL PRIMARY KEY,
  course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
  module_order INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);

-- 6. Course Enrollments & Payment Records
CREATE TABLE IF NOT EXISTS course_enrollments (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  course_id VARCHAR(100) REFERENCES courses(id),
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  payment_id VARCHAR(100),
  order_id VARCHAR(100),
  amount_paid NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'PAID',
  enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_email ON course_enrollments(student_email);

-- 7. Events Gallery & Multi-Photo Albums
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  cover_image TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS event_images (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(100) REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);

-- 8. Accredited Certificates (Format: RRT-YYYY-XXXX-XXXX)
CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(100) PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255),
  course_id VARCHAR(100) REFERENCES courses(id) ON DELETE SET NULL,
  course_title VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ISSUED', -- 'ISSUED', 'ACTIVE', 'REVOKED', 'EXPIRED', 'REPLACED'
  verification_hash VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL DEFAULT 'Robotree Academic Directorate',
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(code);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);

-- Certificate Audit History
CREATE TABLE IF NOT EXISTS certificate_events (
  id SERIAL PRIMARY KEY,
  certificate_id VARCHAR(100) REFERENCES certificates(id) ON DELETE CASCADE,
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'ISSUED', 'VERIFIED', 'DOWNLOADED', 'REVOKED'
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificate_events_cert ON certificate_events(certificate_id);

-- 9. Immutable Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100),
  request_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  result VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILURE'
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 10. Inquiries & Contact Leads
CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  interest VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'NEW',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);

-- 11. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
