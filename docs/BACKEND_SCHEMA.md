# Backend Schema & Data Models Specification (BACKEND_SCHEMA)

**Product Name:** Robotree Robotics Corporate & STEM Education Web Platform  
**Document Version:** 2.1.0  
**Status:** Canonical Reference  
**Entity:** Robotree Robotics LLP (GeM & MSME Accredited Entity)  
**Author:** Senior Backend & Data Architect  

---

## 01. Data Architecture Philosophy

The Robotree backend employs a decoupled, storage-agnostic data architecture. The application core depends exclusively on strongly typed domain models and repository interfaces, allowing seamless transitions between:
1. **Local File Persistence Mode:** Atomic read/write operations on JSON flat files located in `data/` (ideal for zero-dependency development and edge environments).
2. **PostgreSQL Relational Mode:** Standardized SQL schema with ACID guarantees and foreign-key constraints (ideal for clustered production deployments).

---

## 02. Canonical Domain Models

All core domain models are defined in [`backend/src/models/index.ts`](file:///c:/Users/aniket/Desktop/webiste%20project/backend/src/models/index.ts).

### 2.1 User Entity
Represents registered students, faculty members, and administrative operators.

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'employee' | 'admin';
  phone?: string;
  institution?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 Certificate Entity
Represents verifiable educational credentials issued under GeM & MSME accreditation.

```typescript
export interface Certificate {
  id: string;
  serialNumber: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  grade: string;
  issueDate: string;
  verificationHash: string;
  accreditedBy: string;
  metadata?: Record<string, unknown>;
}
```

### 2.3 Inquiry Entity
Represents leads, institutional lab inquiries, newsletter subscriptions, and feedback.

```typescript
export interface Inquiry {
  id: string;
  type: 'contact' | 'newsletter' | 'program_interest' | 'feedback' | 'corporate';
  name?: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  program?: string;
  status: 'new' | 'contacted' | 'enrolled' | 'closed';
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

### 2.4 SiteSettings Entity
Represents live customizable metrics and legal compliance notices displayed across the site.

```typescript
export interface SiteSettings {
  heroStatNumber: string;       // e.g. "20,000+"
  heroStatLabel: string;        // e.g. "Students Trained"
  governmentProtocol: string;   // e.g. "Robotree Robotics LLP • Operating in accordance..."
  updatedAt?: string;
}
```

### 2.5 AuditLog Entity
Represents tamper-evident administrative and security audit events.

```typescript
export interface AuditLog {
  id: string;
  action: string;               // e.g. "ADMIN_LOGIN_SUCCESS", "SETTINGS_UPDATED"
  actor: string;                // e.g. "admin@robotree.org", "127.0.0.1"
  targetEntity: string;         // e.g. "site_settings", "users"
  details: string;
  ipAddress?: string;
  timestamp: string;
}
```

---

## 03. JSON Storage Schemas (`data/*.json`)

When running in file persistence mode, entities are stored in `data/` with the following structures:

| File Path | Entity Type | Primary Key | Description |
|:---|:---|:---|:---|
| `data/settings.json` | `SiteSettings` | Singleton Object | Live hero statistics & Government protocol notice |
| `data/users.json` | `User[]` | `id` (UUIDv4) | Registered user accounts & hashed passwords |
| `data/certificates.json` | `Certificate[]` | `id` / `serialNumber` | Accredited certificates index |
| `data/inquiries.json` | `Inquiry[]` | `id` (UUIDv4) | Contact inquiries & lead ingestion queue |
| `data/courses.json` | `Course[]` | `id` (slug) | Course curriculum, fees, and outlines |
| `data/audit_logs.json` | `AuditLog[]` | `id` (UUIDv4) | Immutable security audit trail |

### Sample `data/settings.json`:
```json
{
  "heroStatNumber": "20,000+",
  "heroStatLabel": "Students Trained",
  "governmentProtocol": "Robotree Robotics LLP • Operating in accordance with Government of India Protocols (GeM & MSME Accredited Entity)",
  "updatedAt": "2026-09-30T06:59:35.000Z"
}
```

---

## 04. Relational PostgreSQL DDL Schema

For enterprise production scaling, the following relational DDL schema is supported:

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'employee', 'admin')),
    phone VARCHAR(50),
    institution VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    course_id VARCHAR(100) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    issue_date DATE NOT NULL,
    verification_hash VARCHAR(255) NOT NULL,
    accredited_by VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_certificates_serial ON certificates(serial_number);

-- 3. Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT,
    program VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'closed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);

-- 4. Site Settings Table (Singleton)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    hero_stat_number VARCHAR(50) NOT NULL,
    hero_stat_label VARCHAR(100) NOT NULL,
    government_protocol TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
```

---

## 05. Repository Abstraction Pattern

The application interacts with data solely through contracts defined in `backend/src/repositories/interfaces/`:
- `IUserRepository`
- `ICertificateRepository`
- `IInquiryRepository`
- `ICourseRepository`
- `IEventRepository`
- `IAuditRepository`

This ensures that adding new database backends (e.g. MongoDB, Redis) requires zero modifications to Controllers or Services.
