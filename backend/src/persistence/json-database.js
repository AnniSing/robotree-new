import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findProjectRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  }
  let curr = __dirname;
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return cwd;
}
const PROJECT_ROOT = findProjectRoot();
const SEED_DATA_DIR = path.join(PROJECT_ROOT, 'data');

function resolveWritableDataDir() {
  if (process.env.ROBOTREE_DATA_DIR) {
    return path.resolve(process.env.ROBOTREE_DATA_DIR);
  }
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    return path.join(os.tmpdir(), 'robotree-data');
  }
  try {
    if (!fs.existsSync(SEED_DATA_DIR)) {
      fs.mkdirSync(SEED_DATA_DIR, { recursive: true });
    }
    fs.accessSync(SEED_DATA_DIR, fs.constants.W_OK);
    return SEED_DATA_DIR;
  } catch {
    return path.join(os.tmpdir(), 'robotree-data');
  }
}

const DATA_DIR = resolveWritableDataDir();

// Ensure Data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Warning creating DATA_DIR:', err?.message || err);
}

/**
 * Resolves file path securely with path traversal protection
 */
function getSecureFilePath(filename, baseDir = DATA_DIR) {
  const safeName = path.basename(String(filename || '')).replace(/[^a-zA-Z0-9._-]/g, '');
  const resolved = path.resolve(baseDir, safeName);
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Security Error: Path traversal attempt detected.');
  }
  return resolved;
}

/**
 * Strips prototype pollution keys (__proto__, constructor, prototype)
 */
function sanitizeRecord(item) {
  if (!item || typeof item !== 'object') return item;
  if (Array.isArray(item)) return item.map(sanitizeRecord);
  const clean = {};
  for (const [key, value] of Object.entries(item)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    clean[key] = sanitizeRecord(value);
  }
  return clean;
}

function readData(filename, defaultData = []) {
  try {
    const filePath = getSecureFilePath(filename);
    if (!fs.existsSync(filePath)) {
      if (DATA_DIR !== SEED_DATA_DIR && !process.env.ROBOTREE_DATA_DIR) {
        const seedPath = getSecureFilePath(filename, SEED_DATA_DIR);
        if (fs.existsSync(seedPath)) {
          const seedRaw = fs.readFileSync(seedPath, 'utf8');
          const seedParsed = JSON.parse(seedRaw);
          try {
            fs.writeFileSync(filePath, seedRaw, 'utf8');
          } catch {}
          return sanitizeRecord(seedParsed);
        }
      }
      try {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      } catch {}
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return sanitizeRecord(parsed);
  } catch (err) {
    console.error(`Error reading database file ${filename}:`, err.message);
    return defaultData;
  }
}

function writeData(filename, data) {
  let tempPath = '';
  try {
    const filePath = getSecureFilePath(filename);
    tempPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    const cleanData = sanitizeRecord(data);
    fs.writeFileSync(tempPath, JSON.stringify(cleanData, null, 2), 'utf8');

    // Windows atomic file replacement resilience with retry and copy fallback
    let replaced = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.renameSync(tempPath, filePath);
        replaced = true;
        break;
      } catch (renameErr) {
        if (attempt === 4) {
          try {
            fs.copyFileSync(tempPath, filePath);
            try { fs.unlinkSync(tempPath); } catch {}
            replaced = true;
          } catch (copyErr) {
            console.error(`Error falling back to copyFileSync for ${filename}:`, copyErr.message);
          }
        } else {
          // Brief synchronous delay for Windows lock release
          const start = Date.now();
          while (Date.now() - start < 12) {}
        }
      }
    }
    return replaced;
  } catch (err) {
    console.error(`Error writing database file ${filename}:`, err.message);
    if (tempPath && fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    return false;
  }
}

const DEFAULT_EVENTS_GALLERY = [
  {
    id: 'EVT-2026-0001',
    title: 'Autonomous Robotics, ROS2 & Embedded IoT Hackathon',
    category: 'College Bootcamps',
    institution: 'NIT & Engineering Colleges',
    date: '2026-07-26',
    attendees: '500+ Engineers',
    image: 'assets/events/event_college_hackathon_lab.jpg',
    images: [
      'assets/events/event_college_hackathon_lab.jpg',
      'assets/brochure/workshop_four_engineers_testing.jpg',
      'assets/brochure/gallery_circuit_wiring_winter.jpg',
      'assets/brochure/championship_line_follower.jpg'
    ],
    description: 'Intensive 3-day hardware-software integration workshop where undergraduate engineers designed autonomous rovers, sensor nodes, and computer vision bots.',
    tags: ['ROS2', 'Computer Vision', 'IoT'],
    featured: true,
    uploadedBy: 'Admin',
    createdAt: '2026-07-26T10:00:00Z'
  },
  {
    id: 'EVT-2026-0002',
    title: 'Robotree Junior Innovation Lab (RJIL) State Launch',
    category: 'Keynotes',
    institution: 'Sentrum Mall & Innovation Hub',
    date: '2026-06-15',
    attendees: '1,200+ Attendees',
    image: 'assets/events/robotree_junior_innovation_lab_presentation.png',
    images: [
      'assets/events/robotree_junior_innovation_lab_presentation.png',
      'assets/brochure/gallery_3d_printer_in_action.jpg',
      'assets/brochure/gallery_quadcopter_flight_rig.jpg',
      'assets/brochure/training_smart_board_lecture.jpg'
    ],
    description: 'Keynote showcase demonstrating 3D printers, autonomous quadcopters, VR immersive modules, and NEP 2020 aligned AI pedagogy to academic delegates.',
    tags: ['3D Printing', 'Drones', 'RJIL Lab'],
    featured: true,
    uploadedBy: 'Admin',
    createdAt: '2026-06-15T11:30:00Z'
  },
  {
    id: 'EVT-2026-0003',
    title: 'Turnkey Industrial Robotics & AI Research Center',
    category: 'University Labs',
    institution: 'University & College Innovation Centers',
    date: '2026-05-20',
    attendees: '40+ Workbenches',
    image: 'assets/events/event_institutional_stem_lab.jpg',
    images: [
      'assets/events/event_institutional_stem_lab.jpg',
      'assets/brochure/lab_setup_modern_room.jpg',
      'assets/brochure/lab_setup_aec_inauguration.jpg',
      'assets/brochure/championship_lamp_testing.jpg'
    ],
    description: 'Deployment of 6-axis robotic arms, industrial microcontrollers, high-speed vision cameras, and rapid prototyping equipment for university research.',
    tags: ['Robotic Arm', 'Industrial Automation'],
    featured: true,
    uploadedBy: 'Admin',
    createdAt: '2026-05-20T09:00:00Z'
  },
  {
    id: 'EVT-2026-0004',
    title: 'Higher Education Faculty Development in AI & Robotics',
    category: 'College Bootcamps',
    institution: 'Faculty Development Program (FDP)',
    date: '2026-04-10',
    attendees: '120+ Professors',
    image: 'assets/events/event_corporate_faculty_fdp.jpg',
    images: [
      'assets/events/event_corporate_faculty_fdp.jpg',
      'assets/brochure/workshop_classroom_lecture.jpg',
      'assets/brochure/vigyan_jyoti_girls_stem.jpg',
      'assets/brochure/gallery_jnv_purba_medinipur_cohort.jpg'
    ],
    description: 'Comprehensive masterclass training university professors and lab instructors on teaching hands-on robotics, drone aviation, and machine learning.',
    tags: ['FDP Certification', 'AI/ML'],
    featured: true,
    uploadedBy: 'Admin',
    createdAt: '2026-04-10T14:00:00Z'
  }
];

const DEFAULT_TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Rahul Kumar Singh',
    role: 'Founder & Director',
    department: 'Leadership',
    category: 'leadership',
    image: 'assets/team/rahul_kr_singh.jpg',
    email: 'rksingh.singh957@gmail.com',
    responsibilities: 'Strategic planning, enterprise vision, academic partnerships with NITs & premier institutions, and overall organizational growth.',
    qualification: 'B.TECH',
    experience: '8+ Years',
    skills: ['Enterprise Strategy', 'Robotics Innovation', 'Academic Alliances']
  },
  {
    id: 2,
    name: 'Rishav Ranjan',
    role: 'CEO & Co-Founder',
    department: 'Leadership',
    category: 'leadership',
    image: 'assets/team/rishav_ranjan.jpg',
    email: 'rishav8866@gmail.com',
    responsibilities: 'Operations management, nationwide STEM innovation lab deployments, institutional relations, and scalable curriculum delivery.',
    qualification: 'B.TECH+M.TECH',
    experience: '6+ Years',
    skills: ['Operations Management', 'STEM Expansion', 'Program Scalability']
  },
  {
    id: 3,
    name: 'Aditya Pandey',
    role: 'Lead Trainer',
    department: 'Training & Curriculum',
    category: 'lead-trainers',
    image: 'assets/team/aditya_pandey.jpg',
    email: 'adityakrpandey@gmail.com',
    responsibilities: 'Advanced robotics curriculum design, Arduino micro-controller masterclasses, and leading technical training faculty across partner schools.',
    qualification: 'B.TECH',
    experience: '5+ Years',
    skills: ['Curriculum Design', 'Arduino & C++', 'Robotics Architecture']
  },
  {
    id: 4,
    name: 'Deo Narayan',
    role: 'Lead Trainer',
    department: 'Training & Curriculum',
    category: 'lead-trainers',
    image: '',
    email: 'deonarayansingh4515@gmail.com',
    responsibilities: 'Hands-on robotics workshop facilitation, AI & IoT training modules, project debugging, and student national competition coaching.',
    qualification: 'B.TECH',
    experience: '3+ Years',
    skills: ['AI & IoT Labs', 'Hardware Debugging', 'Competition Coaching']
  },
  {
    id: 5,
    name: 'SK Ayub',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/sk_ayub.jpg',
    email: 'skayub2205@gmail.com',
    responsibilities: 'Conducting practical lab sessions, assisting students in circuit design, sensor interfacing, and mechanical bot assembly.',
    qualification: 'B.TECH',
    experience: '2+ Years',
    skills: ['Circuit Design', 'Sensor Interfacing', 'Student Mentoring']
  },
  {
    id: 6,
    name: 'Sakshi Kumari',
    role: 'Office Executive',
    department: 'Administration & Operations',
    category: 'operations',
    image: 'assets/team/sakshi_kumari.jpg',
    email: 'sakshisharma86950@gmail.com',
    responsibilities: 'Managing front-office communications, student admissions, documentation, academic records, and executive logistics.',
    qualification: 'B.COM',
    experience: '1+ Year',
    skills: ['Office Administration', 'Documentation', 'Student Coordination']
  },
  {
    id: 7,
    name: 'Sakina Khatoon',
    role: 'HR Executive',
    department: 'Human Resources',
    category: 'operations',
    image: 'assets/team/sakina_khatoon.jpg',
    email: 'sakinakhatoon167@gmail.com',
    responsibilities: 'Leading talent acquisition, employee welfare, trainer orientation programs, and workplace policy compliance.',
    qualification: 'MA + B.Ed',
    experience: '6+ Years',
    skills: ['Talent Acquisition', 'HR Operations', 'Trainer Development']
  },
  {
    id: 8,
    name: 'Debleena Roy',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/debleena_roy.jpg',
    email: 'debolinaroy45521@gmail.com',
    responsibilities: 'Junior robotics & STEM workshop facilitation, creative thinking challenges, and beginner coding sessions for school kids.',
    qualification: 'B.Sc (Hons)',
    experience: '1.5 Years',
    skills: ['STEM for Kids', 'Block-Based Coding', 'Practical Demonstrations']
  },
  {
    id: 9,
    name: 'Jibrail Kalim',
    role: 'Business Development Executive',
    department: 'Business Development',
    category: 'operations',
    image: 'assets/team/jibrail_kalim.jpg',
    email: 'onlyjibrail123@gmail.com',
    responsibilities: 'Expanding school & institutional outreach, client relationship management, and coordinating institutional lab setups.',
    qualification: 'B.TECH',
    experience: '2.3 Years',
    skills: ['Institutional Outreach', 'Partnerships', 'Client Relations']
  },
  {
    id: 10,
    name: 'Priyesh Ranjan',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/priyesh_ranjan.jpg',
    email: 'priyeshranjan6460@gmail.com',
    responsibilities: 'Assisting in robotic chassis assembly, motor drivers, breadboard prototyping, and student hardware doubt clearing.',
    qualification: 'B.TECH',
    experience: '1+ Year',
    skills: ['Hardware Assembly', 'Motor Drivers', 'Lab Support']
  },
  {
    id: 11,
    name: 'Ankit Kumar',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/ankit_kumar.jpg',
    email: 'ankitkumar50680@gmail.com',
    responsibilities: 'Guiding students through IoT sensors, Arduino sketch coding, and troubleshooting student lab hardware kits.',
    qualification: 'B.TECH',
    experience: '1+ Year',
    skills: ['IoT Sensors', 'Arduino Sketches', 'Kit Troubleshooting']
  },
  {
    id: 12,
    name: 'Harsh Kumar',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/harsh_kumar.jpg',
    email: 'harshkumar1905204@gmail.com',
    responsibilities: 'Mentoring students in embedded firmware basics, line follower robots, and obstacle-avoidance bot projects.',
    qualification: 'B.TECH',
    experience: '1+ Year',
    skills: ['Embedded Firmware', 'Autonomous Bots', 'Project Mentorship']
  },
  {
    id: 13,
    name: 'Akash Poddar',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/akash_poddar.jpg',
    email: 'akashpoddar311@gmail.com',
    responsibilities: 'Coordinating robotics workshop equipment, conducting hands-on prototyping drills, and student practical guidance.',
    qualification: 'B.TECH',
    experience: '1+ Year',
    skills: ['Lab Equipment Setup', 'Practical Drills', 'Component Testing']
  },
  {
    id: 15,
    name: 'Pranab Dutta',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/pranab_dutta.jpg',
    email: 'itz.pranabb@gmail.com',
    responsibilities: 'Student software & hardware debugging, sensor calibration, and introductory AI & Python programming support.',
    qualification: 'B.TECH',
    experience: '1+ Year',
    skills: ['Python & AI Support', 'Sensor Calibration', 'Code Debugging']
  },
  {
    id: 16,
    name: 'Sonu Kr Patel',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/sonu_kr_patel.jpg',
    email: '2307skp@gmail.com',
    responsibilities: 'Lab maintenance, testing electronic components, and assisting students during mechanical fabrication sessions.',
    qualification: 'B.TECH',
    experience: '1+ Year',
    skills: ['Mechanical Fabrication', 'Component QA', 'Lab Maintenance']
  },
  {
    id: 17,
    name: 'Sahil Ansari',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/sahil_ansari.jpg',
    email: 'sahil.kgec@gmail.com',
    responsibilities: 'Conducting introductory electronics drills, breadboard prototyping, and assisting junior learners with robotic kits.',
    qualification: 'B.TECH',
    experience: '1+ Year',
    skills: ['Electronics Basics', 'Breadboarding', 'Junior Mentorship']
  },
  {
    id: 18,
    name: 'Asif Mondal',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/asif_mondal.jpg',
    email: 'asif9030152@gmail.com',
    responsibilities: 'Soldering guidance, hardware assembly safety, robotic arm kit demonstrations, and student project evaluation.',
    qualification: 'B.TECH',
    experience: '1+ Year',
    skills: ['Hardware Safety', 'Robotic Arms', 'Project Evaluation']
  }
];

const DEFAULT_COURSES = [
  {
    id: 'basic-robotics-school',
    title: 'Basic Robotics for School Students',
    category: 'School STEM',
    price: 1999,
    currency: 'INR',
    duration: '4 Weeks',
    level: 'Beginner',
    image: 'assets/courses/course_basic_robotics.jpg',
    description: 'Foundational electronics, motors, chassis assembly, and block-based Scratch/Blockly coding for young engineers.',
    modules: ['Introduction to Electronics & Circuits', 'Motors & Gearboxes Prototyping', 'Block-Based Sensor Interfacing', 'Obstacle Avoidance Rover Project']
  },
  {
    id: 'advanced-robotics-embedded',
    title: 'Advanced Robotics & Embedded Systems',
    category: 'College & Engineering',
    price: 3999,
    currency: 'INR',
    duration: '8 Weeks',
    level: 'Advanced',
    image: 'assets/courses/course_advanced_robotics.jpg',
    description: 'Microcontroller architecture, C/C++ firmware, PWM motor drivers, PID control, and wireless robotic teleoperation.',
    modules: ['AVR/ESP32 Embedded Architecture', 'Sensor Telemetry & Communication', 'PID Motor Control Systems', 'Autonomous Robotic Arm Fabrication']
  },
  {
    id: 'ai-ml-masterclass',
    title: 'Artificial Intelligence & Machine Learning',
    category: 'AI & Data Science',
    price: 3499,
    currency: 'INR',
    duration: '6 Weeks',
    level: 'Intermediate',
    image: 'assets/courses/course_ai.jpg',
    description: 'Python programming, NumPy/Pandas data pipelines, OpenCV computer vision, and neural network model deployment.',
    modules: ['Python for Data Science & AI', 'OpenCV Vision Processing', 'Supervised & Unsupervised Learning', 'Edge AI Model Deployment']
  },
  {
    id: 'drone-aerial-robotics',
    title: 'Drone Technology & Aerial Robotics',
    category: 'Aviation & Robotics',
    price: 4499,
    currency: 'INR',
    duration: '6 Weeks',
    level: 'Intermediate',
    image: 'assets/courses/course_drone_tech.jpg',
    description: 'Aerodynamics, quadcopter flight controllers, ESC calibration, brushless motors, and autonomous GPS waypoint navigation.',
    modules: ['Principles of Drone Aerodynamics', 'Flight Controllers & ESC Calibration', 'Radio Telemetry & Failsafe Config', 'Autonomous Flight & Aerial Filming']
  },
  {
    id: 'iot-smart-systems',
    title: 'IoT (Internet of Things) & Smart Systems',
    category: 'Connected Hardware',
    price: 2999,
    currency: 'INR',
    duration: '5 Weeks',
    level: 'Intermediate',
    image: 'assets/courses/course_iot.jpg',
    description: 'Cloud dashboard integration, MQTT/HTTP protocols, sensor arrays, home automation, and smart agriculture IoT hubs.',
    modules: ['ESP32/NodeMCU WiFi Architecture', 'MQTT & REST API Cloud Sync', 'Sensor Data Visualization Dashboards', 'Smart City Prototyping']
  },
  {
    id: 'cyber-security',
    title: 'Cyber Security & Ethical Hacking',
    category: 'Cybersecurity',
    price: 3999,
    currency: 'INR',
    duration: '6 Weeks',
    level: 'Intermediate',
    image: 'assets/courses/course_cyber_security.jpg',
    description: 'Network penetration testing, vulnerability scanning, cryptographic protocols, defensive cyber hygiene, and OWASP Top 10.',
    modules: ['Networking Protocols & Packet Capture', 'Vulnerability Assessment & Scans', 'Web Application Security & OWASP', 'Cryptographic Security & Defense']
  },
  {
    id: '3d-printing',
    title: '3D Design & Rapid Prototyping',
    category: 'Design & Prototyping',
    price: 2499,
    currency: 'INR',
    duration: '4 Weeks',
    level: 'Beginner',
    image: 'assets/courses/course_3d_printing.jpg',
    description: 'CAD modeling in Fusion 360 / Tinkercad, slicing software calibration, FDM 3D printer operation, and mechanical part printing.',
    modules: ['3D CAD Parametric Modeling', 'Slicing Engines & G-Code Generation', 'FDM Printer Operation & Calibration', 'Mechanical Enclosure Fabrication']
  },
  {
    id: 'fullstack-web-app',
    title: 'Web Development (Full-Stack & UX)',
    category: 'Software Engineering',
    price: 4999,
    currency: 'INR',
    duration: '10 Weeks',
    level: 'Intermediate',
    image: 'assets/courses/course_web_dev.jpg',
    description: 'HTML5/CSS3/JavaScript, Node.js, Express, REST APIs, database integration, responsive UI/UX, and cloud deployment.',
    modules: ['Responsive Modern Frontend UI', 'Node.js & Express REST APIs', 'Database Design & CRUD Storage', 'Production Cloud Hosting & CI/CD']
  },
  {
    id: 'ar-vr-immersive',
    title: 'AR/VR & Immersive Media',
    category: 'Spatial Computing',
    price: 3999,
    currency: 'INR',
    duration: '6 Weeks',
    level: 'Intermediate',
    image: 'assets/courses/course_space_tech.jpg',
    description: 'Unity 3D engine, spatial interactive environments, VR headset integration, WebXR, and augmented reality educational apps.',
    modules: ['Unity 3D Environment Creation', 'C# Scripting for Spatial Physics', 'WebXR & Mobile AR Frameworks', 'Interactive VR Simulation Project']
  },
  {
    id: 'space-technology',
    title: 'Space Technology & Satellite Engineering',
    category: 'Aerospace & Satellites',
    price: 4999,
    currency: 'INR',
    duration: '6 Weeks',
    level: 'Intermediate',
    image: 'assets/courses/course_space_tech.jpg',
    description: 'Insights into the science and engineering behind space exploration, satellite orbits, CanSat payloads, rocketry, and mission telemetry.',
    modules: [
      'Orbital Mechanics & Satellite Orbits',
      'CanSat Payload Prototyping',
      'Radio Telemetry & Ground Stations',
      'Rocketry & Atmospheric Exploration'
    ]
  },
  {
    id: 'social-media-marketing',
    title: 'Social Media Marketing & Brand Management',
    category: 'Digital Marketing',
    price: 3999,
    currency: 'INR',
    duration: '4 Weeks',
    level: 'Beginner',
    image: 'assets/courses/course_social_media.jpg',
    description: 'Teaches students how to strategically use digital platforms for brand management, audience engagement, content creation, and modern analytics.',
    modules: [
      'Digital Brand Identity & Content Strategy',
      'Campaign Design & Paid Advertising',
      'Social Media Analytics & Conversion',
      'Influencer & Community Management'
    ]
  }
];

function loadDefaultProducts() {
  try {
    const rootDataPath = path.join(PROJECT_ROOT, 'data', 'products.json');
    if (fs.existsSync(rootDataPath)) {
      const raw = fs.readFileSync(rootDataPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export const db = {
  getUsers: () => readData('users.json', []),
  saveUsers: (users) => writeData('users.json', users),

  getInquiries: () => readData('inquiries.json', []),
  saveInquiries: (inquiries) => writeData('inquiries.json', inquiries),

  getApplications: () => readData('applications.json', []),
  saveApplications: (applications) => writeData('applications.json', applications),

  getCertificates: () => readData('certificates.json', []),
  saveCertificates: (certs) => writeData('certificates.json', certs),

  getActivities: () => readData('activities.json', []),
  saveActivities: (activities) => writeData('activities.json', activities),

  getNewsletters: () => readData('newsletters.json', []),
  saveNewsletters: (newsletters) => writeData('newsletters.json', newsletters),

  getProgramInterests: () => readData('program-interests.json', []),
  saveProgramInterests: (interests) => writeData('program-interests.json', interests),

  getFeedback: () => readData('feedback.json', []),
  saveFeedback: (feedback) => writeData('feedback.json', feedback),

  getAnalytics: () => readData('analytics-events.json', []),
  saveAnalytics: (events) => writeData('analytics-events.json', events),

  getEventsGallery: () => readData('events-gallery.json', DEFAULT_EVENTS_GALLERY),
  saveEventsGallery: (events) => writeData('events-gallery.json', events),
  getEvents: () => readData('events-gallery.json', DEFAULT_EVENTS_GALLERY),
  saveEvents: (events) => writeData('events-gallery.json', events),

  getTeamMembers: () => readData('team.json', DEFAULT_TEAM_MEMBERS),
  saveTeamMembers: (members) => writeData('team.json', members),
  getTeam: () => readData('team.json', DEFAULT_TEAM_MEMBERS),
  saveTeam: (members) => writeData('team.json', members),

  getCourses: () => readData('courses.json', DEFAULT_COURSES),
  saveCourses: (courses) => writeData('courses.json', courses),

  getProducts: () => readData('products.json', loadDefaultProducts()),
  saveProducts: (products) => writeData('products.json', products),

  getOrders: () => readData('orders.json', []),
  saveOrders: (orders) => writeData('orders.json', orders),

  getShowcase: () => readData('showcase-gallery.json', []),
  saveShowcase: (items) => writeData('showcase-gallery.json', items),

  getSettings: () => readData('settings.json', {}),
  saveSettings: (settings) => writeData('settings.json', settings)
};

