import { createIcons } from './icons.js';
import {
  CSRFManager,
  RateLimiter,
  getCsrfToken,
  sanitizePlainText,
  validateEmail,
  validatePhone,
  readJsonResponse
} from './security.js';

if (typeof window !== 'undefined') {
  window.getCsrfToken = getCsrfToken;
  window.CSRFManager = CSRFManager;
  window.readJsonResponse = readJsonResponse;
}

const navToggle = document.getElementById('navToggle');
const navPanel = document.getElementById('navPanel');
const newsletterForm = document.getElementById('newsletterForm');
const contactForm = document.getElementById('contactForm');
const feedbackForm = document.getElementById('feedbackForm');
const contactFeedback = document.getElementById('contactFeedback');
const newsletterFeedback = document.getElementById('newsletterFeedback');
const feedbackStatus = document.getElementById('feedbackStatus');
const interestInput = document.getElementById('interestInput');
const teamGrid = document.getElementById('teamGrid');
const toTop = document.getElementById('toTop');
const themeToggle = document.getElementById('themeToggle');
const cookieBanner = document.getElementById('cookieBanner');
const cookieAccept = document.getElementById('cookieAccept');
const cookieReject = document.getElementById('cookieReject');
const feedbackOpen = document.getElementById('feedbackOpen');
const accountOpen = document.getElementById('accountOpen');
const accountOpenFooter = document.getElementById('accountOpenFooter');
const accountLoginForm = document.getElementById('accountLoginForm');
const accountRegisterForm = document.getElementById('accountRegisterForm');
const accountLoginPanel = document.getElementById('accountLoginPanel');
const accountRegisterPanel = document.getElementById('accountRegisterPanel');
const accountResetPanel = document.getElementById('accountResetPanel');
const accountResetForm = document.getElementById('accountResetForm');
const accountSessionPanel = document.getElementById('accountSessionPanel');
const accountStatus = document.getElementById('accountStatus');
const accountLogout = document.getElementById('accountLogout');
const accountWelcome = document.getElementById('accountWelcome');
const accountEmail = document.getElementById('accountEmail');
const accountRoleBadge = document.getElementById('accountRoleBadge');
const appStatus = document.getElementById('appStatus');
const adminOpen = document.getElementById('adminOpen');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogout = document.getElementById('adminLogout');
const adminRefresh = document.getElementById('adminRefresh');
const adminStatus = document.getElementById('adminStatus');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginPanel = document.getElementById('adminLoginPanel');
const adminStats = document.getElementById('adminStats');
const adminActivity = document.getElementById('adminActivity');
const adminAccountActivity = document.getElementById('adminAccountActivity');
const adminFailedLogins = document.getElementById('adminFailedLogins');
const adminLeads = document.getElementById('adminLeads');
const adminUsers = document.getElementById('adminUsers');
let revealObserver;

const fallbackTeam = [
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
    image: 'assets/team/ankit_kumar.png',
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
    image: 'assets/team/harsh_kumar.png',
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
    image: 'assets/team/sahil_ansari.png',
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
  },
  {
    id: 19,
    name: 'Subhajit Maji',
    role: 'Robotics & AI Trainer',
    department: 'Training & Curriculum',
    category: 'lead-trainers',
    image: '',
    email: 'subhajitmaji575@gmail.com',
    responsibilities: 'Robotics & AI training, curriculum delivery in IoT, electronics, sensors, microcontrollers, and project-based STEM learning.',
    qualification: 'B.TECH',
    experience: '1.5+ Years',
    skills: ['Arduino', 'Python/C++', 'IoT', 'Electronics', 'AI Fundamentals']
  },
  {
    id: 20,
    name: 'Imran Kayal',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/imran_kayal.jpg',
    email: 'imrankayal@gmail.com',
    responsibilities: 'Electrical engineering fundamentals, circuit design, robotic wiring, motor controllers, and hands-on laboratory mentorship.',
    qualification: 'B.Tech (Electrical Engg.)',
    experience: '1+ Year',
    skills: ['Electrical Engineering', 'Circuit Design', 'Robotic Wiring', 'Motor Controllers']
  },
  {
    id: 21,
    name: 'Yuvraj Singh',
    role: 'Assistant Trainer',
    department: 'Training & Curriculum',
    category: 'assistant-trainers',
    image: 'assets/team/yuvraj_singh.png',
    email: 'yuvrajsingh@gmail.com',
    responsibilities: 'AI & Machine Learning training, Python algorithms, neural network fundamentals, computer vision, and hands-on robotics intelligent systems projects.',
    qualification: 'B.Tech (AI & ML)',
    experience: '1+ Year',
    skills: ['Artificial Intelligence', 'Machine Learning', 'Python', 'Computer Vision']
  }
];

let allTeamMembers = [];
let allCoursesList = [];

applyTheme(localStorage.getItem('robotree_theme') || 'dark');
initNavigation();
initForms();
initCookieConsent();
initModals();
initAccountAccess();
initLiveLocation();
initAdminPanel();
initExperiment();
initTeamEmailModal();
refreshIcons();

const runWhenIdle = (fn) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => fn(), { timeout: 2000 });
  } else {
    setTimeout(fn, 60);
  }
};

runWhenIdle(() => {
  loadTeam();
  initPublicEventGallery();
  loadPublicCourses();
  loadDynamicSiteSettings();
});

document.addEventListener('DOMContentLoaded', () => {
  const safeInit = (fn, name) => {
    try {
      fn();
    } catch (err) {
      console.warn(`[Init] ${name || 'module'} error:`, err);
    }
  };

  safeInit(initRevealAnimations, 'revealAnimations');
  safeInit(initStatsCounter, 'statsCounter');
  safeInit(initScrollProgressBarAndFloatingToTop, 'scrollProgress');
  safeInit(initSiteSearch, 'siteSearch');
  safeInit(initFloatingContact, 'floatingContact');
  safeInit(initPasswordVisibilityToggles, 'passwordToggles');
  safeInit(initCopyButtons, 'copyButtons');
  safeInit(initUtmTracking, 'utmTracking');
  safeInit(initCollegeTabs, 'collegeTabs');
  safeInit(initMarqueeRotate, 'marqueeRotate');
  safeInit(loadDynamicSiteSettings, 'siteSettings');
  safeInit(initStoreClient, 'storeClient');
  safeInit(initBranchTabs, 'branchTabs');
  safeInit(() => {
    trackEvent('page_view', { path: window.location.pathname, ...getStoredUtm() });
    if (window.location.hash === '#admin') {
      openModal('adminModal');
      loadAdminDashboard();
    }
  }, 'pageTracking');
});

window.addEventListener('error', (event) => {
  console.warn('[Robotree Window Error]', event?.message || event);
});

window.addEventListener('unhandledrejection', (event) => {
  console.warn('[Robotree Unhandled Rejection]', event?.reason || event);
});

/** Hydrate Dynamic Hero Metric & Government Protocol from Server Settings */
async function loadDynamicSiteSettings() {
  try {
    const res = await fetch('/api/site-settings');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.settings) return;
    const { heroStatNumber, heroStatLabel, governmentProtocol } = data.settings;

    if (heroStatNumber) {
      const heroNum = document.getElementById('heroStatNumber');
      if (heroNum) heroNum.textContent = heroStatNumber;
      const gridStat = document.getElementById('gridStatStudents');
      if (gridStat) gridStat.textContent = heroStatNumber;
      const galleryStat = document.getElementById('galleryStatStudents');
      if (galleryStat) galleryStat.textContent = heroStatNumber;
    }

    if (heroStatLabel) {
      const heroLabel = document.getElementById('heroStatLabel');
      if (heroLabel) heroLabel.textContent = heroStatLabel;
      const gridLabel = document.getElementById('gridStatStudentsLabel');
      if (gridLabel) gridLabel.textContent = heroStatLabel;
      const galleryLabel = document.getElementById('galleryStatStudentsLabel');
      if (galleryLabel) galleryLabel.textContent = heroStatLabel;
    }

    if (governmentProtocol) {
      document.querySelectorAll('.footer-protocol-text').forEach((el) => {
        el.textContent = governmentProtocol;
      });
    }
  } catch (err) {
    // Graceful fallback to static HTML content
  }
}

function initNavigation() {
  navToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navPanel.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navPanel?.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) {
      navPanel.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // Close nav on click outside
  document.addEventListener('click', (event) => {
    if (navPanel?.classList.contains('open') && !navPanel.contains(event.target) && !navToggle?.contains(event.target)) {
      navPanel.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // Close nav on Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navPanel?.classList.contains('open')) {
      navPanel.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
      navToggle?.focus();
    }
  });

  // Reset open menu on desktop resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1240 && navPanel?.classList.contains('open')) {
      navPanel.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  }, { passive: true });

  themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.dataset.theme || 'dark';
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initForms() {
  document.querySelectorAll('.program-interest-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const program = sanitizePlainText(button.dataset.program || 'Robotree Program', 120);
      const originalText = button.innerHTML;
      setButtonBusy(button, true, 'Sending...');

      try {
        await postJson('/api/program-interest', { program });
        if (interestInput) interestInput.value = program;
        contactForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showFeedback(contactFeedback, `Selected: ${program}. Send your details and our team will contact you.`);
      } catch {
        if (interestInput) interestInput.value = program;
        contactForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showFeedback(contactFeedback, `Selected: ${program}. Backend is offline, but you can still submit your inquiry.`);
      } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        refreshIcons();
      }
    });
  });

  contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector("button[type='submit']");
    const payload = { ...formToPayload(contactForm), ...getStoredUtm() };

    if (RateLimiter.isRateLimited('contact_form', 5, 60000)) {
      return showFeedback(contactFeedback, 'Please wait a moment before submitting again.', true);
    }
    if (!payload.name || !validateEmail(payload.email) || !payload.message) {
      return showFeedback(contactFeedback, 'Name, valid email, and message are required.', true);
    }
    if (!validatePhone(payload.phone)) {
      return showFeedback(contactFeedback, 'Please enter a valid phone number.', true);
    }

    setButtonBusy(submitButton, true, 'Submitting...');
    try {
      const result = await postJson('/api/contact', payload);
      contactForm.reset();
      showFeedback(contactFeedback, result.message || 'Inquiry submitted successfully.');
      trackEvent('lead_submitted', { interest: payload.interest || 'General Inquiry', ...getStoredUtm() });
    } catch (error) {
      showFeedback(contactFeedback, error.message || 'Could not submit inquiry. Please try again.', true);
    } finally {
      setButtonBusy(submitButton, false);
      refreshIcons();
    }
  });

  newsletterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = newsletterForm.querySelector('input');
    const submitButton = newsletterForm.querySelector("button[type='submit']");
    const email = sanitizePlainText(input?.value || '', 120).toLowerCase();

    if (RateLimiter.isRateLimited('newsletter_form', 4, 60000)) {
      return showFeedback(newsletterFeedback, 'Please wait before trying again.', true);
    }
    if (!validateEmail(email)) {
      return showFeedback(newsletterFeedback, 'Please enter a valid email address.', true);
    }

    setButtonBusy(submitButton, true);
    try {
      const result = await postJson('/api/newsletter', { email });
      if (input) input.value = '';
      showFeedback(newsletterFeedback, result.message || 'Thanks for subscribing.');
      trackEvent('newsletter_subscribe');
    } catch (error) {
      showFeedback(newsletterFeedback, error.message || 'Could not subscribe right now.', true);
    } finally {
      setButtonBusy(submitButton, false);
      refreshIcons();
    }
  });

  feedbackForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = feedbackForm.querySelector("button[type='submit']");
    const payload = formToPayload(feedbackForm);

    if (RateLimiter.isRateLimited('feedback_form', 4, 60000)) {
      return showFeedback(feedbackStatus, 'Please wait before sending more feedback.', true);
    }
    if (!validateEmail(payload.email) || !payload.message) {
      return showFeedback(feedbackStatus, 'Valid email and feedback are required.', true);
    }

    setButtonBusy(submitButton, true, 'Sending...');
    try {
      const result = await postJson('/api/feedback', payload);
      feedbackForm.reset();
      showFeedback(feedbackStatus, result.message || 'Feedback received.');
      trackEvent('feedback_submitted');
    } catch (error) {
      showFeedback(feedbackStatus, error.message || 'Could not send feedback.', true);
    } finally {
      setButtonBusy(submitButton, false);
      refreshIcons();
    }
  });
}

function initCookieConsent() {
  const consent = localStorage.getItem('robotree_cookie_consent');
  if (cookieBanner && consent) {
    cookieBanner.hidden = true;
  }

  cookieAccept?.addEventListener('click', () => {
    localStorage.setItem('robotree_cookie_consent', 'all');
    if (cookieBanner) cookieBanner.hidden = true;
    trackEvent('cookie_accept');
  });

  cookieReject?.addEventListener('click', () => {
    localStorage.setItem('robotree_cookie_consent', 'essential');
    if (cookieBanner) cookieBanner.hidden = true;
  });
}

function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach((button) => {
    button.addEventListener('click', () => openModal(button.dataset.modalOpen));
  });

  feedbackOpen?.addEventListener('click', () => openModal('feedbackModal'));
  accountOpen?.addEventListener('click', () => {
    if (document.getElementById('adminLoginForm')) {
      const passcodeField = document.getElementById('adminPasscode');
      if (passcodeField && !sessionStorage.getItem('robotree_admin_token')) {
        passcodeField.focus();
        passcodeField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    openModal('accountModal');
  });
  accountOpenFooter?.addEventListener('click', () => openModal('accountModal'));
  
  const locationOpen = document.getElementById('locationOpen');
  const locationOpenHero = document.getElementById('locationOpenHero');
  const locationOpenFooter = document.getElementById('locationOpenFooter');
  locationOpen?.addEventListener('click', () => openModal('locationModal'));
  locationOpenHero?.addEventListener('click', () => openModal('locationModal'));
  locationOpenFooter?.addEventListener('click', () => openModal('locationModal'));

  adminOpen?.addEventListener('click', () => {
    openModal('adminModal');
    loadAdminDashboard();
  });

  document.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop')));
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModal(backdrop);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(closeModal);
    }
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  initPasswordVisibilityToggles();
  const focusTarget = modal.querySelector('input, textarea, button, a');
  window.setTimeout(() => focusTarget?.focus(), 0);
}

function closeModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  if (!document.querySelector('.modal-backdrop:not([hidden])')) {
    document.body.classList.remove('modal-open');
  }
}

function initAccountAccess() {
  renderAccountSession();

  let activePortalRole = 'Student';

  // Role selector tab buttons (Student / Employee / Admin)
  document.querySelectorAll('[data-portal-role]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-portal-role]').forEach((b) => b.classList.remove('is-active'));
      button.classList.add('is-active');
      const role = button.dataset.portalRole;
      
      const accountActionTabs = document.getElementById('accountActionTabs');
      const accountAdminPanel = document.getElementById('accountAdminPanel');
      const portalRoleBanner = document.getElementById('portalRoleBanner');
      const registerRoleBanner = document.getElementById('registerRoleBanner');
      const loginRoleInput = document.getElementById('loginRoleInput');
      const registerRoleInput = document.getElementById('registerRoleInput');

      if (role === 'admin') {
        if (accountActionTabs) accountActionTabs.hidden = true;
        if (accountLoginPanel) accountLoginPanel.hidden = true;
        if (accountRegisterPanel) accountRegisterPanel.hidden = true;
        if (accountResetPanel) accountResetPanel.hidden = true;
        if (accountAdminPanel) accountAdminPanel.hidden = false;
      } else {
        activePortalRole = role === 'employee' ? 'Employee' : 'Student';
        if (accountActionTabs) accountActionTabs.hidden = false;
        if (accountAdminPanel) accountAdminPanel.hidden = true;
        if (loginRoleInput) loginRoleInput.value = activePortalRole;
        if (registerRoleInput) registerRoleInput.value = activePortalRole;
        if (portalRoleBanner) portalRoleBanner.innerHTML = `<span>Logging in as <strong>${activePortalRole}</strong></span>`;
        if (registerRoleBanner) registerRoleBanner.innerHTML = `<span>Creating account as <strong>${activePortalRole}</strong></span>`;
        switchAccountView('login');
      }
    });
  });

  if (document.getElementById('adminLoginForm')) {
    const adminRoleTab = document.querySelector('[data-portal-role="admin"]');
    if (adminRoleTab) {
      adminRoleTab.click();
    }
  }

  // Admin Passcode inside portal modal
  const portalAdminForm = document.getElementById('portalAdminForm');
  portalAdminForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = portalAdminForm.querySelector("button[type='submit']");
    const passcode = String(document.getElementById('portalAdminPasscode')?.value || '');

    if (RateLimiter.isRateLimited('admin_login', 5, 15 * 60000)) {
      return setAccountStatus('Too many attempts. Please wait before trying again.', true);
    }

    setButtonBusy(submitButton, true, 'Verifying...');
    try {
      const result = await postJson('/api/admin/login', { passcode });
      sessionStorage.setItem('robotree_admin_token', result.token);
      setAccountStatus('Admin passcode verified. Redirecting to admin dashboard...');
      window.location.href = 'admin.html';
    } catch (error) {
      setAccountStatus(error.message || 'Invalid admin passcode.', true);
    } finally {
      setButtonBusy(submitButton, false);
      refreshIcons();
    }
  });

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-switch-reset]');
    if (btn) {
      event.preventDefault();
      switchAccountView('reset');
    }
  });

  document.querySelectorAll('[data-account-view]').forEach((button) => {
    button.addEventListener('click', () => switchAccountView(button.dataset.accountView || 'login'));
  });

  accountResetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = accountResetForm.querySelector("button[type='submit']");
    const formData = new FormData(accountResetForm);
    const email = sanitizePlainText(String(formData.get('email') || ''), 120).toLowerCase();
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (RateLimiter.isRateLimited('account_reset', 4, 10 * 60000)) {
      return setAccountStatus('Too many reset attempts. Please wait a few minutes.', true);
    }
    if (!validateEmail(email)) {
      return setAccountStatus('Please enter a valid email address.', true);
    }
    if (newPassword.length < 8) {
      return setAccountStatus('New password must be at least 8 characters long.', true);
    }
    if (newPassword !== confirmPassword) {
      return setAccountStatus('Passwords do not match. Please re-enter confirm password.', true);
    }

    setButtonBusy(submitButton, true, 'Resetting...');
    try {
      const result = await postJson('/api/auth/reset-password', { email, newPassword });
      accountResetForm.reset();
      setAccountStatus(result.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        switchAccountView('login');
      }, 1400);
    } catch (error) {
      setAccountStatus(error.message || 'Could not reset password. Check email address.', true);
    } finally {
      setButtonBusy(submitButton, false);
      refreshIcons();
    }
  });

  accountRegisterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = accountRegisterForm.querySelector("button[type='submit']");
    const payload = getAccountFormPayload(accountRegisterForm);
    payload.role = activePortalRole;

    if (RateLimiter.isRateLimited('account_register', 4, 10 * 60000)) {
      return setAccountStatus('Please wait before creating another account.', true);
    }
    if (!payload.name || !validateEmail(payload.email) || payload.password.length < 8) {
      return setAccountStatus('Name, valid email, and 8+ character password are required.', true);
    }
    if (!validatePhone(payload.phone)) {
      return setAccountStatus('Please enter a valid phone number.', true);
    }

    setButtonBusy(submitButton, true, 'Creating...');
    try {
      const result = await postJson('/api/auth/register', payload);
      if (result.token) sessionStorage.setItem('robotree_session_token', result.token);
      saveAccountUser(result.user);
      accountRegisterForm.reset();
      switchAccountView('login');
      renderAccountSession();
      setAccountStatus(result.message || 'Account created successfully.');
      trackEvent('account_created', { role: result.user?.role || payload.role });
    } catch (error) {
      setAccountStatus(error.message || 'Could not create account.', true);
    } finally {
      setButtonBusy(submitButton, false);
      refreshIcons();
    }
  });

  accountLoginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = accountLoginForm.querySelector("button[type='submit']");
    const payload = getAccountFormPayload(accountLoginForm);
    payload.role = activePortalRole;

    if (RateLimiter.isRateLimited('account_login', 6, 10 * 60000)) {
      return setAccountStatus('Too many login attempts. Please wait and try again.', true);
    }
    if (!validateEmail(payload.email) || !payload.password) {
      return setAccountStatus('Valid email and password are required.', true);
    }

    setButtonBusy(submitButton, true, 'Signing in...');
    try {
      const result = await postJson('/api/auth/login', payload);
      if (result.token) sessionStorage.setItem('robotree_session_token', result.token);
      saveAccountUser(result.user);
      accountLoginForm.reset();
      renderAccountSession();
      setAccountStatus(result.message || 'Login successful.');
      trackEvent('account_login', { role: result.user?.role || payload.role });
    } catch (error) {
      setAccountStatus(error.message || 'Login failed.', true);
    } finally {
      setButtonBusy(submitButton, false);
      refreshIcons();
    }
  });

  accountLogout?.addEventListener('click', () => {
    const token = sessionStorage.getItem('robotree_session_token') || '';
    sessionStorage.removeItem('robotree_session_token');
    sessionStorage.removeItem('robotree_account_user');
    localStorage.removeItem('robotree_account_user');
    renderAccountSession();
    switchAccountView('login');
    setAccountStatus('Signed out.');
    window.dispatchEvent(new CustomEvent('robotree:user_logout'));
    if (token) {
      postJson('/api/auth/logout', {}, { Authorization: `Bearer ${token}` }).catch(() => {});
    }
  });

  // GPS Attendance Check-In Button in user session
  document.getElementById('sessionCheckInBtn')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distKm = calculateHaversineDistance(latitude, longitude, ROBOTREE_HQ.lat, ROBOTREE_HQ.lng);
        if (distKm <= 1.0) {
          alert(`✅ GPS Attendance Verified! You are within ${Math.round(distKm * 1000)}m of Robotree Sentrum Mall Lab.`);
        } else {
          alert(`📍 GPS Check-in: You are currently ${distKm.toFixed(1)} km away from Sentrum Mall Lab.`);
        }
      },
      (err) => alert('Could not get GPS location: ' + err.message)
    );
  });
}

const ROBOTREE_HQ = {
  name: 'Robotree Robotics LLP',
  address: 'Sentrum Mall, 3rd Floor, Shristinagar, Asansol, West Bengal',
  lat: 23.688864,
  lng: 86.966114
};

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function initLiveLocation() {
  const detectLocationBtn = document.getElementById('detectLocationBtn');
  const locationResult = document.getElementById('locationResult');
  const locationStatus = document.getElementById('locationStatus');

  detectLocationBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      if (locationStatus) locationStatus.textContent = 'Geolocation is not supported by your browser.';
      return;
    }

    setButtonBusy(detectLocationBtn, true, 'Detecting Live GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setButtonBusy(detectLocationBtn, false);
        const { latitude, longitude, accuracy } = position.coords;
        const distKm = calculateHaversineDistance(latitude, longitude, ROBOTREE_HQ.lat, ROBOTREE_HQ.lng);
        const distFormatted = distKm < 1 ? `${Math.round(distKm * 1000)} meters` : `${distKm.toFixed(1)} km`;

        let statusBadge = '';
        if (distKm <= 0.5) {
          statusBadge = '<span class="loc-badge-success">✅ You are currently AT Robotree Sentrum Mall Lab!</span>';
        } else {
          const driveTimeMins = Math.max(1, Math.round((distKm / 35) * 60));
          statusBadge = `<span class="loc-badge-info">📍 You are approx. <strong>${distFormatted}</strong> from Robotree HQ (~${driveTimeMins} mins drive)</span>`;
        }

        if (locationResult) {
          locationResult.hidden = false;
          locationResult.innerHTML = `
            <div class="loc-coords-card">
              ${statusBadge}
              <div class="loc-details-grid">
                <div><small>Your Live Coordinates</small><strong>${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E</strong></div>
                <div><small>GPS Accuracy</small><strong>±${Math.round(accuracy)} meters</strong></div>
                <div><small>Target Destination</small><strong>Sentrum Mall, Asansol</strong></div>
              </div>
              <a href="https://www.google.com/maps/dir/?api=1&destination=23.688864,86.966114" target="_blank" rel="noopener noreferrer" class="btn btn-primary loc-nav-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                Start Live Turn-by-Turn Navigation
              </a>
            </div>
          `;
        }
      },
      (err) => {
        setButtonBusy(detectLocationBtn, false);
        if (locationStatus) {
          locationStatus.textContent = 'Could not access location: ' + (err.message || 'Permission denied.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function switchAccountView(view) {
  const activeRoleBtn = document.querySelector('[data-portal-role].is-active');
  const isRoleAdmin = activeRoleBtn?.dataset?.portalRole === 'admin';
  if (isRoleAdmin) {
    const accountActionTabs = document.getElementById('accountActionTabs');
    const accountAdminPanel = document.getElementById('accountAdminPanel');
    if (accountActionTabs) accountActionTabs.hidden = true;
    if (accountLoginPanel) accountLoginPanel.hidden = true;
    if (accountRegisterPanel) accountRegisterPanel.hidden = true;
    if (accountResetPanel) accountResetPanel.hidden = true;
    if (accountAdminPanel) accountAdminPanel.hidden = false;
    return;
  }

  const isRegister = view === 'register';
  const isReset = view === 'reset';
  const isLogin = !isRegister && !isReset;

  if (accountLoginPanel) accountLoginPanel.hidden = !isLogin;
  if (accountRegisterPanel) accountRegisterPanel.hidden = !isRegister;
  if (accountResetPanel) accountResetPanel.hidden = !isReset;

  document.querySelectorAll('[data-account-view]').forEach((button) => {
    const active = button.dataset.accountView === (isRegister ? 'register' : (isReset ? 'reset' : 'login'));
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function getAccountFormPayload(form) {
  const formData = new FormData(form);
  return {
    name: sanitizePlainText(String(formData.get('name') || ''), 80),
    phone: sanitizePlainText(String(formData.get('phone') || ''), 24),
    email: sanitizePlainText(String(formData.get('email') || ''), 120).toLowerCase(),
    password: String(formData.get('password') || ''),
    role: normalizeAccountRole(String(formData.get('role') || 'Student'))
  };
}

function normalizeAccountRole(role) {
  return String(role).toLowerCase() === 'employee' ? 'Employee' : 'Student';
}

function saveAccountUser(user) {
  if (!user) return;
  sessionStorage.setItem('robotree_account_user', JSON.stringify(user));
  localStorage.setItem('robotree_account_user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('robotree:user_login', { detail: user }));
}

function getAccountUser() {
  try {
    const raw = sessionStorage.getItem('robotree_account_user') || localStorage.getItem('robotree_account_user');
    return JSON.parse(raw || 'null');
  } catch {
    sessionStorage.removeItem('robotree_account_user');
    localStorage.removeItem('robotree_account_user');
    return null;
  }
}

function renderAccountSession() {
  const user = getAccountUser();
  const signedIn = Boolean(user);

  if (accountSessionPanel) accountSessionPanel.hidden = !signedIn;
  if (accountLoginPanel) accountLoginPanel.hidden = signedIn;
  if (accountRegisterPanel) accountRegisterPanel.hidden = true;

  if (accountOpen) accountOpen.textContent = signedIn ? 'Account' : 'Login';
  if (accountOpenFooter) accountOpenFooter.textContent = signedIn ? 'Account' : 'Account Login';

  if (!signedIn) {
    switchAccountView('login');
    return;
  }

  if (accountWelcome) accountWelcome.textContent = `Welcome, ${user.name || 'Robotree User'}`;
  if (accountEmail) accountEmail.textContent = user.email || '';
  if (accountRoleBadge) accountRoleBadge.textContent = user.role || 'Student';
}

function setAccountStatus(message, isError = false) {
  showFeedback(accountStatus, message, isError);
}

function initAdminPanel() {
  const isAdminPage = typeof window !== 'undefined' && (
    window.location.pathname.includes('admin.html') ||
    window.location.pathname.endsWith('/admin') ||
    window.location.pathname.endsWith('/admin/')
  );

  // Auto-logout: If on any non-admin page, clear admin token immediately
  if (!isAdminPage && typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('robotree_admin_token');
  }

  if (isAdminPage) {
    if (getAdminToken()) {
      loadAdminDashboard();
    }

    // Auto-logout: Clear admin token when user clicks any link navigating away from admin panel
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href') || '';
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.includes('admin.html') && !href.endsWith('/admin')) {
          sessionStorage.removeItem('robotree_admin_token');
        }
      }
    });

    // Passcode visibility toggle
    const togglePasscodeBtn = document.getElementById('togglePasscodeBtn');
    const passcodeField = document.getElementById('adminPasscode');
    if (togglePasscodeBtn && passcodeField && !togglePasscodeBtn._bound) {
      togglePasscodeBtn._bound = true;
      togglePasscodeBtn.addEventListener('click', () => {
        const isPassword = passcodeField.type === 'password';
        passcodeField.type = isPassword ? 'text' : 'password';
        const eyeShow = togglePasscodeBtn.querySelector('.eye-show');
        const eyeHide = togglePasscodeBtn.querySelector('.eye-hide');
        if (eyeShow && eyeHide) {
          eyeShow.style.display = isPassword ? 'none' : 'block';
          eyeHide.style.display = isPassword ? 'block' : 'none';
        }
      });
    }
  }

  adminLoginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = adminLoginForm.querySelector("button[type='submit']");
    const passcode = String(new FormData(adminLoginForm).get('passcode') || '');

    if (RateLimiter.isRateLimited('admin_login', 5, 15 * 60000)) {
      return setAdminStatus('Too many attempts. Please wait before trying again.', true);
    }

    setButtonBusy(submitButton, true, 'Checking...');
    try {
      const result = await postJson('/api/admin/login', { passcode });
      sessionStorage.setItem('robotree_admin_token', result.token);
      setAdminStatus('Admin access granted.');
      adminLoginForm.reset();
      await loadAdminDashboard();
    } catch (error) {
      sessionStorage.removeItem('robotree_admin_token');
      setAdminStatus(error.message || 'Admin login failed.', true);
    } finally {
      setButtonBusy(submitButton, false);
      refreshIcons();
    }
  });

  document.addEventListener('click', async (event) => {
    const refreshBtn = event.target.closest('#adminRefresh, .admin-refresh-btn, [data-action="admin-refresh"]');
    if (refreshBtn) {
      event.preventDefault();
      setButtonBusy(refreshBtn, true, 'Refreshing...');
      try {
        await loadAdminDashboard();
        setAdminStatus('Dashboard data updated successfully.');
      } catch (err) {
        setAdminStatus(err.message || 'Failed to refresh data.', true);
      } finally {
        setButtonBusy(refreshBtn, false);
        refreshIcons();
      }
      return;
    }

    const logoutBtn = event.target.closest('#adminLogout, .admin-logout-btn, [data-action="admin-logout"]');
    if (logoutBtn) {
      event.preventDefault();
      const token = getAdminToken();
      sessionStorage.removeItem('robotree_admin_token');
      renderAdminLoggedOut();
      setAdminStatus('Signed out.');
      if (token) {
        try {
          await postJson('/api/admin/logout', {}, { Authorization: `Bearer ${token}` });
        } catch {
          // Local session already cleared
        }
      }
      return;
    }
  });
}

async function loadAdminDashboard() {
  const token = getAdminToken();
  const hasDashboard = document.querySelector('#adminDashboard, .admin-dashboard');
  if (!hasDashboard) return;

  if (!token) {
    renderAdminLoggedOut();
    return;
  }

  try {
    const data = await getJson('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    renderAdminDashboard(data);
    setAdminStatus('Admin activity loaded.');
  } catch (error) {
    sessionStorage.removeItem('robotree_admin_token');
    renderAdminLoggedOut();
    setAdminStatus(error.message || 'Please sign in again.', true);
  }
}

function renderAdminLoggedOut() {
  document.querySelectorAll('#adminDashboard, .admin-dashboard').forEach((el) => {
    el.hidden = true;
  });
  document.querySelectorAll('#adminLoginPanel, .admin-login-panel').forEach((el) => {
    el.hidden = false;
  });
}

function renderAdminDashboard(data) {
  document.querySelectorAll('#adminLoginPanel, .admin-login-panel').forEach((el) => {
    el.hidden = true;
  });
  document.querySelectorAll('#adminDashboard, .admin-dashboard').forEach((el) => {
    el.hidden = false;
  });

  const statItems = [
    ['Users', data.stats?.totalUsers || 0],
    ['Students', data.stats?.studentAccounts || 0],
    ['Employees', data.stats?.employeeAccounts || 0],
    ['Certificates', data.stats?.totalCertificates ?? (data.certificates?.length ?? 0)],
    ['Inquiries', data.stats?.totalInquiries || 0],
    ['Program Interest', data.stats?.totalProgramInterests || 0],
    ['Newsletter', data.stats?.totalNewsletterSubscribers || 0],
    ['Feedback', data.stats?.totalFeedback || 0]
  ];

  if (adminStats) {
    adminStats.innerHTML = statItems.map(([label, value]) => `
      <div class="admin-stat">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  if (adminFailedLogins) {
    const failed = (data.failedLogins || []).slice(0, 8);
    adminFailedLogins.innerHTML = failed.length ? failed.map(renderActivityItem).join('') : '<p class="empty-state">No failed login attempts recorded.</p>';
  }

  if (adminActivity) {
    const activities = (data.activities || []).filter((item) => !String(item.type).includes('FAILED')).slice(0, 12);
    adminActivity.innerHTML = activities.length ? activities.map(renderActivityItem).join('') : '<p class="empty-state">No activity recorded yet.</p>';
  }

  if (adminAccountActivity) {
    const accountActivity = (data.accountActivity || []).filter((item) => !String(item.type).includes('FAILED')).slice(0, 10);
    adminAccountActivity.innerHTML = accountActivity.length ? accountActivity.map(renderActivityItem).join('') : '<p class="empty-state">No account activity yet.</p>';
  }

  if (adminUsers) {
    const users = (data.users || []);
    adminUsers.innerHTML = users.length ? users.map(renderUserItem).join('') : '<p class="empty-state" style="grid-column: 1 / -1;">No user accounts created yet.</p>';
  }

  if (adminLeads) {
    const leads = [
      ...(data.inquiries || []).slice(0, 5).map((item) => ({ title: item.name, detail: item.interest, date: item.submittedAt })),
      ...(data.feedback || []).slice(0, 3).map((item) => ({ title: item.email, detail: 'Feedback received', date: item.submittedAt }))
    ].slice(0, 8);

    adminLeads.innerHTML = leads.length ? leads.map((item) => `
      <li>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.detail || 'Website activity')}</span>
        <time>${escapeHtml(formatDate(item.date))}</time>
      </li>
    `).join('') : '<p class="empty-state">No leads or feedback yet.</p>';
  }

  // Update Team Directory tab counter dynamically
  const teamTabBtn = document.querySelector('.admin-tab-btn[data-admin-tab="team"]');
  if (teamTabBtn) {
    const memberCount = (data.team || data.teamMembers || []).length;
    teamTabBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Team Directory (${memberCount})
    `;
  }

  // Initialize Admin Tabs & Subsystems
  initAdminTabs();
  initAdminUserManager(data);
  initAdminTeamManager(data);
  initAdminCourseManager(data);
  initAdminEventGallery(data);
  initAdminShowcaseGallery(data);
  initAdminInquiriesManager(data);
  initAdminCertificateManager(data);
  initAdminStoreManager(data);
  initAdminPasswordManager(data);
  initAdminSiteSettingsManager(data);

  refreshIcons();
}

/** Admin Navigation Tab Switcher */
function initAdminTabs() {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  const sections = {
    overview: document.getElementById('adminSectionOverview'),
    team: document.getElementById('adminSectionTeam'),
    courses: document.getElementById('adminSectionCourses'),
    gallery: document.getElementById('adminSectionGallery'),
    inquiries: document.getElementById('adminSectionInquiries'),
    certificates: document.getElementById('adminSectionCertificates'),
    store: document.getElementById('adminSectionStore'),
    security: document.getElementById('adminSectionSecurity'),
    settings: document.getElementById('adminSectionSettings')
  };

  tabs.forEach((tab) => {
    if (tab._bound) return;
    tab._bound = true;
    tab.addEventListener('click', () => {
      const target = tab.dataset.adminTab;
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      Object.entries(sections).forEach(([key, section]) => {
        if (section) {
          section.hidden = key !== target;
        }
      });
    });
  });
}

/** Admin Master Password Change Handler with Strict Admin Permission Guard */
function initAdminPasswordManager(dashboardData) {
  const form = document.getElementById('adminChangePasswordForm');
  if (!form) return;

  const statusBadge = document.getElementById('adminPermissionStatusBadge');
  const statusNotice = document.getElementById('adminPermissionStatusNotice');
  const toggleBtn = document.getElementById('btnToggleAdminPermissionLock');
  const toggleBtnText = document.getElementById('btnTogglePermissionText');
  const iconWrap = document.getElementById('adminPermissionIconWrap');
  const modalConfirm = document.getElementById('modalAdminPermissionConfirm');
  const btnApproveConfirm = document.getElementById('btnApproveAdminPermConfirm');
  const btnCancelConfirm = document.getElementById('btnCancelAdminPermConfirm');
  const btnCloseConfirm = document.getElementById('btnCloseAdminPermModal');
  const statusEl = document.getElementById('adminPasswordChangeStatus');

  let isPermissionLocked = Boolean(dashboardData?.settings?.adminPasswordPermissionLocked);

  function updatePermissionUI(locked) {
    isPermissionLocked = locked;
    if (statusBadge) {
      statusBadge.textContent = locked ? 'LOCKED / PROTECTED' : 'ACTIVE / UNLOCKED';
      statusBadge.style.background = locked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(120, 216, 68, 0.15)';
      statusBadge.style.color = locked ? '#ef4444' : 'var(--green)';
      statusBadge.style.borderColor = locked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(120, 216, 68, 0.35)';
    }
    if (iconWrap) {
      iconWrap.style.background = locked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(120, 216, 68, 0.15)';
      iconWrap.style.borderColor = locked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(120, 216, 68, 0.35)';
      iconWrap.style.color = locked ? '#ef4444' : 'var(--green)';
    }
    if (statusNotice) {
      statusNotice.textContent = locked
        ? 'Admin password modifications are currently LOCKED by the Administrator. Unlock permission first to proceed.'
        : 'Without verified permission of the administrator, changing the admin password is prohibited.';
      statusNotice.style.color = locked ? '#f87171' : 'var(--text-secondary)';
    }
    if (toggleBtnText) {
      toggleBtnText.textContent = locked ? 'Unlock Password Changes' : 'Lock Password Changes';
    }
  }

  updatePermissionUI(isPermissionLocked);

  // Fetch live permission status from server
  const token = getAdminToken();
  if (token) {
    getJson('/api/admin/permission-status', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res && typeof res.permissionLocked === 'boolean') {
          updatePermissionUI(res.permissionLocked);
        }
      })
      .catch(() => {});
  }

  // Handle Lock / Unlock Permission toggle button
  if (toggleBtn && !toggleBtn._bound) {
    toggleBtn._bound = true;
    toggleBtn.addEventListener('click', async () => {
      const activeToken = getAdminToken();
      if (!activeToken) {
        showAppStatus('Admin session expired. Please sign in again.');
        return;
      }
      let key = '';
      if (isPermissionLocked) {
        key = window.prompt('Enter Admin Permission / Authorization Key to UNLOCK password changes:');
        if (key === null) return;
        if (!key.trim()) {
          alert('Admin Permission Key is required to unlock.');
          return;
        }
      }
      try {
        setButtonBusy(toggleBtn, true);
        const res = await postJson(
          '/api/admin/toggle-permission-lock',
          { locked: !isPermissionLocked, adminPermissionKey: key ? key.trim() : undefined },
          { Authorization: `Bearer ${activeToken}` }
        );
        updatePermissionUI(res.permissionLocked);
        showAppStatus(res.message);
      } catch (err) {
        alert(err.message || 'Failed to update admin permission state.');
      } finally {
        setButtonBusy(toggleBtn, false);
        refreshIcons();
      }
    });
  }

  // Toggle visibility buttons on the password fields
  form.querySelectorAll('.password-toggle-btn').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', () => {
      const inputWrap = btn.closest('.admin-input-wrap');
      const input = inputWrap?.querySelector('input');
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      const eyeShow = btn.querySelector('.eye-show');
      const eyeHide = btn.querySelector('.eye-hide');
      if (eyeShow && eyeHide) {
        eyeShow.style.display = isPassword ? 'none' : 'block';
        eyeHide.style.display = isPassword ? 'block' : 'none';
      }
    });
  });

  // Modal close handlers
  function closePermissionModal() {
    if (modalConfirm) modalConfirm.hidden = true;
  }
  if (btnCancelConfirm && !btnCancelConfirm._bound) {
    btnCancelConfirm._bound = true;
    btnCancelConfirm.addEventListener('click', closePermissionModal);
  }
  if (btnCloseConfirm && !btnCloseConfirm._bound) {
    btnCloseConfirm._bound = true;
    btnCloseConfirm.addEventListener('click', closePermissionModal);
  }

  if (form._bound) return;
  form._bound = true;

  let pendingSubmission = null;

  async function executePasswordChange(submissionData) {
    const activeToken = getAdminToken();
    if (!activeToken) {
      if (statusEl) {
        statusEl.textContent = 'Admin session token missing or expired. Please sign in again.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonBusy(submitBtn, true, 'Updating Password...');
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'form-feedback';
    }

    try {
      const response = await postJson(
        '/api/admin/change-password',
        submissionData,
        { Authorization: `Bearer ${activeToken}` }
      );

      if (statusEl) {
        statusEl.textContent = response.message || 'Admin password updated successfully with verified admin permission!';
        statusEl.className = 'form-feedback is-success';
      }
      form.reset();

      // Reset eye toggles back to password mode
      form.querySelectorAll('input').forEach(inp => {
        inp.type = 'password';
      });
      form.querySelectorAll('.password-toggle-btn').forEach(btn => {
        const eyeShow = btn.querySelector('.eye-show');
        const eyeHide = btn.querySelector('.eye-hide');
        if (eyeShow && eyeHide) {
          eyeShow.style.display = 'block';
          eyeHide.style.display = 'none';
        }
      });

      showAppStatus('Admin password updated with verified admin permission. Please re-login with your new password.');

      // Sign out so admin re-authenticates with new password
      window.setTimeout(() => {
        sessionStorage.removeItem('robotree_admin_token');
        renderAdminLoggedOut();
        setAdminStatus('Admin password updated. Please authenticate with your new password.');
      }, 2200);
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || 'Failed to update admin password.';
        statusEl.className = 'form-feedback is-error';
      }
    } finally {
      setButtonBusy(submitBtn, false);
      refreshIcons();
    }
  }

  if (btnApproveConfirm && !btnApproveConfirm._bound) {
    btnApproveConfirm._bound = true;
    btnApproveConfirm.addEventListener('click', async () => {
      closePermissionModal();
      if (pendingSubmission) {
        const data = pendingSubmission;
        pendingSubmission = null;
        await executePasswordChange(data);
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const activeToken = getAdminToken();
    if (!activeToken) {
      if (statusEl) {
        statusEl.textContent = 'Admin session token missing or expired. Please sign in again.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    if (isPermissionLocked) {
      if (statusEl) {
        statusEl.textContent = 'Permission Denied: Admin password modifications are currently LOCKED by the Administrator. Unlock permission first to proceed.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    const formData = new FormData(form);
    const oldPassword = String(formData.get('oldPassword') || '').trim();
    const adminPermissionKey = String(formData.get('adminPermissionKey') || '').trim();
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');
    const permissionConfirmed = form.querySelector('#adminPermissionConfirmedCheck')?.checked;

    if (!oldPassword) {
      if (statusEl) {
        statusEl.textContent = 'Please enter your current/old admin password.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    if (!adminPermissionKey) {
      if (statusEl) {
        statusEl.textContent = 'Permission Denied: Admin Permission Key is required. You cannot change the password without permission of admin.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    if (!permissionConfirmed) {
      if (statusEl) {
        statusEl.textContent = 'Permission Denied: Please check the box confirming you have explicit permission from the Administrator.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    if (newPassword.length < 8) {
      if (statusEl) {
        statusEl.textContent = 'New password must be at least 8 characters long.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (statusEl) {
        statusEl.textContent = 'New password and confirmation password do not match.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    if (newPassword === oldPassword) {
      if (statusEl) {
        statusEl.textContent = 'New password must be different from your old password.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    pendingSubmission = {
      oldPassword,
      newPassword,
      confirmPassword,
      adminPermissionKey,
      adminPermissionConfirmed: true,
    };

    if (modalConfirm) {
      modalConfirm.hidden = false;
    } else {
      await executePasswordChange(pendingSubmission);
    }
  });
}

/** Admin Website Content, Hero Metric & Government Protocol Manager */
function initAdminSiteSettingsManager(data) {
  const form = document.getElementById('adminSiteSettingsForm');
  if (!form) return;

  const numInput = document.getElementById('settingHeroStatNumber');
  const labelInput = document.getElementById('settingHeroStatLabel');
  const protoInput = document.getElementById('settingGovernmentProtocol');
  const statusEl = document.getElementById('adminSiteSettingsStatus');
  const previewNum = document.getElementById('previewHeroStatNumber');
  const previewLabel = document.getElementById('previewHeroStatLabel');
  const resetBtn = document.getElementById('btnAdminResetSiteSettings');

  const raw = data?.settings || data?.data?.settings || {};
  let currentSettings = {
    heroStatNumber: raw.heroStatNumber || '20,000+',
    heroStatLabel: raw.heroStatLabel || 'Students Trained',
    governmentProtocol: raw.governmentProtocol || 'Robotree Robotics LLP • Operating in accordance with Government of India Protocols (GeM & MSME Accredited Entity)'
  };

  function populate(s) {
    if (numInput) numInput.value = s.heroStatNumber || '';
    if (labelInput) labelInput.value = s.heroStatLabel || '';
    if (protoInput) protoInput.value = s.governmentProtocol || '';
    if (previewNum) previewNum.textContent = s.heroStatNumber || '20,000+';
    if (previewLabel) previewLabel.textContent = s.heroStatLabel || 'Students Trained';
  }

  populate(currentSettings);

  // Live preview synchronization
  if (numInput && previewNum) {
    numInput.addEventListener('input', () => {
      previewNum.textContent = numInput.value.trim() || '20,000+';
    });
  }
  if (labelInput && previewLabel) {
    labelInput.addEventListener('input', () => {
      previewLabel.textContent = labelInput.value.trim() || 'Students Trained';
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      populate(currentSettings);
      if (statusEl) {
        statusEl.textContent = 'Fields reset to last saved values.';
        statusEl.className = 'form-feedback';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getAdminToken();
    const csrfToken = await getCsrfToken();
    const submitBtn = document.getElementById('btnAdminSaveSiteSettings');

    const heroStatNumber = numInput ? numInput.value.trim() : '';
    const heroStatLabel = labelInput ? labelInput.value.trim() : '';
    const governmentProtocol = protoInput ? protoInput.value.trim() : '';

    if (!heroStatNumber || !heroStatLabel) {
      if (statusEl) {
        statusEl.textContent = 'Please provide both metric number and label.';
        statusEl.className = 'form-feedback is-error';
      }
      return;
    }

    try {
      if (submitBtn) {
        setButtonBusy(submitBtn, true);
      }
      if (statusEl) {
        statusEl.textContent = 'Saving website content...';
        statusEl.className = 'form-feedback';
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ heroStatNumber, heroStatLabel, governmentProtocol })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to update website settings.');
      }

      currentSettings = resData.settings;
      populate(currentSettings);

      // Instantly reflect changes on homepage elements if present in DOM
      const liveHeroNum = document.getElementById('heroStatNumber');
      if (liveHeroNum) liveHeroNum.textContent = currentSettings.heroStatNumber;
      const liveHeroLabel = document.getElementById('heroStatLabel');
      if (liveHeroLabel) liveHeroLabel.textContent = currentSettings.heroStatLabel;
      const liveGridNum = document.getElementById('gridStatStudents');
      if (liveGridNum) liveGridNum.textContent = currentSettings.heroStatNumber;
      const liveGridLabel = document.getElementById('gridStatStudentsLabel');
      if (liveGridLabel) liveGridLabel.textContent = currentSettings.heroStatLabel;

      document.querySelectorAll('.footer-protocol-text').forEach((el) => {
        el.textContent = currentSettings.governmentProtocol;
      });

      if (statusEl) {
        statusEl.textContent = '✓ Website content and metrics saved successfully!';
        statusEl.className = 'form-feedback is-success';
      }
      showAppStatus('Website content updated successfully!');
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || 'Error updating settings.';
        statusEl.className = 'form-feedback is-error';
      }
    } finally {
      if (submitBtn) {
        setButtonBusy(submitBtn, false);
      }
      refreshIcons();
    }
  });
}

/** Admin User Accounts & Team Access Management Controller */
function initAdminUserManager(data) {
  const usersContainer = document.getElementById('adminUsers');
  const btnOpenDrawer = document.getElementById('btnOpenAddUserDrawer');
  const formDrawer = document.getElementById('userFormDrawer');
  const form = document.getElementById('adminAddUserForm');
  const btnCancel = document.getElementById('btnCancelAddUser');
  const feedback = document.getElementById('addUserFeedback');

  if (btnOpenDrawer && !btnOpenDrawer._bound) {
    btnOpenDrawer._bound = true;
    btnOpenDrawer.addEventListener('click', () => {
      if (!formDrawer) return;
      const isHidden = formDrawer.style.display === 'none' || !formDrawer.style.display;
      formDrawer.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        document.getElementById('newUserName')?.focus();
        formDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (btnCancel && !btnCancel._bound) {
    btnCancel._bound = true;
    btnCancel.addEventListener('click', () => {
      if (formDrawer) formDrawer.style.display = 'none';
      if (form) form.reset();
      if (feedback) feedback.textContent = '';
    });
  }

  if (form && !form._bound) {
    form._bound = true;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getAdminToken();
      if (!token) {
        showFeedback(feedback, 'Admin session expired. Please sign in again.', true);
        return;
      }

      const submitBtn = document.getElementById('btnSubmitAddUser') || form.querySelector('button[type="submit"]');
      const name = document.getElementById('newUserName')?.value.trim();
      const email = document.getElementById('newUserEmail')?.value.trim().toLowerCase();
      const password = document.getElementById('newUserPassword')?.value;
      const role = document.getElementById('newUserRole')?.value || 'EMPLOYEE';

      if (!name || !email || !password) {
        showFeedback(feedback, 'Name, email, and password are required.', true);
        return;
      }

      if (password.length < 8) {
        showFeedback(feedback, 'Password must be at least 8 characters long.', true);
        return;
      }

      if (submitBtn) setButtonBusy(submitBtn, true, 'Creating Account...');
      showFeedback(feedback, 'Creating user account...', false);

      try {
        const csrfToken = await getCsrfToken();
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({ name, email, password, role })
        });

        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) {
          throw new Error(result.message || 'Failed to create user account.');
        }

        showFeedback(feedback, result.message || 'User account created successfully!', false);
        form.reset();

        setTimeout(() => {
          if (formDrawer) formDrawer.style.display = 'none';
          if (feedback) feedback.textContent = '';
        }, 1200);

        await loadAdminDashboard();
      } catch (err) {
        showFeedback(feedback, err.message, true);
      } finally {
        if (submitBtn) setButtonBusy(submitBtn, false);
      }
    });
  }

  if (usersContainer && !usersContainer._bound) {
    usersContainer._bound = true;

    // Delegate Toggle Role & Delete User clicks
    usersContainer.addEventListener('click', async (e) => {
      const toggleBtn = e.target.closest('[data-toggle-role]');
      if (toggleBtn) {
        e.preventDefault();
        const userId = toggleBtn.dataset.toggleRole;
        const targetRole = toggleBtn.dataset.targetRole || 'EMPLOYEE';
        const roleLabel = targetRole === 'EMPLOYEE' ? 'Team Member / Employee' : 'Student';

        if (!confirm(`Are you sure you want to change this user access to ${roleLabel}?`)) return;

        const token = getAdminToken();
        if (!token) return setAdminStatus('Admin session expired. Please sign in.', true);

        setButtonBusy(toggleBtn, true, 'Updating...');
        try {
          const csrfToken = await getCsrfToken();
          const res = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ role: targetRole })
          });
          const result = await readJsonResponse(res);
          if (!res.ok || !result.success) throw new Error(result.message || 'Failed to update access role.');
          setAdminStatus(result.message || `Access updated to ${roleLabel}.`);
          await loadAdminDashboard();
        } catch (err) {
          setAdminStatus(err.message, true);
        } finally {
          setButtonBusy(toggleBtn, false);
        }
        return;
      }

      const deleteBtn = e.target.closest('[data-delete-user]');
      if (deleteBtn) {
        e.preventDefault();
        const userId = deleteBtn.dataset.deleteUser;
        const userEmail = deleteBtn.dataset.userEmail || 'this user';

        if (!confirm(`Are you sure you want to permanently remove and delete access for "${userEmail}"?\nThis user will no longer be able to log in.`)) return;

        const token = getAdminToken();
        if (!token) return setAdminStatus('Admin session expired. Please sign in.', true);

        setButtonBusy(deleteBtn, true, 'Removing...');
        try {
          const csrfToken = await getCsrfToken();
          const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': csrfToken
            }
          });
          const result = await readJsonResponse(res);
          if (!res.ok || !result.success) throw new Error(result.message || 'Failed to remove user account.');
          setAdminStatus(result.message || 'User account removed successfully.');
          await loadAdminDashboard();
        } catch (err) {
          setAdminStatus(err.message, true);
        } finally {
          setButtonBusy(deleteBtn, false);
        }
        return;
      }
    });
  }
}

/** Reusable Single Photo Preview with Delete / Remove button for Admin forms */
function renderSinglePhotoPreview(previewEl, imageUrl, onRemove) {
  if (!previewEl) return;
  if (!imageUrl) {
    previewEl.innerHTML = '';
    previewEl.style.display = 'none';
    return;
  }

  previewEl.style.display = 'block';
  previewEl.innerHTML = `
    <div class="admin-preview-wrapper">
      <div class="admin-preview-img-container">
        <img src="${escapeHtml(imageUrl)}" alt="Photo Preview">
      </div>
      <div class="admin-preview-meta-row">
        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px; color:var(--green, #00a859);"><polyline points="20 6 9 17 4 12"/></svg> Photo Attached</span>
        <button type="button" class="admin-preview-delete-btn" title="Delete / Remove this photo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          Delete Photo
        </button>
      </div>
    </div>
  `;

  const delBtn = previewEl.querySelector('.admin-preview-delete-btn');
  if (delBtn) {
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onRemove === 'function') onRemove();
    });
  }
}

/** Admin Team Directory Management Controller */
function initAdminTeamManager(data) {
  const teamGrid = document.getElementById('adminTeamGrid');
  const btnOpenModal = document.getElementById('btnOpenTeamModal');
  const formDrawer = document.getElementById('teamFormDrawer');
  const formTitle = document.getElementById('teamFormTitle');
  const teamForm = document.getElementById('adminTeamForm');
  const editIdInput = document.getElementById('teamEditId');
  const btnCancel = document.getElementById('btnCancelTeamForm');
  const dropzone = document.getElementById('teamDropzone');
  const fileInput = document.getElementById('teamFileInput');
  const imageUrlInput = document.getElementById('teamImageUrl');
  const previewBox = document.getElementById('teamPreviewBox');
  const feedback = document.getElementById('teamFormFeedback');

  if (!teamGrid) return;

  const members = data?.team || data?.teamMembers || [];

  function renderTeamPhotoPreview() {
    const val = imageUrlInput ? imageUrlInput.value.trim() : '';
    renderSinglePhotoPreview(previewBox, val, () => {
      if (imageUrlInput) imageUrlInput.value = '';
      if (fileInput) fileInput.value = '';
      renderTeamPhotoPreview();
    });
  }

  function renderTeam(list) {
    if (!list || !list.length) {
      teamGrid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">No team members registered yet.</p>';
      return;
    }

    teamGrid.innerHTML = list.map((m) => `
      <div class="admin-data-card" id="admin-member-${escapeHtml(m.id)}">
        <div class="admin-card-header">
          <img class="admin-card-avatar" src="${escapeHtml(m.image || 'assets/team/placeholder.jpg')}" alt="${escapeHtml(m.name)}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\' fill=\\'%2378d844\\' viewBox=\\'0 0 24 24\\'><circle cx=\\'12\\' cy=\\'8\\' r=\\'5\\'/><path d=\\'M20 21a8 8 0 1 0-16 0\\'/></svg>'">
          <div class="admin-card-title-group">
            <h4>${escapeHtml(m.name)}</h4>
            <p>${escapeHtml(m.role)}</p>
          </div>
        </div>
        <div class="admin-card-body">
          <p><strong>Dept:</strong> ${escapeHtml(m.department || 'Training & Curriculum')}</p>
          <p><strong>Email:</strong> ${escapeHtml(m.email || 'N/A')}</p>
          <p><strong>Exp / Qual:</strong> ${escapeHtml(m.experience || '1+ Year')} • ${escapeHtml(m.qualification || 'B.TECH')}</p>
        </div>
        <div class="admin-card-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-edit-member="${escapeHtml(m.id)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button type="button" class="btn btn-danger btn-sm" data-delete-member="${escapeHtml(m.id)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
        </div>
      </div>
    `).join('');

    teamGrid.querySelectorAll('[data-edit-member]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.editMember;
        const item = members.find((m) => String(m.id || '') === String(id || '')) ||
                     members.find((m) => m.name && btn.closest('.admin-data-card')?.querySelector('h4')?.textContent?.trim() === m.name.trim());
        if (item) {
          openEditForm(item);
        } else {
          console.warn('Team member not found for edit:', id);
        }
      });
    });

    teamGrid.querySelectorAll('[data-delete-member]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.deleteMember;
        const item = members.find((m) => String(m.id) === String(id));
        if (!confirm(`Are you sure you want to remove ${item?.name || 'this team member'}?`)) return;
        await deleteTeamMember(id);
      });
    });

    if (!teamGrid._delegated) {
      teamGrid._delegated = true;
      teamGrid.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('[data-edit-member]');
        if (editBtn) {
          e.preventDefault();
          const id = editBtn.dataset.editMember;
          const item = members.find((m) => String(m.id || '') === String(id || '')) ||
                       members.find((m) => m.name && editBtn.closest('.admin-data-card')?.querySelector('h4')?.textContent?.trim() === m.name.trim());
          if (item) openEditForm(item);
          return;
        }

        const deleteBtn = e.target.closest('[data-delete-member]');
        if (deleteBtn) {
          e.preventDefault();
          const id = deleteBtn.dataset.deleteMember;
          const item = members.find((m) => String(m.id) === String(id));
          if (!confirm(`Are you sure you want to remove ${item?.name || 'this team member'}?`)) return;
          await deleteTeamMember(id);
        }
      });
    }
  }

  function openEditForm(item) {
    if (!formDrawer) return;
    formDrawer.style.display = 'block';
    if (formTitle) formTitle.textContent = item ? `Edit Team Member: ${item.name}` : 'Add New Team Member';
    if (editIdInput) editIdInput.value = item ? item.id : '';
    const nameEl = document.getElementById('teamName');
    if (nameEl) nameEl.value = item ? (item.name || '') : '';
    const roleEl = document.getElementById('teamRole');
    if (roleEl) roleEl.value = item ? (item.role || '') : '';
    const deptEl = document.getElementById('teamDepartment');
    if (deptEl) deptEl.value = item ? (item.department || 'Training & Curriculum') : 'Training & Curriculum';
    const catEl = document.getElementById('teamCategory');
    if (catEl) catEl.value = item ? (item.category || 'assistant-trainers') : 'assistant-trainers';
    const qualEl = document.getElementById('teamQualification');
    if (qualEl) qualEl.value = item ? (item.qualification || 'B.TECH') : 'B.TECH';
    const expEl = document.getElementById('teamExperience');
    if (expEl) expEl.value = item ? (item.experience || '1+ Year') : '1+ Year';
    const emailEl = document.getElementById('teamEmail');
    if (emailEl) emailEl.value = item ? (item.email || '') : '';
    if (imageUrlInput) imageUrlInput.value = item ? (item.image || '') : '';
    const skillsEl = document.getElementById('teamSkills');
    if (skillsEl) skillsEl.value = item && item.skills ? (Array.isArray(item.skills) ? item.skills.join(', ') : String(item.skills)) : '';
    const respEl = document.getElementById('teamResponsibilities');
    if (respEl) respEl.value = item ? (item.responsibilities || '') : '';

    renderTeamPhotoPreview();
    formDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (btnOpenModal && !btnOpenModal._bound) {
    btnOpenModal._bound = true;
    btnOpenModal.addEventListener('click', () => {
      teamForm?.reset();
      openEditForm(null);
    });
  }

  if (btnCancel && !btnCancel._bound) {
    btnCancel._bound = true;
    btnCancel.addEventListener('click', () => {
      formDrawer.style.display = 'none';
      teamForm?.reset();
      renderTeamPhotoPreview();
      if (feedback) feedback.textContent = '';
    });
  }

  // Drag & drop and file input for avatar
  if (dropzone && !dropzone._bound) {
    dropzone._bound = true;
    dropzone.addEventListener('click', () => fileInput?.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput && !fileInput._bound) {
    fileInput._bound = true;
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
      }
    });
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imageUrlInput.value = e.target.result;
      renderTeamPhotoPreview();
    };
    reader.readAsDataURL(file);
  }

  if (imageUrlInput && !imageUrlInput._bound) {
    imageUrlInput._bound = true;
    imageUrlInput.addEventListener('input', () => {
      renderTeamPhotoPreview();
    });
  }

  if (teamForm && !teamForm._bound) {
    teamForm._bound = true;
    teamForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getAdminToken();
      if (!token) return showFeedback(feedback, 'Admin session expired. Please sign in.', true);

      const id = editIdInput.value;
      const isEdit = Boolean(id);
      const submitBtn = document.getElementById('btnSaveTeam');
      if (submitBtn) setButtonBusy(submitBtn, true);

      const payload = {
        name: document.getElementById('teamName').value.trim(),
        role: document.getElementById('teamRole').value.trim(),
        department: document.getElementById('teamDepartment').value.trim(),
        category: document.getElementById('teamCategory').value,
        qualification: document.getElementById('teamQualification').value.trim(),
        experience: document.getElementById('teamExperience').value.trim(),
        email: document.getElementById('teamEmail').value.trim(),
        image: imageUrlInput.value.trim() || undefined,
        responsibilities: document.getElementById('teamResponsibilities').value.trim(),
        skills: document.getElementById('teamSkills').value.split(',').map((s) => s.trim()).filter(Boolean)
      };

      try {
        const csrfToken = await getCsrfToken();
        const url = isEdit ? `/api/admin/team/${id}` : '/api/admin/team';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify(payload)
        });

        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) throw new Error(result.message || 'Failed to save team member.');

        showFeedback(feedback, result.message || 'Team member saved successfully!', false);
        setTimeout(() => {
          formDrawer.style.display = 'none';
          teamForm.reset();
          if (feedback) feedback.textContent = '';
        }, 1000);

        await loadAdminDashboard();
      } catch (err) {
        showFeedback(feedback, err.message, true);
      } finally {
        if (submitBtn) setButtonBusy(submitBtn, false);
      }
    });
  }

  async function deleteTeamMember(id) {
    const token = getAdminToken();
    if (!token) return;
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'X-CSRF-Token': csrfToken }
      });
      const result = await readJsonResponse(res);
      if (!res.ok || !result.success) throw new Error(result.message || 'Failed to remove team member.');
      setAdminStatus('Team member removed successfully.');
      await loadAdminDashboard();
    } catch (err) {
      setAdminStatus(err.message, true);
    }
  }

  renderTeam(members);
}

/** Admin Course Catalog Management Controller */
function initAdminCourseManager(data) {
  const coursesGrid = document.getElementById('adminCoursesGrid');
  const btnOpenModal = document.getElementById('btnOpenCourseModal');
  const formDrawer = document.getElementById('courseFormDrawer');
  const formTitle = document.getElementById('courseFormTitle');
  const courseForm = document.getElementById('adminCourseForm');
  const editIdInput = document.getElementById('courseEditId');
  const btnCancel = document.getElementById('btnCancelCourseForm');
  const dropzone = document.getElementById('courseDropzone');
  const fileInput = document.getElementById('courseFileInput');
  const imageUrlInput = document.getElementById('courseImageUrl');
  const previewBox = document.getElementById('coursePreviewBox');
  const feedback = document.getElementById('courseFormFeedback');

  if (!coursesGrid) return;

  const courses = data?.courses || [];

  function renderCourses(list) {
    if (!list || !list.length) {
      coursesGrid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">No courses available in catalog.</p>';
      return;
    }

    coursesGrid.innerHTML = list.map((c) => {
      const imgSrc = c.image ? (c.image.startsWith('http') || c.image.startsWith('data:') || c.image.startsWith('/') ? c.image : '/' + c.image) : '/assets/courses/course_basic_robotics.jpg';
      return `
      <div class="admin-data-card" id="admin-course-${escapeHtml(c.id)}">
        <div class="admin-card-header">
          <img class="admin-card-avatar" style="border-radius: 8px;" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(c.title)}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\' fill=\\'%230c1e2e\\' viewBox=\\'0 0 48 48\\'><rect width=\\'48\\' height=\\'48\\' rx=\\'8\\' fill=\\'%230c1e2e\\'/><circle cx=\\'24\\' cy=\\'24\\' r=\\'12\\' stroke=\\'%2378d844\\' stroke-width=\\'2\\' fill=\\'none\\'/><path d=\\'M24 16v8l5 3\\' stroke=\\'%2378d844\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\'/></svg>'">
          <div class="admin-card-title-group">
            <h4>${escapeHtml(c.title)}</h4>
            <p>${escapeHtml(c.category)}</p>
          </div>
        </div>
        <div class="admin-card-meta">
          <div><strong>Price:</strong> <span class="admin-card-badge" style="font-size: 0.82rem;">₹${Number(c.price || 0).toLocaleString('en-IN')}</span> • <strong>Duration:</strong> ${escapeHtml(c.duration || '6 Weeks')}</div>
          <div><strong>Level:</strong> <span class="admin-card-badge badge-purple">${escapeHtml(c.level || 'Intermediate')}</span></div>
          <div style="margin-top: 4px; font-size: 0.76rem;">${escapeHtml(c.description || '')}</div>
        </div>
        <div class="admin-card-actions">
          <button type="button" class="admin-btn-action admin-btn-edit" data-edit-course="${escapeHtml(c.id)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button type="button" class="admin-btn-action admin-btn-delete" data-delete-course="${escapeHtml(c.id)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
        </div>
      </div>
      `;
    }).join('');

    coursesGrid.querySelectorAll('[data-edit-course]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.editCourse;
        const item = courses.find((c) => String(c.id) === String(id));
        if (item) openEditForm(item);
      });
    });

    coursesGrid.querySelectorAll('[data-delete-course]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.deleteCourse;
        const item = courses.find((c) => String(c.id) === String(id));
        if (!confirm(`Are you sure you want to delete course: "${item?.title || id}"?`)) return;
        await deleteCourse(id);
      });
    });

    if (!coursesGrid._delegated) {
      coursesGrid._delegated = true;
      coursesGrid.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('[data-edit-course]');
        if (editBtn) {
          e.preventDefault();
          const id = editBtn.dataset.editCourse;
          const item = courses.find((c) => String(c.id) === String(id));
          if (item) openEditForm(item);
          return;
        }

        const deleteBtn = e.target.closest('[data-delete-course]');
        if (deleteBtn) {
          e.preventDefault();
          const id = deleteBtn.dataset.deleteCourse;
          const item = courses.find((c) => String(c.id) === String(id));
          if (!confirm(`Are you sure you want to delete course: "${item?.title || id}"?`)) return;
          await deleteCourse(id);
        }
      });
    }
  }

  function openEditForm(item) {
    if (!formDrawer) return;
    formDrawer.style.display = 'block';
    if (formTitle) formTitle.textContent = item ? `Edit Course Track: ${item.title}` : 'Add New Course Track';
    if (editIdInput) editIdInput.value = item ? item.id : '';
    const titleEl = document.getElementById('courseTitle');
    if (titleEl) titleEl.value = item ? (item.title || '') : '';
    const catEl = document.getElementById('courseCategory');
    if (catEl) catEl.value = item ? (item.category || 'Robotics & AI') : 'Robotics & AI';
    const priceEl = document.getElementById('coursePrice');
    if (priceEl) priceEl.value = item ? (item.price ?? 2999) : 2999;
    const durEl = document.getElementById('courseDuration');
    if (durEl) durEl.value = item ? (item.duration || '6 Weeks') : '6 Weeks';
    const lvlEl = document.getElementById('courseLevel');
    if (lvlEl) lvlEl.value = item ? (item.level || 'Intermediate') : 'Intermediate';
    if (imageUrlInput) imageUrlInput.value = item ? (item.image || '') : '';
    const descEl = document.getElementById('courseDescription');
    if (descEl) descEl.value = item ? (item.description || '') : '';
    const modEl = document.getElementById('courseModules');
    if (modEl) modEl.value = item && item.modules ? (Array.isArray(item.modules) ? item.modules.join('\n') : String(item.modules)) : '';

    renderCoursePhotoPreview();
    formDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderCoursePhotoPreview() {
    const val = imageUrlInput ? imageUrlInput.value.trim() : '';
    renderSinglePhotoPreview(previewBox, val, () => {
      if (imageUrlInput) imageUrlInput.value = '';
      if (fileInput) fileInput.value = '';
      renderCoursePhotoPreview();
    });
  }

  if (btnOpenModal && !btnOpenModal._bound) {
    btnOpenModal._bound = true;
    btnOpenModal.addEventListener('click', () => {
      courseForm?.reset();
      openEditForm(null);
    });
  }

  if (btnCancel && !btnCancel._bound) {
    btnCancel._bound = true;
    btnCancel.addEventListener('click', () => {
      formDrawer.style.display = 'none';
      courseForm?.reset();
      renderCoursePhotoPreview();
      if (feedback) feedback.textContent = '';
    });
  }

  // Course Drag & drop and file input
  if (dropzone && !dropzone._bound) {
    dropzone._bound = true;
    dropzone.addEventListener('click', () => fileInput?.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput && !fileInput._bound) {
    fileInput._bound = true;
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
      }
    });
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imageUrlInput.value = e.target.result;
      renderCoursePhotoPreview();
    };
    reader.readAsDataURL(file);
  }

  if (imageUrlInput && !imageUrlInput._bound) {
    imageUrlInput._bound = true;
    imageUrlInput.addEventListener('input', () => {
      renderCoursePhotoPreview();
    });
  }

  if (courseForm && !courseForm._bound) {
    courseForm._bound = true;
    courseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getAdminToken();
      if (!token) return showFeedback(feedback, 'Admin session expired. Please sign in.', true);

      const id = editIdInput.value;
      const isEdit = Boolean(id);
      const submitBtn = document.getElementById('btnSaveCourse');
      if (submitBtn) setButtonBusy(submitBtn, true);

      const title = document.getElementById('courseTitle').value.trim();
      const generatedId = isEdit ? id : (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `course-${Date.now()}`);

      const payload = {
        id: generatedId,
        title,
        category: document.getElementById('courseCategory').value.trim(),
        price: Number(document.getElementById('coursePrice').value),
        duration: document.getElementById('courseDuration').value.trim(),
        level: document.getElementById('courseLevel').value,
        image: imageUrlInput.value.trim() || undefined,
        description: document.getElementById('courseDescription').value.trim(),
        modules: document.getElementById('courseModules').value.split('\n').map((m) => m.trim()).filter(Boolean)
      };

      try {
        const csrfToken = await getCsrfToken();
        const url = isEdit ? `/api/admin/courses/${id}` : '/api/admin/courses';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify(payload)
        });

        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) throw new Error(result.message || 'Failed to save course.');

        showFeedback(feedback, result.message || 'Course saved successfully!', false);
        setTimeout(() => {
          formDrawer.style.display = 'none';
          courseForm.reset();
          if (previewBox) previewBox.style.display = 'none';
          if (feedback) feedback.textContent = '';
        }, 1000);

        await loadAdminDashboard();
      } catch (err) {
        showFeedback(feedback, err.message, true);
      } finally {
        if (submitBtn) setButtonBusy(submitBtn, false);
      }
    });
  }

  async function deleteCourse(id) {
    const token = getAdminToken();
    if (!token) return;
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'X-CSRF-Token': csrfToken }
      });
      const result = await readJsonResponse(res);
      if (!res.ok || !result.success) throw new Error(result.message || 'Failed to delete course.');
      setAdminStatus('Course deleted successfully.');
      await loadAdminDashboard();
    } catch (err) {
      setAdminStatus(err.message, true);
    }
  }

  renderCourses(courses);
}

/** Admin Leads & Inquiries Manager Controller */
function initAdminInquiriesManager(data) {
  const tableWrap = document.getElementById('adminInquiriesTableWrap');
  if (!tableWrap) return;

  const inquiries = data?.inquiries || [];
  const productsList = data?.products || [];
  const ordersList = data?.orders || [];

  function resolveInquiryProduct(inq) {
    if (inq.productImage && inq.productTitle) {
      return {
        image: inq.productImage,
        title: inq.productTitle,
        orderId: inq.orderId || (inq.id && inq.id.replace(/^INQ-/, '')) || '',
        quantity: inq.items?.[0]?.quantity || 1,
        price: inq.totalAmount ? `₹${Number(inq.totalAmount).toLocaleString()}` : ''
      };
    }
    const cleanId = String(inq.id || '').replace(/^INQ-/, '');
    const ord = ordersList.find((o) => o.id === cleanId || inq.id.includes(o.id) || (inq.message && inq.message.includes(o.id)) || (inq.subject && inq.subject.includes(o.id)));
    if (ord && ord.items && ord.items.length) {
      const item = ord.items[0];
      const prod = productsList.find((p) => p.id === item.productId || (p.title && item.title && p.title.toLowerCase() === item.title.toLowerCase()));
      return {
        image: prod?.image || item.image || 'assets/store/kit_4wd_robot.jpg',
        title: item.title || prod?.title || 'Robotics Hardware Product',
        orderId: ord.id,
        quantity: item.quantity || 1,
        price: ord.totalAmount ? `₹${Number(ord.totalAmount).toLocaleString()}` : ''
      };
    }
    if (inq.message) {
      const m = inq.message.match(/Order (ORD-[^:]+):\s*([^(\n]+?)(?:\s*\(x(\d+)\))?(?:\.\s*Total:\s*(?:Rs\.|₹)?\s*(\d+))?/i);
      if (m) {
        const ordId = m[1];
        const title = m[2].trim();
        const qty = m[3] || '1';
        const price = m[4] ? `₹${Number(m[4]).toLocaleString()}` : '';
        const prod = productsList.find((p) => p.title && (p.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(p.title.toLowerCase())));
        return {
          image: prod?.image || 'assets/store/kit_4wd_robot.jpg',
          title: prod?.title || title,
          orderId: ordId,
          quantity: qty,
          price
        };
      }
    }
    return null;
  }

  if (!inquiries.length) {
    tableWrap.innerHTML = '<p class="empty-state" style="padding: 2rem;">No student or institutional inquiries received yet.</p>';
    return;
  }

  tableWrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Lead Name</th>
          <th>Contact Info</th>
          <th>Procurement Item / Program</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${inquiries.map((inq) => {
          const prodInfo = resolveInquiryProduct(inq);
          const isStore = Boolean(prodInfo) || inq.interest === 'Hardware Store Procurement' || String(inq.id || '').startsWith('INQ-ORD-');
          return `
          <tr id="admin-inq-${escapeHtml(inq.id)}">
            <td><time>${escapeHtml(formatDate(inq.submittedAt || inq.createdAt))}</time></td>
            <td><strong>${escapeHtml(inq.name || 'Anonymous')}</strong></td>
            <td>
              <div>${escapeHtml(inq.email || '')}</div>
              ${inq.phone ? `<small style="color: var(--text-secondary);">${escapeHtml(inq.phone)}</small>` : ''}
            </td>
            <td>
              ${isStore ? `
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="${escapeHtml(prodInfo?.image || 'assets/store/kit_4wd_robot.jpg')}" alt="${escapeHtml(prodInfo?.title || 'Product Photo')}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid var(--line); background: rgba(255,255,255,0.05); flex-shrink: 0;" onerror="this.src='assets/store/kit_4wd_robot.jpg'">
                  <div>
                    <strong style="color: var(--text); font-size: 0.88rem; display: block; line-height: 1.35;">${escapeHtml(prodInfo?.title || inq.interest || 'Hardware Product')}</strong>
                    <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 3px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      ${prodInfo?.orderId ? `<span style="font-family: monospace; color: var(--green); font-weight: 700;">${escapeHtml(prodInfo.orderId)}</span>` : ''}
                      ${prodInfo?.quantity ? `<span class="badge" style="background: rgba(255,255,255,0.08); font-size: 0.72rem; padding: 1px 6px;">Qty: ${escapeHtml(String(prodInfo.quantity))}</span>` : ''}
                      ${prodInfo?.price ? `<span style="color: var(--green); font-weight: 700;">${escapeHtml(prodInfo.price)}</span>` : ''}
                    </div>
                    <span class="meta-pill" style="font-size: 0.7rem; padding: 1px 6px; margin-top: 4px; display: inline-block;">Hardware Store Procurement</span>
                  </div>
                </div>
              ` : `
                <div><strong>${escapeHtml(inq.interest || 'General')}</strong></div>
                ${inq.message ? `<small style="color: var(--text-secondary); display: block; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(inq.message)}</small>` : ''}
              `}
            </td>
            <td>
              <select class="form-select status-select" data-inq-id="${escapeHtml(inq.id)}" style="padding: 4px 8px; font-size: 0.78rem;">
                <option value="New" ${inq.status === 'New' || !inq.status ? 'selected' : ''}>🔵 New</option>
                <option value="Contacted" ${inq.status === 'Contacted' ? 'selected' : ''}>🟡 Contacted</option>
                <option value="Enrolled" ${inq.status === 'Enrolled' ? 'selected' : ''}>🟢 Enrolled</option>
                <option value="Closed" ${inq.status === 'Closed' ? 'selected' : ''}>⚪ Closed</option>
              </select>
            </td>
            <td>
              <button type="button" class="admin-btn-action admin-btn-delete" data-delete-inquiry="${escapeHtml(inq.id)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
              </button>
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  // Status Change Listener
  tableWrap.querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.dataset.inqId;
      const status = sel.value;
      const token = getAdminToken();
      if (!token) return;

      try {
        const csrfToken = await getCsrfToken();
        const res = await fetch(`/api/admin/inquiries/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({ status })
        });
        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) throw new Error(result.message || 'Failed to update status.');
        setAdminStatus(`Inquiry status updated to ${status}.`);
      } catch (err) {
        setAdminStatus(err.message, true);
      }
    });
  });

  // Delete Inquiry Listener
  tableWrap.querySelectorAll('[data-delete-inquiry]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteInquiry;
      if (!confirm('Are you sure you want to delete this inquiry lead?')) return;
      const token = getAdminToken();
      if (!token) return;

      setButtonBusy(btn, true, 'Deleting...');
      try {
        const csrfToken = await getCsrfToken();
        const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          }
        });
        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) throw new Error(result.message || 'Failed to delete inquiry.');
        setAdminStatus('Inquiry record deleted successfully.');
        const row = document.getElementById(`admin-inq-${id}`);
        if (row) row.remove();
        await loadAdminDashboard();
      } catch (err) {
        setAdminStatus(err.message, true);
      } finally {
        setButtonBusy(btn, false);
      }
    });
  });
}

/** Admin Certificate Management Controller (Issue & Revoke) */
function initAdminCertificateManager(data) {
  const tableWrap = document.getElementById('adminCertsTableWrap');
  const btnOpenModal = document.getElementById('btnOpenCertModal');
  const formDrawer = document.getElementById('certFormDrawer');
  const certForm = document.getElementById('adminCertIssueForm');
  const btnCancel = document.getElementById('btnCancelCertForm');
  const feedback = document.getElementById('certFormFeedback');

  if (!tableWrap) return;

  const certs = data?.certificates || data?.certs || data?.data?.certificates || [];

  function renderCerts(list) {
    if (!list.length) {
      tableWrap.innerHTML = '<p class="empty-state" style="padding: 2rem;">No accredited certificates issued yet. Click "Issue Certificate" to upload or generate one.</p>';
      return;
    }

    tableWrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Certificate Number</th>
            <th>Enrollment No.</th>
            <th>Candidate Name</th>
            <th>Course / Track</th>
            <th>Issue Date</th>
            <th>Grade</th>
            <th>Document Format</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((c) => {
            const isRevoked = String(c.status).toUpperCase() === 'REVOKED';
            const certId = escapeHtml(c.code || c.id || c.certificateNumber);
            const enrNo = escapeHtml(c.enrollmentNo || c.enrollmentNumber || '—');
            const hasUpload = Boolean(c.certificateFile);
            return `
            <tr id="admin-cert-${certId}">
              <td><span class="admin-card-badge" style="font-family: monospace; font-weight: 700;">${certId}</span></td>
              <td><span class="admin-card-badge" style="font-family: monospace; font-weight: 700; color: var(--green); background: rgba(0, 168, 89, 0.1); border: 1px solid rgba(0, 168, 89, 0.25);">${enrNo}</span></td>
              <td>
                <strong>${escapeHtml(c.studentName || c.candidateName || 'Student')}</strong>
                ${c.studentEmail ? `<div style="font-size: 0.78rem; color: var(--text-secondary); opacity: 0.85;">${escapeHtml(c.studentEmail)}</div>` : ''}
              </td>
              <td>${escapeHtml(c.courseName || c.courseTitle || c.course || 'Robotics Course')}</td>
              <td><time>${escapeHtml(c.issueDate || formatDate(c.createdAt))}</time></td>
              <td><span class="status-pill status-enrolled">${escapeHtml(c.grade || 'A+')}</span></td>
              <td>
                ${hasUpload 
                  ? `<a href="/api/certificates/download/${encodeURIComponent(certId)}?view=inline" target="_blank" class="status-pill" style="background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="${escapeHtml(c.fileOriginalName || 'Uploaded PDF document')}">📄 PDF Document ↗</a>`
                  : `<a href="/api/certificates/download/${encodeURIComponent(certId)}?view=inline" target="_blank" class="status-pill" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">⚡ Vector PDF ↗</a>`
                }
              </td>
              <td>
                ${isRevoked 
                  ? `<span class="status-pill" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 700;">🔴 REVOKED</span>`
                  : `<span class="status-pill" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); font-weight: 700;">🟢 ISSUED</span>`
                }
              </td>
              <td>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <a class="admin-btn-action admin-btn-edit" href="/certificate.html?enrollment=${encodeURIComponent(c.enrollmentNo || certId)}" target="_blank" rel="noopener" title="Verify certificate on public portal">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Verify
                  </a>
                  ${!isRevoked ? `
                  <a class="admin-btn-action admin-btn-edit" href="/api/certificates/download/${encodeURIComponent(certId)}?view=inline" target="_blank" rel="noopener" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3);" title="View or Download official certificate PDF">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    PDF
                  </a>` : ''}
                  <button type="button" class="admin-btn-action" data-copy-cert-link="${certId}" data-enr-link="${enrNo !== '—' ? enrNo : certId}" style="background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3);" title="Copy student verification link to clipboard">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Share
                  </button>
                  ${!isRevoked ? `
                  <button type="button" class="admin-btn-action admin-btn-delete" data-revoke-cert="${certId}" title="Revoke this certificate">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    Revoke
                  </button>` : `
                  <button type="button" class="admin-btn-action" data-reinstate-cert="${certId}" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);" title="Reinstate this certificate to active status">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Reinstate
                  </button>`}
                  <button type="button" class="admin-btn-action admin-btn-delete" data-delete-cert="${certId}" style="opacity: 0.8;" title="Permanently delete from database">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Wire up Copy Link button
    tableWrap.querySelectorAll('[data-copy-cert-link]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.copyCertLink;
        const enr = btn.dataset.enrLink || id;
        const origin = window.location.origin || `${window.location.protocol}//${window.location.host}`;
        const url = `${origin}/certificate.html?enrollment=${encodeURIComponent(enr)}`;
        navigator.clipboard.writeText(url).then(() => {
          const origText = btn.innerHTML;
          btn.innerHTML = '✓ Copied!';
          setTimeout(() => { btn.innerHTML = origText; }, 2000);
          setAdminStatus(`Verification link for ${enr} copied to clipboard!`, false);
        }).catch(() => {
          prompt('Copy candidate verification link:', url);
        });
      });
    });

    tableWrap.querySelectorAll('[data-revoke-cert]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.revokeCert;
        if (!id) return;
        if (!confirm(`Are you sure you want to revoke certificate ${id}? Its online verification will be marked as invalidated.`)) return;
        const token = getAdminToken();
        if (!token) {
          if (feedback) showFeedback(feedback, 'Admin session expired. Please sign in again.', true);
          return setAdminStatus('Admin session expired. Please sign in again.', true);
        }

        setButtonBusy(btn, true, 'Revoking...');
        try {
          const csrfToken = await getCsrfToken();
          const res = await fetch(`/api/admin/certificates/${encodeURIComponent(id)}/revoke`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': csrfToken,
              'Accept': 'application/json'
            },
            body: JSON.stringify({ reason: 'Administrative revocation' })
          });
          const result = await readJsonResponse(res);
          if (!res.ok || !result.success) throw new Error(result.message || 'Failed to revoke certificate.');
          
          if (feedback) showFeedback(feedback, `Certificate ${id} marked as REVOKED.`, false);
          setAdminStatus(`Certificate ${id} revoked successfully.`, false);
          await loadAdminDashboard();
        } catch (err) {
          if (feedback) showFeedback(feedback, err.message, true);
          setAdminStatus(err.message, true);
        } finally {
          setButtonBusy(btn, false);
        }
      });
    });

    tableWrap.querySelectorAll('[data-reinstate-cert]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.reinstateCert;
        if (!id) return;
        const token = getAdminToken();
        if (!token) {
          if (feedback) showFeedback(feedback, 'Admin session expired. Please sign in again.', true);
          return setAdminStatus('Admin session expired. Please sign in again.', true);
        }

        setButtonBusy(btn, true, 'Reinstating...');
        try {
          const csrfToken = await getCsrfToken();
          const res = await fetch(`/api/admin/certificates/${encodeURIComponent(id)}/reinstate`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': csrfToken,
              'Accept': 'application/json'
            }
          });
          const result = await readJsonResponse(res);
          if (!res.ok || !result.success) throw new Error(result.message || 'Failed to reinstate certificate.');
          
          if (feedback) showFeedback(feedback, `Certificate ${id} reinstated to active status.`, false);
          setAdminStatus(`Certificate ${id} reinstated successfully.`, false);
          await loadAdminDashboard();
        } catch (err) {
          if (feedback) showFeedback(feedback, err.message, true);
          setAdminStatus(err.message, true);
        } finally {
          setButtonBusy(btn, false);
        }
      });
    });

    tableWrap.querySelectorAll('[data-delete-cert]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.deleteCert;
        if (!id) return;
        if (!confirm(`Are you sure you want to permanently delete certificate ${id}? This cannot be undone.`)) return;
        const token = getAdminToken();
        if (!token) {
          if (feedback) showFeedback(feedback, 'Admin session expired. Please sign in again.', true);
          return setAdminStatus('Admin session expired. Please sign in again.', true);
        }

        setButtonBusy(btn, true, 'Deleting...');
        try {
          const csrfToken = await getCsrfToken();
          const res = await fetch(`/api/admin/certificates/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': csrfToken,
              'Accept': 'application/json'
            }
          });
          const result = await readJsonResponse(res);
          if (!res.ok || !result.success) throw new Error(result.message || 'Failed to delete certificate.');
          
          if (feedback) showFeedback(feedback, `Certificate ${id} permanently deleted.`, false);
          setAdminStatus(`Certificate ${id} permanently deleted.`, false);
          await loadAdminDashboard();
        } catch (err) {
          if (feedback) showFeedback(feedback, err.message, true);
          setAdminStatus(err.message, true);
        } finally {
          setButtonBusy(btn, false);
        }
      });
    });
  }

  // Auto-Generate button handlers
  const btnAutoGenerate = document.getElementById('btnAutoGenerateCertNumber');
  if (btnAutoGenerate && !btnAutoGenerate._bound) {
    btnAutoGenerate._bound = true;
    btnAutoGenerate.addEventListener('click', () => {
      const numInput = document.getElementById('certNumber');
      if (numInput) {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        numInput.value = `RBT-WS-${year}-${rand}`;
        numInput.dispatchEvent(new Event('input', { bubbles: true }));
        numInput.focus();
        numInput.select();
      }
    });
  }

  const btnAutoEnr = document.getElementById('btnAutoGenerateEnrollmentNo');
  if (btnAutoEnr && !btnAutoEnr._bound) {
    btnAutoEnr._bound = true;
    btnAutoEnr.addEventListener('click', () => {
      const enrInput = document.getElementById('certEnrollmentNo');
      if (enrInput) {
        const year = new Date().getFullYear();
        const rand = Math.floor(100 + Math.random() * 900);
        enrInput.value = `ENR-${year}-${rand}`;
        enrInput.dispatchEvent(new Event('input', { bubbles: true }));
        enrInput.focus();
        enrInput.select();
      }
    });
  }

  // Certificate document dropzone & file handling
  const certDropzone = document.getElementById('certDropzone');
  const certFileInput = document.getElementById('certFileInput');
  const certFileBase64 = document.getElementById('certFileBase64');
  const certFileOriginalName = document.getElementById('certFileOriginalName');
  const certFilePreviewBox = document.getElementById('certFilePreviewBox');

  function clearCertFileUpload() {
    if (certFileBase64) certFileBase64.value = '';
    if (certFileOriginalName) certFileOriginalName.value = '';
    if (certFileInput) certFileInput.value = '';
    if (certFilePreviewBox) {
      certFilePreviewBox.style.display = 'none';
      certFilePreviewBox.innerHTML = '';
    }
  }

  function handleCertFileSelect(file) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      if (feedback) showFeedback(feedback, 'File is too large. Maximum size allowed is 15MB.', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      if (certFileBase64) certFileBase64.value = e.target.result;
      if (certFileOriginalName) certFileOriginalName.value = file.name;
      if (certFilePreviewBox) {
        certFilePreviewBox.style.display = 'block';
        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        certFilePreviewBox.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(0, 168, 89, 0.1); border: 1px solid rgba(0, 168, 89, 0.3); border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.3rem;">${isPdf ? '📄' : '🖼️'}</span>
              <div>
                <strong style="color: var(--text); font-size: 0.88rem; display: block;">${escapeHtml(file.name)}</strong>
                <span style="color: var(--text-secondary); font-size: 0.76rem;">${(file.size / 1024).toFixed(1)} KB &bull; Ready for upload</span>
              </div>
            </div>
            <button type="button" id="btnRemoveCertFile" style="background: none; border: none; color: #ef4444; font-size: 0.82rem; font-weight: 700; cursor: pointer;">✕ Remove</button>
          </div>
        `;
        document.getElementById('btnRemoveCertFile')?.addEventListener('click', clearCertFileUpload);
      }
    };
    reader.readAsDataURL(file);
  }

  if (certDropzone && !certDropzone._bound) {
    certDropzone._bound = true;
    certDropzone.addEventListener('click', () => certFileInput?.click());
    certDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      certDropzone.style.borderColor = 'var(--green)';
      certDropzone.style.background = 'rgba(0, 168, 89, 0.08)';
    });
    certDropzone.addEventListener('dragleave', () => {
      certDropzone.style.borderColor = '';
      certDropzone.style.background = '';
    });
    certDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      certDropzone.style.borderColor = '';
      certDropzone.style.background = '';
      if (e.dataTransfer.files?.length) {
        handleCertFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (certFileInput && !certFileInput._bound) {
    certFileInput._bound = true;
    certFileInput.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        handleCertFileSelect(e.target.files[0]);
      }
    });
  }

  if (btnOpenModal && !btnOpenModal._bound) {
    btnOpenModal._bound = true;
    btnOpenModal.addEventListener('click', () => {
      formDrawer.style.display = 'block';
      certForm?.reset();
      clearCertFileUpload();
      const numInput = document.getElementById('certNumber');
      const year = new Date().getFullYear();
      if (numInput) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        numInput.value = `RBT-WS-${year}-${rand}`;
      }
      const enrInput = document.getElementById('certEnrollmentNo');
      if (enrInput) {
        const rand = Math.floor(100 + Math.random() * 900);
        enrInput.value = `ENR-${year}-${rand}`;
      }
      document.getElementById('certDate').value = new Date().toISOString().split('T')[0];
      formDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  if (btnCancel && !btnCancel._bound) {
    btnCancel._bound = true;
    btnCancel.addEventListener('click', () => {
      formDrawer.style.display = 'none';
      certForm?.reset();
      clearCertFileUpload();
      if (feedback) feedback.textContent = '';
    });
  }

  if (certForm && !certForm._bound) {
    certForm._bound = true;
    certForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getAdminToken();
      if (!token) return showFeedback(feedback, 'Admin session expired. Please sign in.', true);

      const submitBtn = document.getElementById('btnIssueCert');
      if (submitBtn) setButtonBusy(submitBtn, true);

      const certEmailVal = document.getElementById('certEmail')?.value.trim() || undefined;
      const year = new Date().getFullYear();
      let certNumVal = document.getElementById('certNumber')?.value.trim();
      if (!certNumVal) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        certNumVal = `RBT-WS-${year}-${rand}`;
        const numInput = document.getElementById('certNumber');
        if (numInput) numInput.value = certNumVal;
      }
      let enrVal = document.getElementById('certEnrollmentNo')?.value.trim();
      if (!enrVal) {
        const rand = Math.floor(100 + Math.random() * 900);
        enrVal = `ENR-${year}-${rand}`;
        const enrInput = document.getElementById('certEnrollmentNo');
        if (enrInput) enrInput.value = enrVal;
      }
      const payload = {
        enrollmentNo: enrVal,
        enrollmentNumber: enrVal,
        certificateNumber: certNumVal,
        code: certNumVal,
        studentName: document.getElementById('certStudentName').value.trim(),
        courseName: document.getElementById('certCourseName').value.trim(),
        email: certEmailVal,
        studentEmail: certEmailVal,
        issueDate: document.getElementById('certDate').value || undefined,
        grade: document.getElementById('certGrade').value,
        venue: document.getElementById('certVenue')?.value.trim() || undefined,
        fileBase64: certFileBase64?.value || undefined,
        fileOriginalName: certFileOriginalName?.value || undefined
      };

      try {
        const csrfToken = await getCsrfToken();
        const res = await fetch('/api/admin/certificates/issue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify(payload)
        });

        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) throw new Error(result.message || 'Failed to issue certificate.');

        const issuedCode = result.certificate?.code || certNumVal || '';
        showFeedback(feedback, `✅ Certificate ${issuedCode} uploaded & issued successfully!`, false);
        setAdminStatus(`Certificate ${issuedCode} created and available for student lookup.`, false);
        setTimeout(() => {
          formDrawer.style.display = 'none';
          certForm.reset();
          clearCertFileUpload();
          if (feedback) feedback.textContent = '';
        }, 1200);

        await loadAdminDashboard();
      } catch (err) {
        showFeedback(feedback, err.message, true);
      } finally {
        if (submitBtn) setButtonBusy(submitBtn, false);
      }
    });
  }

  renderCerts(certs);
}

/** Admin Hardware Store Products Manager Controller */
function initAdminStoreManager(data) {
  const tableWrap = document.getElementById('adminProductsTableWrap');
  const btnToggleForm = document.getElementById('btnToggleAddProductForm');
  const formCard = document.getElementById('adminProductFormCard');
  const formTitle = document.getElementById('adminProductFormTitle');
  const form = document.getElementById('adminProductForm');
  const btnCancel = document.getElementById('btnCancelProductForm');
  const feedback = document.getElementById('adminProductFormFeedback');
  const dropzone = document.getElementById('adminProdDropzone');
  const fileInput = document.getElementById('adminProdFileInput');
  const previewWrap = document.getElementById('adminProdDropzonePreview');
  const dropzoneContent = document.getElementById('adminProdDropzoneContent');
  const previewImg = document.getElementById('adminProdPreviewImg');
  const btnRemoveImg = document.getElementById('btnRemoveProdImg');
  const imageBase64Input = document.getElementById('adminProdFileBase64');
  const imageUrlInput = document.getElementById('adminProdImageUrl');

  if (!tableWrap) return;

  let productsList = [];

  async function loadProducts() {
    try {
      const res = await fetch('/api/store/products');
      if (res.ok) {
        const d = await res.json();
        if (d.success && Array.isArray(d.products)) {
          productsList = d.products;
          renderProducts(productsList);
          return;
        }
      }
    } catch {}
    productsList = data?.products || [];
    renderProducts(productsList);
  }

  function renderProducts(list) {
    if (!list.length) {
      tableWrap.innerHTML = '<p class="empty-state" style="padding: 2rem;">No hardware products in store catalog yet. Click "Add New Product" to create one.</p>';
      return;
    }

    tableWrap.innerHTML = `
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Pricing</th>
              <th>Stock Status</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((p) => {
              const prodId = escapeHtml(p.id);
              const inStock = Boolean(p.inStock);
              const disc = p.originalPrice && p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
              return `
              <tr id="admin-prod-row-${prodId}">
                <td>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${escapeHtml(p.image || 'assets/store/kit_4wd_robot.jpg')}" alt="" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--line);" onerror="this.src='assets/store/kit_4wd_robot.jpg'">
                    <div>
                      <strong style="color: var(--text);">${escapeHtml(p.title)}</strong>
                      <div style="font-family: monospace; font-size: 0.76rem; color: var(--text-muted);">${escapeHtml(p.sku || p.id)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="meta-pill" style="font-size: 0.78rem;">${escapeHtml(p.category)}</span>
                </td>
                <td>
                  <strong style="color: var(--green);">₹${Number(p.price).toLocaleString()}</strong>
                  ${p.originalPrice ? `<div style="text-decoration: line-through; font-size: 0.78rem; color: var(--text-muted);">₹${Number(p.originalPrice).toLocaleString()}</div>` : ''}
                  ${disc > 0 ? `<span class="badge" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); font-size: 0.7rem; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-top: 2px;">${disc}% OFF</span>` : ''}
                </td>
                <td>
                  <span class="role-pill ${inStock ? 'is-active' : ''}" style="${inStock ? 'background: rgba(0,168,89,0.15); color: var(--green); border-color: rgba(0,168,89,0.3);' : 'background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3);'}">
                    ${inStock ? 'In Stock (' + (p.stockQuantity ?? 1) + ')' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  ${p.featured ? '<span style="color: #eab308; font-weight: 700; font-size: 0.8rem;">★ Featured</span>' : '<span style="color: var(--text-muted); font-size: 0.8rem;">Standard</span>'}
                </td>
                <td>
                  <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <button class="btn btn-secondary btn-sm" data-toggle-prod-stock="${prodId}" data-current-stock="${inStock}" type="button" title="Toggle Stock Availability" style="padding: 4px 8px; font-size: 0.78rem;">
                      ${inStock ? 'Set Out of Stock' : 'Set In Stock'}
                    </button>
                    <button class="btn btn-secondary btn-sm" data-edit-prod="${prodId}" type="button" title="Edit Product" style="padding: 4px 8px; font-size: 0.78rem;">
                      Edit
                    </button>
                    <button class="btn btn-secondary btn-sm" data-delete-prod="${prodId}" type="button" title="Delete Product" style="padding: 4px 8px; font-size: 0.78rem; color: #ef4444; border-color: rgba(239,68,68,0.3);">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    tableWrap.querySelectorAll('[data-toggle-prod-stock]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const prodId = btn.dataset.toggleProdStock;
        const currentInStock = btn.dataset.currentStock === 'true';
        const newStock = !currentInStock;
        const token = getAdminToken();
        if (!token) return setAdminStatus('Admin session expired. Please sign in again.', true);

        setButtonBusy(btn, true, 'Updating...');
        try {
          const csrfToken = await getCsrfToken();
          const res = await fetch(`/api/admin/products/${encodeURIComponent(prodId)}/stock`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ inStock: newStock })
          });
          const result = await readJsonResponse(res);
          if (!res.ok || !result.success) throw new Error(result.message || 'Failed to update stock.');
          setAdminStatus(`Stock status updated for ${result.product?.title || prodId}.`, false);
          await loadProducts();
        } catch (err) {
          setAdminStatus(err.message, true);
        } finally {
          setButtonBusy(btn, false);
        }
      });
    });

    function populateEditForm(prod) {
      if (!prod || !form) return;
      formCard.hidden = false;
      if (formTitle) formTitle.textContent = `Edit Product: ${prod.title}`;
      const idEl = document.getElementById('adminProdId');
      if (idEl) idEl.value = prod.id;
      const titleEl = document.getElementById('adminProdTitle');
      if (titleEl) titleEl.value = prod.title || '';
      const catEl = document.getElementById('adminProdCategory');
      if (catEl) catEl.value = prod.category || '';
      const priceEl = document.getElementById('adminProdPrice');
      if (priceEl) priceEl.value = prod.price ?? '';
      const origPriceEl = document.getElementById('adminProdOrigPrice');
      if (origPriceEl) origPriceEl.value = prod.originalPrice || '';
      const stockEl = document.getElementById('adminProdStockQty');
      if (stockEl) stockEl.value = prod.stockQuantity ?? 10;
      const skuEl = document.getElementById('adminProdSku');
      if (skuEl) skuEl.value = prod.sku || '';
      const descEl = document.getElementById('adminProdDesc');
      if (descEl) descEl.value = prod.description || '';
      const featEl = document.getElementById('adminProdFeatures');
      if (featEl) featEl.value = Array.isArray(prod.features) ? prod.features.join('\n') : (prod.features || '');
      const inStockEl = document.getElementById('adminProdInStock');
      if (inStockEl) inStockEl.checked = prod.inStock !== false;
      const featCheckEl = document.getElementById('adminProdFeatured');
      if (featCheckEl) featCheckEl.checked = Boolean(prod.featured);
      
      if (prod.image) {
        removePhotoFlag = false;
        if (imageUrlInput) imageUrlInput.value = prod.image;
        if (previewImg) previewImg.src = prod.image;
        if (previewWrap) {
          previewWrap.hidden = false;
          previewWrap.style.display = '';
        }
        if (dropzoneContent) dropzoneContent.hidden = true;
      } else {
        clearImagePreview();
        removePhotoFlag = false;
      }
      const saveText = document.getElementById('btnSaveProductText');
      if (saveText) saveText.textContent = 'Update Product';
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    tableWrap.querySelectorAll('[data-edit-prod]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const prodId = btn.dataset.editProd;
        const prod = productsList.find((p) => String(p.id) === String(prodId));
        populateEditForm(prod);
      });
    });

    if (!tableWrap._editDelegated) {
      tableWrap._editDelegated = true;
      tableWrap.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-edit-prod]');
        if (editBtn) {
          e.preventDefault();
          const prodId = editBtn.dataset.editProd;
          const prod = productsList.find((p) => String(p.id) === String(prodId));
          populateEditForm(prod);
        }
      });
    }

    tableWrap.querySelectorAll('[data-delete-prod]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const prodId = btn.dataset.deleteProd;
        const prod = productsList.find((p) => p.id === prodId);
        const name = prod?.title || prodId;
        if (!confirm(`Are you sure you want to delete "${name}" from the store catalog?`)) return;

        const token = getAdminToken();
        if (!token) return setAdminStatus('Admin session expired. Please sign in again.', true);

        setButtonBusy(btn, true, 'Deleting...');
        try {
          const csrfToken = await getCsrfToken();
          const res = await fetch(`/api/admin/products/${encodeURIComponent(prodId)}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': csrfToken,
            }
          });
          const result = await readJsonResponse(res);
          if (!res.ok || !result.success) throw new Error(result.message || 'Failed to delete product.');
          setAdminStatus(`Product "${name}" deleted successfully.`, false);
          await loadProducts();
        } catch (err) {
          setAdminStatus(err.message, true);
        } finally {
          setButtonBusy(btn, false);
        }
      });
    });
  }

  if (btnToggleForm && !btnToggleForm._bound) {
    btnToggleForm._bound = true;
    btnToggleForm.addEventListener('click', () => {
      if (formCard.hidden) {
        formCard.hidden = false;
        formTitle.textContent = 'Add New Store Item';
        form.reset();
        document.getElementById('adminProdId').value = '';
        document.getElementById('btnSaveProductText').textContent = 'Save Product';
        clearImagePreview();
        formCard.scrollIntoView({ behavior: 'smooth' });
      } else {
        formCard.hidden = true;
      }
    });
  }

  if (btnCancel && !btnCancel._bound) {
    btnCancel._bound = true;
    btnCancel.addEventListener('click', () => {
      formCard.hidden = true;
      form.reset();
      clearImagePreview();
    });
  }

  let removePhotoFlag = false;

  function clearImagePreview() {
    removePhotoFlag = true;
    if (imageBase64Input) imageBase64Input.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (previewWrap) {
      previewWrap.hidden = true;
      previewWrap.style.display = 'none';
    }
    if (previewImg) {
      previewImg.removeAttribute('src');
    }
    if (dropzoneContent) dropzoneContent.hidden = false;
    if (fileInput) fileInput.value = '';
  }

  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    removePhotoFlag = false;
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target.result;
      if (imageBase64Input) imageBase64Input.value = b64;
      if (previewImg) previewImg.src = b64;
      if (previewWrap) {
        previewWrap.hidden = false;
        previewWrap.style.display = '';
      }
      if (dropzoneContent) dropzoneContent.hidden = true;
    };
    reader.readAsDataURL(file);
  }

  if (dropzone && !dropzone._bound) {
    dropzone._bound = true;
    dropzone.addEventListener('click', (e) => {
      if (e.target !== btnRemoveImg) fileInput?.click();
    });
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--green)';
      dropzone.style.background = 'rgba(0, 168, 89, 0.08)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '';
      dropzone.style.background = '';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      dropzone.style.background = '';
      if (e.dataTransfer.files?.length) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput && !fileInput._bound) {
    fileInput._bound = true;
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) handleFileSelect(fileInput.files[0]);
    });
  }

  if (btnRemoveImg && !btnRemoveImg._bound) {
    btnRemoveImg._bound = true;
    btnRemoveImg.addEventListener('click', (e) => {
      e.stopPropagation();
      clearImagePreview();
    });
  }

  if (form && !form._bound) {
    form._bound = true;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getAdminToken();
      if (!token) return showFeedback(feedback, 'Admin session expired. Please sign in.', true);

      const submitBtn = document.getElementById('btnSaveProduct');
      setButtonBusy(submitBtn, true);

      const prodId = document.getElementById('adminProdId').value.trim();
      const isEditing = Boolean(prodId);

      const payload = {
        title: document.getElementById('adminProdTitle')?.value?.trim() || '',
        category: document.getElementById('adminProdCategory')?.value || '',
        price: Number(document.getElementById('adminProdPrice')?.value || 0),
        originalPrice: document.getElementById('adminProdOrigPrice')?.value ? Number(document.getElementById('adminProdOrigPrice').value) : undefined,
        stockQuantity: Number(document.getElementById('adminProdStockQty')?.value || 10),
        sku: document.getElementById('adminProdSku')?.value?.trim() || undefined,
        description: document.getElementById('adminProdDesc')?.value?.trim() || '',
        features: document.getElementById('adminProdFeatures')?.value ? document.getElementById('adminProdFeatures').value.split('\n').map(s => s.trim()).filter(Boolean) : [],
        inStock: document.getElementById('adminProdInStock')?.checked ?? true,
        featured: Boolean(document.getElementById('adminProdFeatured')?.checked),
        image: imageUrlInput ? imageUrlInput.value || undefined : undefined,
        fileBase64: imageBase64Input ? imageBase64Input.value || undefined : undefined,
        removeImage: Boolean(removePhotoFlag && !imageBase64Input.value),
      };

      try {
        const csrfToken = await getCsrfToken();
        const url = isEditing ? `/api/admin/products/${encodeURIComponent(prodId)}` : '/api/admin/products';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(payload)
        });

        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) throw new Error(result.message || 'Failed to save product.');

        showFeedback(feedback, result.message || 'Product saved successfully!', false);
        setAdminStatus(`Store product "${payload.title}" saved.`, false);
        form.reset();
        clearImagePreview();
        setTimeout(() => {
          formCard.hidden = true;
          if (feedback) feedback.textContent = '';
        }, 1200);

        await loadProducts();
      } catch (err) {
        showFeedback(feedback, err.message, true);
      } finally {
        setButtonBusy(submitBtn, false);
      }
    });
  }

  loadProducts();
}

/** Admin Event Photo & Video Gallery Manager Controller */
function initAdminEventGallery(data) {
  const eventsGrid = document.getElementById('adminEventsGrid');
  const btnOpenModal = document.getElementById('btnOpenEventModal');
  const formDrawer = document.getElementById('eventFormDrawer');
  const formTitle = document.getElementById('eventFormTitle');
  const eventForm = document.getElementById('adminEventForm');
  const editIdInput = document.getElementById('eventEditId');
  const btnCancel = document.getElementById('btnCancelEventForm');
  const dropzone = document.getElementById('eventDropzone');
  const fileInput = document.getElementById('eventFileInput');
  const imageUrlInput = document.getElementById('eventImageUrl');
  const previewBox = document.getElementById('eventPreviewBox');
  const feedback = document.getElementById('eventFormFeedback');

  if (!eventsGrid) return;

  const galleryEvents = data?.eventsGallery || [];
  let adminEventImages = [];

  function renderGallery(events) {
    if (!events || !events.length) {
      eventsGrid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">No event media in gallery yet. Click "Upload Event Media" to add one.</p>';
      return;
    }

    eventsGrid.innerHTML = events.map((evt) => {
      const photosCount = Array.isArray(evt.images) && evt.images.length > 0 ? evt.images.length : (evt.image ? 1 : 0);
      const isVideo = evt.mediaType === 'video' || (typeof evt.videoUrl === 'string' && evt.videoUrl.length > 0);
      return `
      <div class="admin-event-item" id="admin-evt-${escapeHtml(evt.id)}">
        <div class="admin-event-thumb">
          <img src="${escapeHtml(evt.image)}" alt="${escapeHtml(evt.title)}" loading="lazy">
        </div>
        <div class="admin-event-details">
          <small>${escapeHtml(evt.category)} • ${escapeHtml(evt.institution || '')}</small>
          <h4>${escapeHtml(evt.title)}</h4>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">${escapeHtml(evt.attendees || '')}</span>
          ${photosCount > 1 ? `<span class="admin-event-photos-badge">📸 ${photosCount} Photos (Sliding)</span>` : (isVideo ? '<span class="admin-event-photos-badge">▶ Video Asset</span>' : '')}
          <div class="admin-event-actions">
            <button type="button" class="admin-btn-action admin-btn-edit" data-edit-id="${escapeHtml(evt.id)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button type="button" class="admin-btn-action admin-btn-delete" data-delete-id="${escapeHtml(evt.id)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Attach Edit & Delete Listeners
    eventsGrid.querySelectorAll('.admin-btn-edit').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.editId;
        const item = galleryEvents.find((evt) => String(evt.id) === String(id));
        if (item) openEditForm(item);
      });
    });

    eventsGrid.querySelectorAll('.admin-btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.deleteId;
        if (!confirm('Are you sure you want to remove this event media from the gallery?')) return;
        await deleteEventPhoto(id);
      });
    });

    if (!eventsGrid._delegated) {
      eventsGrid._delegated = true;
      eventsGrid.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.admin-btn-edit');
        if (editBtn) {
          e.preventDefault();
          const id = editBtn.dataset.editId;
          const item = galleryEvents.find((evt) => String(evt.id) === String(id));
          if (item) openEditForm(item);
          return;
        }

        const deleteBtn = e.target.closest('.admin-btn-delete');
        if (deleteBtn) {
          e.preventDefault();
          const id = deleteBtn.dataset.deleteId;
          if (!confirm('Are you sure you want to remove this event media from the gallery?')) return;
          await deleteEventPhoto(id);
        }
      });
    }
  }

  function renderAdminPreviewGrid() {
    if (!previewBox) return;
    if (!adminEventImages.length) {
      previewBox.innerHTML = '';
      previewBox.style.display = 'none';
      return;
    }

    const mediaTypeSelect = document.getElementById('eventMediaType');
    const isVid = mediaTypeSelect && mediaTypeSelect.value === 'video';

    if (isVid && adminEventImages[0]) {
      previewBox.style.display = 'block';
      previewBox.innerHTML = `
        <div class="admin-preview-wrapper">
          <div class="admin-preview-img-container">
            <video src="${adminEventImages[0]}" controls style="max-height: 190px; width: 100%; border-radius: 8px;"></video>
          </div>
          <div class="admin-preview-meta-row">
            <span>▶ Video Media Attached</span>
            <button type="button" class="admin-preview-delete-btn" id="btnAdminClearEventVideo" title="Delete / Remove this video">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Delete Video
            </button>
          </div>
        </div>
      `;
      const clearVidBtn = previewBox.querySelector('#btnAdminClearEventVideo');
      if (clearVidBtn) {
        clearVidBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          adminEventImages = [];
          if (imageUrlInput) imageUrlInput.value = '';
          if (fileInput) fileInput.value = '';
          renderAdminPreviewGrid();
        });
      }
      return;
    }

    previewBox.style.display = 'block';
    previewBox.innerHTML = `
      <div class="multi-preview-grid">
        ${adminEventImages.map((img, idx) => `
          <div class="preview-thumb-item">
            <img src="${escapeHtml(img)}" alt="Preview ${idx + 1}">
            ${idx === 0 ? '<span class="preview-thumb-primary">Cover</span>' : ''}
            <button type="button" class="preview-thumb-remove" data-remove-thumb="${idx}" title="Remove this photo">&times;</button>
          </div>
        `).join('')}
      </div>
      <div class="admin-preview-meta-row" style="margin-top: 8px;">
        <span>📸 <b>${adminEventImages.length}</b> ${adminEventImages.length === 1 ? 'photo' : 'photos'} attached (First is cover)</span>
        <button type="button" class="admin-preview-delete-btn" id="btnAdminClearAllEventPhotos" style="padding: 4px 10px; font-size: 0.76rem;" title="Delete and remove all attached photos">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          Clear All Photos
        </button>
      </div>
    `;

    previewBox.querySelectorAll('[data-remove-thumb]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const removeIdx = Number(btn.dataset.removeThumb);
        adminEventImages.splice(removeIdx, 1);
        if (imageUrlInput) imageUrlInput.value = adminEventImages[0] || '';
        renderAdminPreviewGrid();
      });
    });

    const clearAllBtn = previewBox.querySelector('#btnAdminClearAllEventPhotos');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adminEventImages = [];
        if (imageUrlInput) imageUrlInput.value = '';
        if (fileInput) fileInput.value = '';
        renderAdminPreviewGrid();
      });
    }
  }

  function openEditForm(item) {
    if (!formDrawer) return;
    formDrawer.style.display = 'block';
    if (formTitle) formTitle.textContent = item ? `Edit Event Media: ${item.title}` : 'Upload New Event Media';
    if (editIdInput) editIdInput.value = item ? item.id : '';
    const titleEl = document.getElementById('eventTitle');
    if (titleEl) titleEl.value = item ? (item.title || '') : '';
    const typeEl = document.getElementById('eventMediaType');
    if (typeEl) typeEl.value = item ? (item.mediaType || 'image') : 'image';

    const eventCategorySelect = document.getElementById('eventCategory');
    const eventCustomCategoryWrap = document.getElementById('eventCustomCategoryWrap');
    const eventCustomCategory = document.getElementById('eventCustomCategory');

    if (item && item.category) {
      const exists = Array.from(eventCategorySelect?.options || []).some((opt) => opt.value === item.category && opt.value !== '__custom__');
      if (exists) {
        if (eventCategorySelect) eventCategorySelect.value = item.category;
        if (eventCustomCategoryWrap) eventCustomCategoryWrap.style.display = 'none';
        if (eventCustomCategory) {
          eventCustomCategory.removeAttribute('required');
          eventCustomCategory.value = '';
        }
      } else {
        if (eventCategorySelect) eventCategorySelect.value = '__custom__';
        if (eventCustomCategoryWrap) eventCustomCategoryWrap.style.display = 'block';
        if (eventCustomCategory) {
          eventCustomCategory.setAttribute('required', '');
          eventCustomCategory.value = item.category;
        }
      }
    } else {
      if (eventCategorySelect) eventCategorySelect.value = 'College Bootcamps';
      if (eventCustomCategoryWrap) eventCustomCategoryWrap.style.display = 'none';
      if (eventCustomCategory) {
        eventCustomCategory.removeAttribute('required');
        eventCustomCategory.value = '';
      }
    }

    const instEl = document.getElementById('eventInstitution');
    if (instEl) instEl.value = item ? (item.institution || '') : '';
    const dateEl = document.getElementById('eventDate');
    if (dateEl) dateEl.value = item ? (item.date || '') : '';
    const attEl = document.getElementById('eventAttendees');
    if (attEl) attEl.value = item ? (item.attendees || '') : '';
    const durEl = document.getElementById('eventDuration');
    if (durEl) durEl.value = item ? (item.duration || '') : '';
    const tagsEl = document.getElementById('eventTags');
    if (tagsEl) tagsEl.value = item ? (Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')) : '';
    const descEl = document.getElementById('eventDescription');
    if (descEl) descEl.value = item ? (item.description || '') : '';
    if (imageUrlInput) imageUrlInput.value = item ? (item.image || item.videoUrl || '') : '';

    if (item) {
      adminEventImages = Array.isArray(item.images) && item.images.length > 0 ? [...item.images] : (item.image ? [item.image] : []);
    } else {
      adminEventImages = [];
    }

    renderAdminPreviewGrid();
    formDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Admin custom category toggle
  const adminEventCatSelect = document.getElementById('eventCategory');
  const adminEventCustomWrap = document.getElementById('eventCustomCategoryWrap');
  const adminEventCustomInput = document.getElementById('eventCustomCategory');
  if (adminEventCatSelect && !adminEventCatSelect._customBound) {
    adminEventCatSelect._customBound = true;
    adminEventCatSelect.addEventListener('change', () => {
      if (adminEventCatSelect.value === '__custom__') {
        if (adminEventCustomWrap) adminEventCustomWrap.style.display = 'block';
        adminEventCustomInput?.setAttribute('required', '');
        adminEventCustomInput?.focus();
      } else {
        if (adminEventCustomWrap) adminEventCustomWrap.style.display = 'none';
        adminEventCustomInput?.removeAttribute('required');
        if (adminEventCustomInput) adminEventCustomInput.value = '';
      }
    });
  }

  if (btnOpenModal && !btnOpenModal._bound) {
    btnOpenModal._bound = true;
    btnOpenModal.addEventListener('click', () => {
      eventForm?.reset();
      openEditForm(null);
    });
  }

  if (btnCancel && !btnCancel._bound) {
    btnCancel._bound = true;
    btnCancel.addEventListener('click', () => {
      formDrawer.style.display = 'none';
      eventForm?.reset();
      if (adminEventCustomWrap) adminEventCustomWrap.style.display = 'none';
      if (adminEventCustomInput) {
        adminEventCustomInput.removeAttribute('required');
        adminEventCustomInput.value = '';
      }
      adminEventImages = [];
      renderAdminPreviewGrid();
      if (feedback) feedback.textContent = '';
    });
  }

  // Drag & drop and file input for multiple files
  if (dropzone && !dropzone._bound) {
    dropzone._bound = true;
    dropzone.addEventListener('click', () => fileInput?.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }

  if (fileInput && !fileInput._bound) {
    fileInput._bound = true;
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length) {
        handleFiles(fileInput.files);
      }
    });
  }

  function handleFiles(files) {
    const fileList = Array.from(files);
    let isVideoEncountered = false;

    fileList.forEach((file) => {
      const isVid = file.type.startsWith('video/');
      const isImg = file.type.startsWith('image/');
      if (!isImg && !isVid) return;

      if (isVid) isVideoEncountered = true;

      const reader = new FileReader();
      reader.onload = (e) => {
        if (isVid) {
          adminEventImages = [e.target.result];
          const mediaTypeSelect = document.getElementById('eventMediaType');
          if (mediaTypeSelect) mediaTypeSelect.value = 'video';
        } else {
          adminEventImages.push(e.target.result);
          const mediaTypeSelect = document.getElementById('eventMediaType');
          if (mediaTypeSelect && !isVideoEncountered) mediaTypeSelect.value = 'image';
        }
        if (imageUrlInput) imageUrlInput.value = adminEventImages[0] || '';
        renderAdminPreviewGrid();
      };
      reader.readAsDataURL(file);
    });
  }

  if (imageUrlInput && !imageUrlInput._bound) {
    imageUrlInput._bound = true;
    imageUrlInput.addEventListener('input', () => {
      const val = imageUrlInput.value.trim();
      const mediaTypeSelect = document.getElementById('eventMediaType');
      if (val) {
        const isVideo = val.endsWith('.mp4') || val.endsWith('.webm') || val.includes('youtube.com') || val.includes('youtu.be') || val.includes('vimeo.com');
        if (mediaTypeSelect) {
          mediaTypeSelect.value = isVideo ? 'video' : 'image';
        }
        if (!adminEventImages.includes(val)) {
          adminEventImages = [val];
        }
        renderAdminPreviewGrid();
      } else {
        adminEventImages = [];
        renderAdminPreviewGrid();
      }
    });
  }

  // Submit Handler
  if (eventForm && !eventForm._bound) {
    eventForm._bound = true;
    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getAdminToken();
      if (!token) {
        showFeedback(feedback, 'Session expired. Please log in again.', true);
        return;
      }

      const id = editIdInput.value;
      const isEdit = Boolean(id);
      const mediaTypeSelect = document.getElementById('eventMediaType');
      const mediaType = mediaTypeSelect ? mediaTypeSelect.value : 'image';
      const durationInput = document.getElementById('eventDuration');
      const duration = durationInput ? durationInput.value.trim() : '';
      const mediaUrl = imageUrlInput.value.trim();

      const finalImages = adminEventImages.length > 0 ? adminEventImages : (mediaUrl ? [mediaUrl] : []);
      const primaryImage = finalImages[0] || mediaUrl;

      if (!primaryImage && mediaType !== 'video') {
        showFeedback(feedback, 'Please upload at least one photo or provide an image URL.', true);
        return;
      }

      let category = document.getElementById('eventCategory').value;
      if (category === '__custom__') {
        category = (document.getElementById('eventCustomCategory')?.value || '').trim();
        if (!category) {
          showFeedback(feedback, 'Please enter your custom category name.', true);
          document.getElementById('eventCustomCategory')?.focus();
          return;
        }
      }

      const payload = {
        title: document.getElementById('eventTitle').value.trim(),
        mediaType,
        category,
        institution: document.getElementById('eventInstitution').value.trim(),
        date: document.getElementById('eventDate').value || undefined,
        attendees: document.getElementById('eventAttendees').value.trim() || undefined,
        duration: duration || (mediaType === 'video' ? '2:30' : undefined),
        image: primaryImage,
        images: finalImages,
        videoUrl: mediaType === 'video' ? (mediaUrl || primaryImage) : undefined,
        description: document.getElementById('eventDescription').value.trim(),
        tags: document.getElementById('eventTags').value.split(',').map((t) => t.trim()).filter(Boolean)
      };

      const submitBtn = document.getElementById('btnSaveEvent');
      if (submitBtn) setButtonBusy(submitBtn, true);

      try {
        const csrfToken = await getCsrfToken();
        const url = isEdit ? `/api/admin/events/${id}` : '/api/admin/events';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify(payload)
        });

        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) {
          throw new Error(result.message || 'Failed to save event photo.');
        }

        showFeedback(feedback, result.message || 'Saved successfully!', false);
        setTimeout(() => {
          if (formDrawer) formDrawer.style.display = 'none';
          eventForm.reset();
          adminEventImages = [];
          renderAdminPreviewGrid();
          if (feedback) feedback.textContent = '';
        }, 1000);

        // Refresh dashboard
        await loadAdminDashboard();
      } catch (err) {
        showFeedback(feedback, err.message, true);
      } finally {
        if (submitBtn) setButtonBusy(submitBtn, false);
      }
    });
  }

  async function deleteEventPhoto(id) {
    const token = getAdminToken();
    if (!token) return;

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken
        }
      });
      const result = await readJsonResponse(res);
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete event photo.');
      }
      setAdminStatus('Event media deleted successfully.', false);
      await loadAdminDashboard();
    } catch (err) {
      setAdminStatus(err.message, true);
    }
  }

  renderGallery(galleryEvents);
}

/** Admin Official Visual Showcase Gallery Controller */
function initAdminShowcaseGallery(data) {
  const showcaseGrid = document.getElementById('adminShowcaseGrid');
  const btnOpenModal = document.getElementById('btnOpenShowcaseModal');
  const formDrawer = document.getElementById('showcaseFormDrawer');
  const formTitle = document.getElementById('showcaseFormTitle');
  const showcaseForm = document.getElementById('adminShowcaseForm');
  const editIdInput = document.getElementById('showcaseEditId');
  const btnCancel = document.getElementById('btnCancelShowcaseForm');
  const dropzone = document.getElementById('showcaseDropzone');
  const fileInput = document.getElementById('showcaseFileInput');
  const imageUrlInput = document.getElementById('showcaseImageUrl');
  const previewBox = document.getElementById('showcasePreviewBox');
  const feedback = document.getElementById('showcaseFormFeedback');
  const showcaseCountBadge = document.getElementById('adminShowcaseCount');
  const eventsCountBadge = document.getElementById('adminEventsCount');

  // Subnav tab elements
  const subtabShowcase = document.getElementById('subtabShowcasePhotos');
  const subtabEvents = document.getElementById('subtabEventAlbums');
  const viewShowcase = document.getElementById('galleryViewShowcase');
  const viewEvents = document.getElementById('galleryViewEvents');

  if (!showcaseGrid && !subtabShowcase) return;

  // Subtab switcher logic
  if (subtabShowcase && subtabEvents && !subtabShowcase._subtabBound) {
    subtabShowcase._subtabBound = true;
    subtabShowcase.addEventListener('click', () => {
      subtabShowcase.classList.add('is-active');
      subtabShowcase.style.background = 'rgba(120, 216, 68, 0.12)';
      subtabShowcase.style.borderColor = 'rgba(120, 216, 68, 0.35)';
      subtabShowcase.style.color = 'var(--green)';

      subtabEvents.classList.remove('is-active');
      subtabEvents.style.background = 'transparent';
      subtabEvents.style.borderColor = 'var(--border)';
      subtabEvents.style.color = 'var(--text-secondary)';

      if (viewShowcase) viewShowcase.style.display = 'block';
      if (viewEvents) viewEvents.style.display = 'none';
    });

    subtabEvents.addEventListener('click', () => {
      subtabEvents.classList.add('is-active');
      subtabEvents.style.background = 'rgba(120, 216, 68, 0.12)';
      subtabEvents.style.borderColor = 'rgba(120, 216, 68, 0.35)';
      subtabEvents.style.color = 'var(--green)';

      subtabShowcase.classList.remove('is-active');
      subtabShowcase.style.background = 'transparent';
      subtabShowcase.style.borderColor = 'var(--border)';
      subtabShowcase.style.color = 'var(--text-secondary)';

      if (viewEvents) viewEvents.style.display = 'block';
      if (viewShowcase) viewShowcase.style.display = 'none';
    });
  }

  let showcaseItems = Array.isArray(data?.showcaseGallery) ? [...data.showcaseGallery] : [];
  let currentShowcaseBase64 = '';

  if (eventsCountBadge && data?.eventsGallery) {
    eventsCountBadge.textContent = data.eventsGallery.length;
  }

  function renderShowcaseGrid(items) {
    if (!showcaseGrid) return;
    if (showcaseCountBadge) showcaseCountBadge.textContent = items.length;

    if (!items || !items.length) {
      showcaseGrid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">No visual showcase photos added yet. Click "Add Showcase Photo" above to add one.</p>';
      return;
    }

    showcaseGrid.innerHTML = items.map((item) => `
      <div class="admin-event-item" id="admin-sc-${escapeHtml(item.id)}">
        <div class="admin-event-thumb">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}" loading="lazy">
          ${item.tileWide ? '<span class="admin-event-photos-badge" style="background: rgba(120, 216, 68, 0.9); color: #02060b; font-weight: 800;">Featured Wide Tile</span>' : '<span class="admin-event-photos-badge">Standard Tile</span>'}
        </div>
        <div class="admin-event-details">
          <small style="color: var(--green); font-weight: 700; text-transform: uppercase; font-size: 0.72rem;">${escapeHtml(item.id)}</small>
          <h4 style="margin: 4px 0 6px; font-size: 0.95rem; line-height: 1.35;">${escapeHtml(item.title)}</h4>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 10px; line-height: 1.4; flex: 1;">${escapeHtml(item.caption)}</p>
          <div class="admin-event-actions">
            <button type="button" class="admin-btn-action admin-btn-edit btn-edit-showcase" data-sc-id="${escapeHtml(item.id)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Photo
            </button>
            <button type="button" class="admin-btn-action admin-btn-delete btn-delete-showcase" data-sc-id="${escapeHtml(item.id)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach Edit & Delete Listeners
    showcaseGrid.querySelectorAll('.btn-edit-showcase').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.scId;
        const item = showcaseItems.find((i) => String(i.id).trim() === String(id).trim());
        if (item) openShowcaseEdit(item);
      });
    });

    showcaseGrid.querySelectorAll('.btn-delete-showcase').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.scId;
        if (!confirm('Are you sure you want to remove this photograph from the visual showcase?')) return;
        await deleteShowcaseItem(id);
      });
    });

    // Event delegation on showcaseGrid for resilient click handling
    if (!showcaseGrid._delegated) {
      showcaseGrid._delegated = true;
      showcaseGrid.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-showcase');
        if (editBtn) {
          e.preventDefault();
          const id = editBtn.dataset.scId;
          const item = showcaseItems.find((i) => String(i.id).trim() === String(id).trim());
          if (item) {
            openShowcaseEdit(item);
          } else {
            console.warn('Showcase photo not found for id:', id);
          }
          return;
        }

        const deleteBtn = e.target.closest('.btn-delete-showcase');
        if (deleteBtn) {
          e.preventDefault();
          const id = deleteBtn.dataset.scId;
          if (!confirm('Are you sure you want to remove this photograph from the visual showcase?')) return;
          await deleteShowcaseItem(id);
        }
      });
    }
  }

  function renderShowcasePreview(imgSrc) {
    if (!previewBox) return;
    if (!imgSrc) {
      previewBox.innerHTML = '';
      previewBox.style.display = 'none';
      return;
    }

    previewBox.style.display = 'block';
    previewBox.innerHTML = `
      <div class="admin-preview-wrapper" style="margin-top: 10px;">
        <div class="admin-preview-img-container" style="max-height: 180px; overflow: hidden; border-radius: 8px; border: 1px solid var(--border);">
          <img src="${escapeHtml(imgSrc)}" alt="Showcase Preview" style="width: 100%; height: 180px; object-fit: cover;">
        </div>
        <div class="admin-preview-meta-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
          <span style="font-size: 0.78rem; color: var(--green); font-weight: 700;">✓ Photograph attached</span>
          <button type="button" class="admin-preview-delete-btn" id="btnClearShowcasePhoto" style="padding: 3px 8px; font-size: 0.74rem;">
            &times; Clear Image
          </button>
        </div>
      </div>
    `;

    const clearBtn = previewBox.querySelector('#btnClearShowcasePhoto');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        currentShowcaseBase64 = '';
        if (imageUrlInput) imageUrlInput.value = '';
        if (fileInput) fileInput.value = '';
        renderShowcasePreview('');
      });
    }
  }

  function openShowcaseEdit(item) {
    if (!formDrawer) return;
    formDrawer.style.display = 'block';
    if (formTitle) formTitle.textContent = item ? `Edit Showcase Photo: ${item.title}` : 'Add New Showcase Photo';
    if (feedback) feedback.textContent = '';

    if (editIdInput) editIdInput.value = item ? item.id : '';
    const titleEl = document.getElementById('showcaseTitle');
    if (titleEl) titleEl.value = item ? (item.title || '') : '';
    const capEl = document.getElementById('showcaseCaption');
    if (capEl) capEl.value = item ? (item.caption || '') : '';
    const formatEl = document.getElementById('showcaseTileFormat');
    if (formatEl) formatEl.value = item && item.tileWide ? 'true' : 'false';
    if (imageUrlInput) imageUrlInput.value = item ? (item.image || '') : '';
    currentShowcaseBase64 = '';

    const saveBtn = document.getElementById('btnSaveShowcase');
    if (saveBtn) saveBtn.textContent = item ? 'Update Showcase Photo' : 'Save & Publish Photo';

    renderShowcasePreview(item ? item.image : '');
    formDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Open & Cancel button listeners
  if (btnOpenModal && !btnOpenModal._bound) {
    btnOpenModal._bound = true;
    btnOpenModal.addEventListener('click', () => {
      showcaseForm?.reset();
      openShowcaseEdit(null);
    });
  }

  if (btnCancel && !btnCancel._bound) {
    btnCancel._bound = true;
    btnCancel.addEventListener('click', () => {
      formDrawer.style.display = 'none';
      showcaseForm?.reset();
      currentShowcaseBase64 = '';
      renderShowcasePreview('');
      if (feedback) feedback.textContent = '';
    });
  }

  // File upload and dropzone listeners
  if (dropzone && !dropzone._bound) {
    dropzone._bound = true;
    dropzone.addEventListener('click', () => fileInput?.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleShowcaseFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput && !fileInput._bound) {
    fileInput._bound = true;
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleShowcaseFile(fileInput.files[0]);
      }
    });
  }

  if (imageUrlInput && !imageUrlInput._bound) {
    imageUrlInput._bound = true;
    imageUrlInput.addEventListener('input', () => {
      const url = imageUrlInput.value.trim();
      if (url && !currentShowcaseBase64) {
        renderShowcasePreview(url);
      }
    });
  }

  function handleShowcaseFile(file) {
    if (!file.type.startsWith('image/')) {
      showFeedback(feedback, 'Only image files (JPG, PNG, WebP) are supported.', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentShowcaseBase64 = e.target.result;
      renderShowcasePreview(currentShowcaseBase64);
      if (imageUrlInput) imageUrlInput.value = '';
    };
    reader.readAsDataURL(file);
  }

  // Form Submit (Save / Edit Photo)
  if (showcaseForm && !showcaseForm._bound) {
    showcaseForm._bound = true;
    showcaseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getAdminToken();
      if (!token) {
        showFeedback(feedback, 'Session expired. Please log in again.', true);
        return;
      }

      const id = editIdInput.value.trim();
      const isEdit = Boolean(id);
      const title = document.getElementById('showcaseTitle').value.trim();
      const caption = document.getElementById('showcaseCaption').value.trim();
      const tileWide = document.getElementById('showcaseTileFormat').value === 'true';
      const imgUrl = imageUrlInput.value.trim();

      if (!title || !caption) {
        showFeedback(feedback, 'Please enter photo title and subtitle.', true);
        return;
      }

      if (!currentShowcaseBase64 && !imgUrl) {
        showFeedback(feedback, 'Please upload a photo or provide an image URL.', true);
        return;
      }

      const payload = {
        title,
        caption,
        tileWide,
        image: imgUrl || undefined,
        imageBase64: currentShowcaseBase64 || undefined,
        filename: currentShowcaseBase64 ? `showcase_${Date.now()}.jpg` : undefined,
      };

      const submitBtn = document.getElementById('btnSaveShowcase');
      if (submitBtn) setButtonBusy(submitBtn, true);

      try {
        const csrfToken = await getCsrfToken();
        const url = isEdit ? `/api/admin/showcase/${encodeURIComponent(id)}` : '/api/admin/showcase';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(payload),
        });

        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) {
          throw new Error(result.message || 'Failed to save showcase photo.');
        }

        showFeedback(feedback, result.message || 'Photo saved successfully!', false);
        setAdminStatus(`Showcase photograph "${title}" saved.`, false);

        if (isEdit && result.item) {
          const idx = showcaseItems.findIndex((i) => i.id === id);
          if (idx !== -1) showcaseItems[idx] = result.item;
        } else if (result.item) {
          showcaseItems.unshift(result.item);
        }

        renderShowcaseGrid(showcaseItems);

        setTimeout(() => {
          if (formDrawer) formDrawer.style.display = 'none';
          showcaseForm.reset();
          currentShowcaseBase64 = '';
          renderShowcasePreview('');
          if (feedback) feedback.textContent = '';
        }, 1200);

        // Also reload dashboard in background
        await loadAdminDashboard();
      } catch (err) {
        showFeedback(feedback, err.message, true);
      } finally {
        if (submitBtn) setButtonBusy(submitBtn, false);
      }
    });
  }

  async function deleteShowcaseItem(id) {
    const token = getAdminToken();
    if (!token) return;

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`/api/admin/showcase/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
      });
      const result = await readJsonResponse(res);
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete showcase photo.');
      }

      setAdminStatus('Showcase photo removed successfully.', false);
      showcaseItems = showcaseItems.filter((i) => i.id !== id);
      renderShowcaseGrid(showcaseItems);
      await loadAdminDashboard();
    } catch (err) {
      setAdminStatus(err.message, true);
    }
  }

  // Load showcase items if not already in data
  if (!showcaseItems.length) {
    fetch('/api/showcase')
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.items)) {
          showcaseItems = d.items;
          renderShowcaseGrid(showcaseItems);
        }
      })
      .catch(() => {});
  } else {
    renderShowcaseGrid(showcaseItems);
  }
}

// Public Gallery & Lightbox Initializer
function initPublicEventGallery() {
  const mediaTypeFilters = document.getElementById('galleryMediaTypes');
  const filters = document.getElementById('eventsGalleryFilters');
  const searchInput = document.getElementById('eventSearchInput');
  const countBadge = document.getElementById('eventCountBadge');
  const grid = document.getElementById('dynamicEventsGrid');
  const lightbox = document.getElementById('eventLightbox');
  const lightboxMediaWrap = document.querySelector('#eventLightbox .lightbox-img-wrap') || document.querySelector('#eventLightbox .lightbox-image-wrap');
  const lightboxBadge = document.getElementById('lightboxBadge');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxClose = document.getElementById('lightboxClose');

  // Upload Modal Elements
  const btnOpenUpload = document.getElementById('btnOpenGalleryUpload');
  const uploadModal = document.getElementById('galleryUploadModal');
  const uploadForm = document.getElementById('galleryUploadForm');
  const uploadDropzone = document.getElementById('galleryDropzone');
  const uploadFileInput = document.getElementById('galleryFileInput');
  const uploadPreviewBox = document.getElementById('galleryPreviewBox');
  const uploadMediaTypeSelect = document.getElementById('galleryMediaTypeSelect');
  const uploadFeedback = document.getElementById('galleryUploadFeedback');

  if (!grid) return;

  let allEvents = [];
  let currentMediaType = 'all';
  let currentCategory = 'all';
  let currentSearchQuery = '';
  let publicUploadImages = [];

  // Active Lightbox State
  let activeLightboxEvent = null;
  let activeLightboxIndex = 0;

  function syncDynamicCategoryFilters() {
    if (!filters) return;
    const existingButtons = Array.from(filters.querySelectorAll('.gallery-filter-btn'));
    const existingCategories = new Set(existingButtons.map((b) => (b.dataset.category || '').toLowerCase()));

    allEvents.forEach((item) => {
      const cat = (item.category || '').trim();
      if (cat && !existingCategories.has(cat.toLowerCase())) {
        existingCategories.add(cat.toLowerCase());
        const btn = document.createElement('button');
        btn.className = 'gallery-filter-btn';
        btn.type = 'button';
        btn.dataset.category = cat;
        btn.textContent = cat;
        filters.appendChild(btn);
      }
    });
  }

  // Public Gallery custom category toggle
  const galleryCategorySelect = document.getElementById('galleryCategorySelect');
  const galleryCustomCategoryWrap = document.getElementById('galleryCustomCategoryWrap');
  const galleryCustomCategory = document.getElementById('galleryCustomCategory');

  if (galleryCategorySelect && !galleryCategorySelect._customBound) {
    galleryCategorySelect._customBound = true;
    galleryCategorySelect.addEventListener('change', () => {
      if (galleryCategorySelect.value === '__custom__') {
        if (galleryCustomCategoryWrap) galleryCustomCategoryWrap.style.display = 'block';
        galleryCustomCategory?.setAttribute('required', '');
        galleryCustomCategory?.focus();
      } else {
        if (galleryCustomCategoryWrap) galleryCustomCategoryWrap.style.display = 'none';
        galleryCustomCategory?.removeAttribute('required');
        if (galleryCustomCategory) galleryCustomCategory.value = '';
      }
    });
  }

  async function fetchEvents() {
    try {
      const res = await fetch('/api/events');
      const data = await readJsonResponse(res);
      if (data.success && Array.isArray(data.events) && data.events.length > 0) {
        allEvents = data.events;
        syncDynamicCategoryFilters();
        applyFilters();
      }
    } catch (e) {
      console.warn('Could not load dynamic events from API', e);
    }
  }

  function applyFilters() {
    const q = currentSearchQuery.toLowerCase().trim();
    const filtered = allEvents.filter((item) => {
      const isVideo = item.mediaType === 'video' || (typeof item.videoUrl === 'string' && item.videoUrl.length > 0);
      const matchesMediaType = currentMediaType === 'all' || 
        (currentMediaType === 'video' && isVideo) || 
        (currentMediaType === 'image' && !isVideo);

      const matchesCat = currentCategory === 'all' || 
        String(item.category || '').toLowerCase() === currentCategory.toLowerCase();
      
      const matchesSearch = !q || 
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.institution || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q) ||
        String(item.category || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some((t) => String(t).toLowerCase().includes(q)));

      return matchesMediaType && matchesCat && matchesSearch;
    });

    if (countBadge) {
      const typeLabel = currentMediaType === 'video' ? 'Videos' : (currentMediaType === 'image' ? 'Photos' : 'Media Items');
      countBadge.textContent = `Showing ${filtered.length} of ${allEvents.length} ${typeLabel}`;
    }

    if (!filtered.length) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3.5rem 1rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px dashed var(--line);"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:0.75rem; color:var(--muted);"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><p style="margin:0; font-size:1.05rem; font-weight:700;">No media items match your criteria</p><p style="margin:0.35rem 0 0; font-size:0.85rem; color:var(--muted);">Try clearing your search or switching filter categories.</p></div>';
      return;
    }

    grid.innerHTML = filtered.map((item) => {
      const isVideo = item.mediaType === 'video' || (typeof item.videoUrl === 'string' && item.videoUrl.length > 0);
      const itemImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : ['assets/events/event_college_hackathon_lab.jpg']);
      const hasMultiplePhotos = !isVideo && itemImages.length > 1;

      return `
        <article class="event-card ${isVideo ? 'is-video-card' : ''}">
          <div class="event-image-wrap" role="button" tabindex="0" data-lightbox-id="${escapeHtml(item.id)}" title="Click to view full ${isVideo ? 'video' : 'photograph gallery'}">
            ${hasMultiplePhotos ? `
              <div class="event-slider" data-current-slide="0" data-total-slides="${itemImages.length}">
                <div class="event-slider-track">
                  ${itemImages.map((img, idx) => `
                    <img src="${escapeHtml(img)}" alt="${escapeHtml(item.title)} - Photo ${idx + 1}" class="event-slide-img ${idx === 0 ? 'is-active' : ''}" width="1024" height="576" loading="lazy" decoding="async">
                  `).join('')}
                </div>
                <button type="button" class="event-slider-btn prev-btn" aria-label="Previous photo" data-slide-nav="-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button type="button" class="event-slider-btn next-btn" aria-label="Next photo" data-slide-nav="1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <div class="event-slider-dots">
                  ${itemImages.map((_, idx) => `
                    <span class="slider-dot ${idx === 0 ? 'is-active' : ''}" data-slide-dot="${idx}" title="Photo ${idx + 1}"></span>
                  `).join('')}
                </div>
                <span class="event-slide-counter">📸 1/${itemImages.length}</span>
              </div>
            ` : `
              <img src="${escapeHtml(itemImages[0])}" alt="${escapeHtml(item.title)}" width="1024" height="576" loading="lazy" decoding="async">
            `}
            <span class="event-badge">${escapeHtml(item.institution || item.category)}</span>
            ${isVideo ? `
              <div class="video-play-overlay">
                <div class="video-play-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
              <span class="video-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Video ${escapeHtml(item.duration || '2:30')}</span>
            ` : ''}
          </div>
          <div class="event-body">
            <div class="event-meta">
              <span class="event-date"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${escapeHtml(item.category)}</span>
              <span class="event-attendees"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${escapeHtml(item.attendees || '500+ Attendees')}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <div class="event-footer">
              <div class="event-tags">
                ${(item.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
              </div>
              <a class="mini-btn" href="contact.html">Host at Campus <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach card slider navigation listeners
    grid.querySelectorAll('.event-slider').forEach((slider) => {
      const slides = slider.querySelectorAll('.event-slide-img');
      const dots = slider.querySelectorAll('.slider-dot');
      const counter = slider.querySelector('.event-slide-counter');
      const total = slides.length;
      let cur = 0;

      function updateSlide(idx) {
        if (total <= 1) return;
        cur = (idx + total) % total;
        slides.forEach((s, i) => s.classList.toggle('is-active', i === cur));
        dots.forEach((d, i) => d.classList.toggle('is-active', i === cur));
        if (counter) counter.textContent = `📸 ${cur + 1}/${total}`;
        slider.setAttribute('data-current-slide', cur);
      }

      slider.querySelectorAll('[data-slide-nav]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const dir = Number(btn.dataset.slideNav) || 1;
          updateSlide(cur + dir);
        });
      });

      slider.querySelectorAll('[data-slide-dot]').forEach((dot) => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const target = Number(dot.dataset.slideDot) || 0;
          updateSlide(target);
        });
      });

      // Swipe gestures for touch
      let startX = 0;
      slider.addEventListener('touchstart', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          startX = e.changedTouches[0].clientX;
        }
      }, { passive: true });

      slider.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const endX = e.changedTouches[0].clientX;
          const diff = startX - endX;
          if (Math.abs(diff) > 35) {
            if (diff > 0) updateSlide(cur + 1);
            else updateSlide(cur - 1);
          }
        }
      }, { passive: true });
    });

    // Attach click listeners for lightbox
    grid.querySelectorAll('.event-image-wrap').forEach((wrap) => {
      wrap.addEventListener('click', (e) => {
        // If clicking navigation buttons on slider, don't open modal
        if (e.target.closest('[data-slide-nav]') || e.target.closest('[data-slide-dot]')) {
          return;
        }
        const id = wrap.getAttribute('data-lightbox-id');
        const eventItem = allEvents.find((evt) => evt.id === id);
        const sliderEl = wrap.querySelector('.event-slider');
        const initialSlide = sliderEl ? (Number(sliderEl.getAttribute('data-current-slide')) || 0) : 0;
        if (eventItem) openEventLightbox(eventItem, initialSlide);
      });
      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          wrap.click();
        }
      });
    });
  }

  function getEmbedUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const str = url.trim();
    // YouTube
    const ytMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
    }
    // Vimeo
    const vimeoMatch = str.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    }
    // Direct or uploaded MP4 / WebM / video data URL
    return { type: 'video', src: str };
  }

  function openEventLightbox(eventItem, initialIndex = 0) {
    if (!lightbox || !lightboxMediaWrap) return;
    activeLightboxEvent = eventItem;
    activeLightboxIndex = initialIndex;

    const isVideo = eventItem.mediaType === 'video' || (typeof eventItem.videoUrl === 'string' && eventItem.videoUrl.length > 0);
    const images = Array.isArray(eventItem.images) && eventItem.images.length > 0 ? eventItem.images : (eventItem.image ? [eventItem.image] : ['assets/events/event_college_hackathon_lab.jpg']);

    if (isVideo) {
      const vidUrl = eventItem.videoUrl || eventItem.image || '';
      const embed = getEmbedUrl(vidUrl);
      if (embed && embed.type === 'iframe') {
        lightboxMediaWrap.innerHTML = `<iframe src="${escapeHtml(embed.src)}?autoplay=1" title="${escapeHtml(eventItem.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%; height:480px; border:none; border-radius:8px;"></iframe>`;
      } else if (embed && embed.type === 'video') {
        lightboxMediaWrap.innerHTML = `<video src="${escapeHtml(embed.src)}" poster="${escapeHtml(eventItem.image && !eventItem.image.endsWith('.mp4') ? eventItem.image : '')}" controls autoplay playsinline style="width:100%; max-height:520px; background:#000; border-radius:8px;"></video>`;
      }
    } else if (images.length > 1) {
      lightboxMediaWrap.innerHTML = `
        <div class="lightbox-slider" data-lightbox-index="${activeLightboxIndex}">
          <div class="lightbox-slide-stage">
            <button type="button" class="lightbox-nav-btn lb-prev" id="lbPrevBtn" aria-label="Previous photo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <img id="lightboxImg" src="${escapeHtml(images[activeLightboxIndex])}" alt="${escapeHtml(eventItem.title)} - Photo ${activeLightboxIndex + 1}" width="1024" height="576">
            <button type="button" class="lightbox-nav-btn lb-next" id="lbNextBtn" aria-label="Next photo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <span class="lightbox-counter-badge" id="lightboxCounter">📸 Photo ${activeLightboxIndex + 1} of ${images.length}</span>
          <div class="lightbox-thumbnails">
            ${images.map((img, i) => `
              <button type="button" class="lightbox-thumb-btn ${i === activeLightboxIndex ? 'is-active' : ''}" data-lb-thumb="${i}" title="View photo ${i + 1}">
                <img src="${escapeHtml(img)}" alt="Thumbnail ${i + 1}">
              </button>
            `).join('')}
          </div>
        </div>
      `;

      const lbPrev = lightboxMediaWrap.querySelector('#lbPrevBtn');
      const lbNext = lightboxMediaWrap.querySelector('#lbNextBtn');
      const lbImg = lightboxMediaWrap.querySelector('#lightboxImg');
      const lbCounter = lightboxMediaWrap.querySelector('#lightboxCounter');
      const lbThumbs = lightboxMediaWrap.querySelectorAll('[data-lb-thumb]');

      function setLightboxSlide(idx) {
        activeLightboxIndex = (idx + images.length) % images.length;
        if (lbImg) {
          lbImg.style.opacity = '0';
          lbImg.style.transform = 'scale(0.98)';
          setTimeout(() => {
            lbImg.src = images[activeLightboxIndex];
            lbImg.alt = `${eventItem.title} - Photo ${activeLightboxIndex + 1}`;
            lbImg.style.opacity = '1';
            lbImg.style.transform = 'scale(1)';
          }, 120);
        }
        if (lbCounter) lbCounter.textContent = `📸 Photo ${activeLightboxIndex + 1} of ${images.length}`;
        lbThumbs.forEach((tb, i) => tb.classList.toggle('is-active', i === activeLightboxIndex));
      }

      lbPrev?.addEventListener('click', (e) => {
        e.stopPropagation();
        setLightboxSlide(activeLightboxIndex - 1);
      });

      lbNext?.addEventListener('click', (e) => {
        e.stopPropagation();
        setLightboxSlide(activeLightboxIndex + 1);
      });

      lbThumbs.forEach((tb) => {
        tb.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = Number(tb.dataset.lbThumb) || 0;
          setLightboxSlide(target);
        });
      });

      // Swipe gestures on lightbox slider stage
      const sliderStage = lightboxMediaWrap.querySelector('.lightbox-slide-stage');
      if (sliderStage) {
        let lbStartX = 0;
        sliderStage.addEventListener('touchstart', (e) => {
          if (e.changedTouches && e.changedTouches[0]) {
            lbStartX = e.changedTouches[0].clientX;
          }
        }, { passive: true });

        sliderStage.addEventListener('touchend', (e) => {
          if (e.changedTouches && e.changedTouches[0]) {
            const lbEndX = e.changedTouches[0].clientX;
            const diff = lbStartX - lbEndX;
            if (Math.abs(diff) > 40) {
              if (diff > 0) setLightboxSlide(activeLightboxIndex + 1);
              else setLightboxSlide(activeLightboxIndex - 1);
            }
          }
        }, { passive: true });
      }
    } else {
      lightboxMediaWrap.innerHTML = `<img id="lightboxImg" src="${escapeHtml(images[0])}" alt="${escapeHtml(eventItem.title)}" width="1024" height="576" style="width:100%; height:auto; max-height:520px; object-fit:contain;">`;
    }

    if (lightboxBadge) lightboxBadge.textContent = (isVideo ? '▶ Video • ' : '📷 Photo • ') + (eventItem.institution || eventItem.category);
    if (lightboxTitle) lightboxTitle.textContent = eventItem.title;
    if (lightboxDesc) lightboxDesc.textContent = eventItem.description;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  // Keyboard controls for Lightbox (Left / Right arrows & Escape)
  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('active') || !activeLightboxEvent) return;
    const images = Array.isArray(activeLightboxEvent.images) && activeLightboxEvent.images.length > 0 ? activeLightboxEvent.images : [activeLightboxEvent.image];
    if (images.length <= 1) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const lbPrev = lightbox.querySelector('#lbPrevBtn');
      if (lbPrev) lbPrev.click();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const lbNext = lightbox.querySelector('#lbNextBtn');
      if (lbNext) lbNext.click();
    }
  });

  // Media Type Filter Tabs (All / Photos / Videos)
  mediaTypeFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.media-type-btn');
    if (!btn) return;
    mediaTypeFilters.querySelectorAll('.media-type-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentMediaType = btn.dataset.type || 'all';
    applyFilters();
  });

  // Category Filter Buttons
  filters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.gallery-filter-btn');
    if (!btn) return;
    filters.querySelectorAll('.gallery-filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category || 'all';
    applyFilters();
  });

  // Search Input Listener
  searchInput?.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    applyFilters();
  });

  // Lightbox Close Handlers
  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      activeLightboxEvent = null;
      // Stop video playback if playing
      const videoEl = lightbox.querySelector('video');
      if (videoEl) videoEl.pause();
      const iframeEl = lightbox.querySelector('iframe');
      if (iframeEl) iframeEl.src = '';
    }
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox?.classList.contains('active')) {
      closeLightbox();
    }
  });

  // Also bind picture gallery masonry tiles to lightbox
  function bindMasonryTiles() {
    document.querySelectorAll('.gallery-tile').forEach((tile) => {
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      if (tile._tileBound) return;
      tile._tileBound = true;
      tile.addEventListener('click', () => {
        const img = tile.querySelector('img');
        const h4 = tile.querySelector('h4');
        const p = tile.querySelector('p');
        if (img && lightbox && lightboxMediaWrap) {
          lightboxMediaWrap.innerHTML = `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || 'Gallery photo')}" style="width:100%; height:auto; max-height:520px; object-fit:contain;">`;
          if (lightboxBadge) lightboxBadge.textContent = 'Official Visual Showcase';
          if (lightboxTitle) lightboxTitle.textContent = h4 ? h4.textContent : 'Field Highlight';
          if (lightboxDesc) lightboxDesc.textContent = p ? p.textContent : '';
          lightbox.classList.add('active');
          lightbox.setAttribute('aria-hidden', 'false');
        }
      });
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tile.click();
        }
      });
    });
  }

  bindMasonryTiles();

  // Dynamically load updated showcase photos from API if available
  const masonryContainer = document.getElementById('pictureGalleryMasonry');
  if (masonryContainer) {
    fetch('/api/showcase')
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.items) && d.items.length > 0) {
          masonryContainer.innerHTML = d.items.map((item) => `
            <div class="gallery-tile ${item.tileWide ? 'tile-wide' : ''}" role="button" tabindex="0">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}" loading="lazy">
              <div class="gallery-tile-caption">
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(item.caption)}</p>
              </div>
            </div>
          `).join('');
          bindMasonryTiles();
        }
      })
      .catch(() => {});
  }

  // Upload Modal Open / Close Logic
  btnOpenUpload?.addEventListener('click', () => {
    if (uploadModal) {
      uploadModal.removeAttribute('hidden');
      uploadModal.classList.add('active');
      uploadModal.setAttribute('aria-hidden', 'false');
    }
  });

  document.querySelectorAll('[data-upload-close]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (uploadModal) {
        uploadModal.classList.remove('active');
        uploadModal.setAttribute('aria-hidden', 'true');
        uploadModal.setAttribute('hidden', '');
      }
    });
  });

  // Drag and drop & File Picker for Gallery Upload Form (Supporting Multiple Files)
  uploadDropzone?.addEventListener('click', () => uploadFileInput?.click());
  uploadDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = 'var(--green)';
  });
  uploadDropzone?.addEventListener('dragleave', () => {
    uploadDropzone.style.borderColor = '';
  });
  uploadDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = '';
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handlePublicMediaFiles(e.dataTransfer.files);
    }
  });

  uploadFileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length) {
      handlePublicMediaFiles(e.target.files);
    }
  });

  function renderPublicUploadPreview() {
    if (!uploadPreviewBox) return;
    if (!publicUploadImages.length) {
      uploadPreviewBox.style.display = 'none';
      uploadPreviewBox.innerHTML = '';
      return;
    }

    const isVideo = uploadMediaTypeSelect && uploadMediaTypeSelect.value === 'video';
    if (isVideo && publicUploadImages[0]) {
      uploadPreviewBox.style.display = 'block';
      uploadPreviewBox.innerHTML = `
        <div class="admin-preview-wrapper">
          <div class="admin-preview-img-container">
            <video src="${publicUploadImages[0]}" controls style="max-height: 190px; width: 100%; border-radius: 8px;"></video>
          </div>
          <div class="admin-preview-meta-row">
            <span>▶ Video Media Attached</span>
            <button type="button" class="admin-preview-delete-btn" id="btnPubClearEventVideo" title="Delete / Remove this video">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Delete Video
            </button>
          </div>
        </div>
      `;
      const clearVidBtn = uploadPreviewBox.querySelector('#btnPubClearEventVideo');
      if (clearVidBtn) {
        clearVidBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          publicUploadImages = [];
          if (uploadFileInput) uploadFileInput.value = '';
          renderPublicUploadPreview();
        });
      }
      return;
    }

    uploadPreviewBox.style.display = 'block';
    uploadPreviewBox.innerHTML = `
      <div class="multi-preview-grid">
        ${publicUploadImages.map((img, i) => `
          <div class="preview-thumb-item">
            <img src="${escapeHtml(img)}" alt="Upload thumb ${i + 1}">
            ${i === 0 ? '<span class="preview-thumb-primary">Cover</span>' : ''}
            <button type="button" class="preview-thumb-remove" data-remove-pub-thumb="${i}" title="Remove photo">&times;</button>
          </div>
        `).join('')}
      </div>
      <div class="admin-preview-meta-row" style="margin-top: 8px;">
        <span>📸 <b>${publicUploadImages.length}</b> ${publicUploadImages.length === 1 ? 'photo' : 'photos'} attached (First is cover)</span>
        <button type="button" class="admin-preview-delete-btn" id="btnPubClearAllPhotos" style="padding: 4px 10px; font-size: 0.76rem;" title="Delete and remove all attached photos">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          Clear All Photos
        </button>
      </div>
    `;

    uploadPreviewBox.querySelectorAll('[data-remove-pub-thumb]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const removeIdx = Number(btn.dataset.removePubThumb);
        publicUploadImages.splice(removeIdx, 1);
        renderPublicUploadPreview();
      });
    });

    const clearAllBtn = uploadPreviewBox.querySelector('#btnPubClearAllPhotos');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        publicUploadImages = [];
        if (uploadFileInput) uploadFileInput.value = '';
        renderPublicUploadPreview();
      });
    }
  }

  function handlePublicMediaFiles(files) {
    const fileList = Array.from(files);
    let isVideoEncountered = false;

    fileList.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        if (uploadFeedback) {
          uploadFeedback.className = 'form-feedback error';
          uploadFeedback.textContent = `File ${file.name} is too large. Maximum allowed size is 15MB.`;
        }
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const isImg = file.type.startsWith('image/');
      if (!isImg && !isVideo) return;

      if (isVideo) isVideoEncountered = true;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (isVideo) {
          publicUploadImages = [event.target.result];
          if (uploadMediaTypeSelect) uploadMediaTypeSelect.value = 'video';
        } else {
          publicUploadImages.push(event.target.result);
          if (uploadMediaTypeSelect && !isVideoEncountered) uploadMediaTypeSelect.value = 'image';
        }
        renderPublicUploadPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  // Upload Form Submit
  uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!uploadFeedback) return;

    uploadFeedback.className = 'form-feedback info';
    uploadFeedback.textContent = 'Uploading and processing media for gallery...';

    const formData = new FormData(uploadForm);
    const mediaType = formData.get('mediaType') || 'image';
    const title = formData.get('title');
    let category = formData.get('category');
    if (category === '__custom__') {
      category = (formData.get('customCategory') || document.getElementById('galleryCustomCategory')?.value || '').trim();
      if (!category) {
        uploadFeedback.className = 'form-feedback error';
        uploadFeedback.textContent = 'Please enter your custom event category.';
        document.getElementById('galleryCustomCategory')?.focus();
        return;
      }
    }
    const institution = formData.get('institution') || 'Robotree Partner Institution';
    const date = formData.get('date') || new Date().toISOString().split('T')[0];
    const attendees = formData.get('attendees') || '500+ Attendees';
    const duration = formData.get('duration') || (mediaType === 'video' ? '2:30' : '');
    const directUrl = formData.get('mediaUrl');
    const description = formData.get('description') || '';
    const tags = (formData.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean);
    const adminPasscode = formData.get('adminPasscode');

    const finalImages = publicUploadImages.length > 0 ? publicUploadImages : (directUrl ? [directUrl] : ['assets/events/event_college_hackathon_lab.jpg']);
    const primaryImage = finalImages[0] || 'assets/events/event_college_hackathon_lab.jpg';
    const videoPayload = mediaType === 'video' ? (publicUploadImages[0] || directUrl) : '';

    try {
      const csrf = await getCsrfToken();
      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        body: JSON.stringify({
          title,
          mediaType,
          category,
          institution,
          date,
          attendees,
          duration,
          image: primaryImage,
          images: finalImages,
          videoUrl: videoPayload,
          description,
          tags: tags.length ? tags : ['Robotics', 'STEM'],
          adminPasscode
        })
      });

      const data = await readJsonResponse(res);
      if (!res.ok || !data.success) {
        uploadFeedback.className = 'form-feedback error';
        uploadFeedback.textContent = data.message || 'Upload failed. Check admin passcode or file format.';
        return;
      }

      uploadFeedback.className = 'form-feedback success';
      uploadFeedback.textContent = `Success! Gallery item with ${finalImages.length} photo(s) published with sliding effect!`;
      uploadForm.reset();
      if (galleryCustomCategoryWrap) galleryCustomCategoryWrap.style.display = 'none';
      if (galleryCustomCategory) {
        galleryCustomCategory.removeAttribute('required');
        galleryCustomCategory.value = '';
      }
      publicUploadImages = [];
      renderPublicUploadPreview();

      // Reload gallery
      setTimeout(() => {
        fetchEvents();
        if (uploadModal) {
          uploadModal.classList.remove('active');
          uploadModal.setAttribute('hidden', '');
        }
      }, 1200);
    } catch (err) {
      uploadFeedback.className = 'form-feedback error';
      uploadFeedback.textContent = 'Network error while uploading. Please try again.';
    }
  });

  fetchEvents();
}

function renderActivityItem(activity) {
  return `
    <li class="${activity.status === 'FAILED' ? 'is-failed' : ''}">
      <strong>${escapeHtml(formatActivityType(activity.type))}</strong>
      <span>${escapeHtml(activity.user)} - ${escapeHtml(activity.details)}</span>
      <time>${escapeHtml(formatDate(activity.timestamp))}</time>
    </li>
  `;
}

function renderUserItem(user) {
  const isEmployee = (user.role || '').toUpperCase() === 'EMPLOYEE';
  const roleDisplay = isEmployee ? 'Team / Employee' : (user.role || 'Student');
  const roleBadgeClass = isEmployee ? '' : 'badge-blue';
  const roleIcon = isEmployee ? '🛡️' : '🎓';

  return `
    <li class="admin-data-card" id="admin-user-${escapeHtml(user.id)}">
      <div class="admin-card-header">
        <div class="admin-card-avatar" style="display:flex;align-items:center;justify-content:center;font-weight:bold;color:${isEmployee ? 'var(--green)' : '#60a5fa'};background:${isEmployee ? 'rgba(120,216,68,0.1)' : 'rgba(59,130,246,0.1)'};font-size:1.05rem;border:2px solid ${isEmployee ? 'var(--green)' : 'rgba(59,130,246,0.5)'};">
          ${escapeHtml(getInitials(user.name || user.email || 'RU'))}
        </div>
        <div class="admin-card-title-group" style="flex:1;min-width:0;">
          <h4 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(user.name || 'Unnamed Account')}">${escapeHtml(user.name || 'Unnamed Account')}</h4>
          <p style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-secondary);font-size:0.8rem;" title="${escapeHtml(user.email || '')}">${escapeHtml(user.email || 'N/A')}</p>
        </div>
      </div>
      <div class="admin-card-body" style="font-size:0.85rem;line-height:1.4;margin:4px 0;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <span style="color:var(--text-muted);font-size:0.75rem;">Access Level:</span>
          <span class="admin-card-badge ${roleBadgeClass}" style="font-size:0.72rem;">
            ${roleIcon} ${escapeHtml(roleDisplay)}
          </span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span style="color:var(--text-muted);font-size:0.75rem;">Registered:</span>
          <time style="color:var(--text-secondary);font-size:0.75rem;">${escapeHtml(formatDate(user.createdAt))}</time>
        </div>
      </div>
      <div class="admin-card-actions" style="display:flex;gap:6px;flex-wrap:wrap;padding-top:8px;">
        ${isEmployee ? `
          <button type="button" class="btn btn-secondary btn-sm" data-toggle-role="${escapeHtml(user.id)}" data-target-role="Student" title="Revoke employee portal access" style="font-size:0.75rem;padding:0.35rem 0.65rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
            Revoke Access
          </button>
        ` : `
          <button type="button" class="btn btn-secondary btn-sm" data-toggle-role="${escapeHtml(user.id)}" data-target-role="EMPLOYEE" title="Grant employee portal access" style="font-size:0.75rem;padding:0.35rem 0.65rem;color:var(--green);border-color:rgba(120,216,68,0.4);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
            Grant Team Access
          </button>
        `}
        <button type="button" class="btn btn-danger btn-sm" data-delete-user="${escapeHtml(user.id)}" data-user-email="${escapeHtml(user.email)}" title="Permanently delete user account" style="font-size:0.75rem;padding:0.35rem 0.65rem;margin-left:auto;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete User
        </button>
      </div>
    </li>
  `;
}

function getAdminToken() {
  return sessionStorage.getItem('robotree_admin_token') || '';
}

function setAdminStatus(message, isError = false) {
  showFeedback(adminStatus, message, isError);
  const dashboardStatus = document.getElementById('adminDashboardStatus');
  if (dashboardStatus) {
    showFeedback(dashboardStatus, message, isError);
    if (!isError && message) {
      setTimeout(() => {
        if (dashboardStatus.textContent === message) {
          dashboardStatus.textContent = '';
        }
      }, 4000);
    }
  }
}

function initExperiment() {
  let variant = localStorage.getItem('robotree_ab_variant');
  if (!variant) {
    variant = Math.random() >= 0.5 ? 'B' : 'A';
    localStorage.setItem('robotree_ab_variant', variant);
  }
  document.documentElement.dataset.variant = variant;
}

async function loadTeam() {
  if (!teamGrid) return;
  try {
    const data = await getJson('/api/team');
    allTeamMembers = data.members || fallbackTeam;
  } catch {
    allTeamMembers = fallbackTeam;
  }
  renderTeam(allTeamMembers);
  initTeamFilters();
}

function renderTeam(members) {
  if (!teamGrid) return;
  if (!members || members.length === 0) {
    teamGrid.innerHTML = '<div class="team-empty-state"><p>No team members found matching your search.</p></div>';
    return;
  }

  teamGrid.innerHTML = members.map((member) => {
    const initials = getInitials(member.name);
    const isLeadership = member.category === 'leadership';
    const founderCardClass = isLeadership ? ' featured founder-card' : '';
    
    const leadershipCrownBadge = isLeadership ? `
      <div class="founder-crown-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
        <span>Leadership</span>
      </div>` : '';

    const emailHtml = member.email ? `
      <div class="team-email">
        <button type="button" class="team-email-btn" data-email="${escapeHtml(member.email)}" data-name="${escapeHtml(member.name)}" data-role="${escapeHtml(member.role)}" data-initials="${escapeHtml(initials)}" data-image="${escapeHtml(member.image || '')}" title="Send message to ${escapeHtml(member.name)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          <span>Send Email</span>
        </button>
      </div>` : '';

    const skillTags = (member.skills || [String(member.role).split('&')[0].trim()]).slice(0, 6).map((skill) => `
      <span class="skill-tag">${escapeHtml(skill)}</span>
    `).join('');

    const photoHtml = member.image ? `
      <div class="team-photo has-photo">
        <div class="team-photo-frame">
          <img src="${escapeHtml(member.image)}" alt="${escapeHtml(member.name)}" class="team-avatar-img" onerror="this.closest('.team-photo').classList.remove('has-photo'); this.style.display='none'; this.nextElementSibling.style.display='grid';" loading="lazy">
          <span class="team-avatar-initials" style="display: none;">${escapeHtml(initials)}</span>
        </div>
        <span class="team-dept-badge">${escapeHtml(member.department || 'Leadership')}</span>
      </div>
    ` : `
      <div class="team-photo">
        <div class="team-photo-frame">
          <span class="team-avatar-initials">${escapeHtml(initials)}</span>
        </div>
        <span class="team-dept-badge">${escapeHtml(member.department || 'Training')}</span>
      </div>
    `;

    return `
      <article class="team-card${founderCardClass}" data-category="${escapeHtml(member.category || 'other')}" data-name="${escapeHtml(member.name).toLowerCase()}">
        ${photoHtml}
        <div class="team-card-body">
          ${leadershipCrownBadge}
          <p class="team-kicker">${escapeHtml(member.role)}</p>
          <h3 class="team-member-name">${escapeHtml(member.name)}</h3>
          
          <div class="team-meta-pills">
            <span class="meta-pill meta-qual" title="Qualification">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              ${escapeHtml(member.qualification || 'B.TECH')}
            </span>
            <span class="meta-pill meta-exp" title="Experience">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${escapeHtml(member.experience || '1+ Year')}
            </span>
          </div>

          <p class="team-bio">${escapeHtml(member.responsibilities)}</p>
          
          ${emailHtml}

          <div class="team-tags">
            ${skillTags}
          </div>
        </div>
      </article>
    `;
  }).join('');

  refreshIcons();
  initRevealAnimations(teamGrid);
}

function initTeamEmailModal() {
  const modal = document.getElementById('teamEmailModal');
  const modalAvatar = document.getElementById('modalMemberAvatar');
  const modalName = document.getElementById('modalMemberName');
  const modalRole = document.getElementById('modalMemberRole');
  const modalEmail = document.getElementById('modalMemberEmail');
  const copyBtn = document.getElementById('copyMemberEmailBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const openGmailBtn = document.getElementById('openGmailBtn');
  const openOutlookBtn = document.getElementById('openOutlookBtn');
  const openYahooBtn = document.getElementById('openYahooBtn');
  const openMailtoBtn = document.getElementById('openMailtoBtn');
  const directMsgForm = document.getElementById('directTeamMsgForm');
  const feedback = document.getElementById('teamMsgFeedback');

  let currentEmail = 'rksingh.singh957@gmail.com';
  let currentName = 'Rahul Kumar Singh';

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.team-email-btn, .team-email-link');
    if (!btn) return;
    e.preventDefault();

    currentEmail = btn.dataset.email || 'info@robotree.org';
    currentName = btn.dataset.name || 'Team Member';
    const role = btn.dataset.role || 'Robotics Faculty';
    const initials = btn.dataset.initials || 'RT';
    const image = btn.dataset.image || '';

    if (modalAvatar) {
      if (image) {
        modalAvatar.innerHTML = `<img src="${escapeHtml(image)}" alt="${escapeHtml(currentName)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        modalAvatar.textContent = initials;
      }
    }
    if (modalName) modalName.textContent = currentName;
    if (modalRole) modalRole.textContent = role;
    if (modalEmail) modalEmail.textContent = currentEmail;

    const subject = `Inquiry for ${currentName} - Robotree Robotics`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(currentEmail)}&su=${encodeURIComponent(subject)}`;
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(currentEmail)}&subject=${encodeURIComponent(subject)}`;
    const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(currentEmail)}&subj=${encodeURIComponent(subject)}`;

    if (openGmailBtn) openGmailBtn.href = gmailUrl;
    if (openOutlookBtn) openOutlookBtn.href = outlookUrl;
    if (openYahooBtn) openYahooBtn.href = yahooUrl;

    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'form-feedback';
    }
    openModal('teamEmailModal');
  });

  openMailtoBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentEmail) return;
    const subject = `Inquiry for ${currentName} - Robotree Robotics`;
    const mailtoUrl = `mailto:${currentEmail}?subject=${encodeURIComponent(subject)}`;

    // Copy to clipboard as safety backup
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentEmail);
      }
    } catch {}

    // Trigger system email app
    window.location.href = mailtoUrl;

    if (feedback) {
      feedback.innerHTML = `<span>📬 Launching default email app for <strong>${escapeHtml(currentEmail)}</strong>.<br><small style="opacity:0.85;">(Email address copied to clipboard as backup)</small></span>`;
      feedback.className = 'form-feedback is-success';
    }
  });

  copyBtn?.addEventListener('click', async () => {
    if (!currentEmail) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentEmail);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = currentEmail;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      if (copyBtnText) copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        if (copyBtnText) copyBtnText.textContent = 'Copy';
      }, 2000);
    } catch {
      if (copyBtnText) copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        if (copyBtnText) copyBtnText.textContent = 'Copy';
      }, 2000);
    }
  });

  directMsgForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const senderName = document.getElementById('teamMsgSenderName')?.value?.trim();
    const senderEmail = document.getElementById('teamMsgSenderEmail')?.value?.trim();
    const subject = document.getElementById('teamMsgSubject')?.value?.trim();
    const body = document.getElementById('teamMsgBody')?.value?.trim();

    if (!senderName || !senderEmail || !body) {
      showFeedback(feedback, 'Please fill in all required fields.', true);
      return;
    }

    try {
      showFeedback(feedback, `Sending message to ${currentName}...`, false);
      await postJson('/api/contact', {
        name: senderName,
        email: senderEmail,
        phone: 'Online Contact',
        interest: `Message to ${currentName} (${currentEmail}) - Subject: ${subject}`,
        message: body
      });

      showFeedback(feedback, `✅ Message sent successfully to ${currentName}! We will get back to you shortly.`, false);
      directMsgForm.reset();
      setTimeout(() => {
        if (modal) closeModal(modal);
      }, 2500);
    } catch (err) {
      showFeedback(feedback, err.message || 'Failed to send message. Please use Gmail or standard mail.', true);
    }
  });
}

function initTeamFilters() {
  const filterBtns = document.querySelectorAll('.team-filter-btn');
  const searchInput = document.getElementById('teamSearchInput');

  // Dynamically update section heading if present
  const teamHeading = document.querySelector('.team-heading-row h2');
  if (teamHeading) {
    teamHeading.textContent = `All ${allTeamMembers.length} Team Members`;
  }

  // Dynamically update filter badge counts from live data
  filterBtns.forEach((btn) => {
    const cat = btn.dataset.filter || 'all';
    const countEl = btn.querySelector('.filter-count');
    if (countEl) {
      if (cat === 'all') {
        countEl.textContent = allTeamMembers.length;
      } else {
        countEl.textContent = allTeamMembers.filter((m) => m.category === cat).length;
      }
    }
  });

  let activeCategory = 'all';
  let searchTerm = '';

  function applyFilters() {
    let filtered = allTeamMembers;

    if (activeCategory !== 'all') {
      filtered = filtered.filter((m) => m.category === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((m) => {
        const nameMatch = (m.name || '').toLowerCase().includes(term);
        const roleMatch = (m.role || '').toLowerCase().includes(term);
        const deptMatch = (m.department || '').toLowerCase().includes(term);
        const skillMatch = (m.skills || []).some((s) => s.toLowerCase().includes(term));
        return nameMatch || roleMatch || deptMatch || skillMatch;
      });
    }

    renderTeam(filtered);
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.filter || 'all';
      applyFilters();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value || '';
    applyFilters();
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLIC COURSES CATALOG & DYNAMIC ENROLLMENT SYSTEM
   ══════════════════════════════════════════════════════════════════════════ */
async function loadPublicCourses() {
  const courseGrid = document.getElementById('courseGrid');
  if (!courseGrid) return;

  try {
    const data = await getJson('/api/courses');
    allCoursesList = (data && data.courses && data.courses.length) ? data.courses : [];
  } catch (err) {
    console.warn('Could not fetch live courses from /api/courses, using fallback catalog:', err.message);
  }

  renderPublicCourses(allCoursesList);
  initCourseFilters();
  initCourseEnrollModal();
}

function renderPublicCourses(courses) {
  const courseGrid = document.getElementById('courseGrid');
  if (!courseGrid) return;

  if (!courses || courses.length === 0) {
    courseGrid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 2.5rem;">No courses currently found matching this category.</p>';
    return;
  }

  courseGrid.innerHTML = courses.map((c) => {
    const rawImg = c.image || 'assets/courses/course_basic_robotics.jpg';
    const imgSrc = (rawImg.startsWith('http') || rawImg.startsWith('data:') || rawImg.startsWith('/')) ? rawImg : '/' + rawImg;
    const priceNum = Number(c.price || 0);
    const formattedPrice = `₹${priceNum.toLocaleString('en-IN')}`;
    const durationText = escapeHtml(c.duration || '6 Weeks');
    const levelText = escapeHtml(c.level || 'Intermediate');
    const categoryText = escapeHtml(c.category || 'Robotics & AI');

    const modulesHtml = (c.modules && c.modules.length) ? `
      <ul class="course-modules-list" style="list-style: none; padding: 0; margin: 0 0 1rem; width: 100%; display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: var(--text-muted);">
        ${c.modules.slice(0, 3).map((m) => `
          <li style="display: flex; align-items: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--green); flex-shrink: 0;"><polyline points="20 6 9 17 4 12"/></svg>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(m)}</span>
          </li>
        `).join('')}
        ${c.modules.length > 3 ? `<li style="color: var(--green); font-size: 0.75rem; font-weight: 600;">+ ${c.modules.length - 3} more curriculum modules</li>` : ''}
      </ul>
    ` : '';

    return `
      <article class="offer-card" id="course-${escapeHtml(c.id)}" data-category="${categoryText}">
        <div class="course-card-image">
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(c.title)}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'200\\' fill=\\'%2308141e\\' viewBox=\\'0 0 400 200\\'><rect width=\\'400\\' height=\\'200\\' fill=\\'%2308141e\\'/><circle cx=\\'200\\' cy=\\'100\\' r=\\'36\\' fill=\\'none\\' stroke=\\'%2378d844\\' stroke-width=\\'3\\'/><text x=\\'200\\' y=\\'108\\' text-anchor=\\'middle\\' fill=\\'%2378d844\\' font-family=\\'sans-serif\\' font-size=\\'18\\' font-weight=\\'bold\\'>Robotree STEM</text></svg>'">
        </div>
        <div style="display: flex; gap: 6px; margin-bottom: 0.6rem; flex-wrap: wrap;">
          <span class="admin-card-badge" style="background: rgba(120, 216, 68, 0.15); color: var(--green); font-size: 0.75rem;">${categoryText}</span>
          <span class="admin-card-badge badge-purple" style="font-size: 0.75rem;">${levelText}</span>
          <span class="admin-card-badge" style="background: rgba(255,255,255,0.08); color: var(--text-secondary); font-size: 0.75rem;">${durationText}</span>
        </div>
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.description || '')}</p>
        ${modulesHtml}
        <div class="card-footer">
          <span class="price-tag">${formattedPrice}</span>
          <button class="btn btn-primary course-enroll-btn" type="button"
            data-course-id="${escapeHtml(c.id)}"
            data-course="${escapeHtml(c.title)}"
            data-price="${formattedPrice}"
            data-duration="${durationText}">
            Enroll Now
          </button>
        </div>
      </article>
    `;
  }).join('');

  refreshIcons();
}

function initCourseFilters() {
  const filterBar = document.getElementById('courseFiltersBar');
  if (!filterBar || filterBar._bound) return;
  filterBar._bound = true;

  const buttons = filterBar.querySelectorAll('[data-course-filter]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.dataset.courseFilter;
      if (filterVal === 'all') {
        renderPublicCourses(allCoursesList);
      } else {
        const filtered = allCoursesList.filter((c) => {
          const cat = (c.category || '').toLowerCase();
          const title = (c.title || '').toLowerCase();
          const q = filterVal.toLowerCase();
          return cat.includes(q) || title.includes(q);
        });
        renderPublicCourses(filtered);
      }
    });
  });
}

function initCourseEnrollModal() {
  const modal = document.getElementById('courseEnrollModal');
  const form = document.getElementById('courseEnrollForm');
  const closeBtn = document.getElementById('closeCourseEnrollModal');
  const modalTitle = document.getElementById('courseEnrollTitle');
  const priceDisplay = document.getElementById('enrollCoursePrice');
  const durationDisplay = document.getElementById('enrollCourseDuration');
  const idInput = document.getElementById('enrollCourseId');
  const nameInput = document.getElementById('enrollCourseName');
  const feedback = document.getElementById('courseEnrollFeedback');

  if (!modal || modal._bound) return;
  modal._bound = true;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.course-enroll-btn');
    if (!btn) return;
    e.preventDefault();

    const courseTitle = btn.dataset.course || 'Robotics Program';
    const courseId = btn.dataset.courseId || '';
    const coursePrice = btn.dataset.price || '₹3,999';
    const courseDuration = btn.dataset.duration || '6 Weeks';

    if (modalTitle) modalTitle.textContent = `Enroll in ${courseTitle}`;
    if (priceDisplay) priceDisplay.textContent = coursePrice.startsWith('₹') ? coursePrice : `₹${coursePrice}`;
    if (durationDisplay) durationDisplay.textContent = courseDuration;
    if (idInput) idInput.value = courseId;
    if (nameInput) nameInput.value = courseTitle;
    if (feedback) feedback.textContent = '';

    modal.hidden = false;
    modal.classList.add('show');
    document.getElementById('enrollStudentName')?.focus();
  });

  const closeModal = () => {
    modal.hidden = true;
    modal.classList.remove('show');
    if (feedback) feedback.textContent = '';
  };

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btnSubmitEnroll');
    if (submitBtn) setButtonBusy(submitBtn, true);

    const candidateName = document.getElementById('enrollStudentName')?.value?.trim();
    const candidatePhone = document.getElementById('enrollStudentPhone')?.value?.trim();
    const candidateEmail = document.getElementById('enrollStudentEmail')?.value?.trim();
    const institution = document.getElementById('enrollStudentInstitution')?.value?.trim();
    const grade = document.getElementById('enrollStudentGrade')?.value || '';
    const message = document.getElementById('enrollStudentMessage')?.value?.trim();
    const courseName = nameInput?.value || 'Robotics Course';
    const price = priceDisplay?.textContent || '';

    try {
      showFeedback(feedback, 'Submitting enrollment application...', false);

      const payload = {
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        interest: `Course Enrollment: ${courseName} (${price})${institution ? ' - ' + institution : ''}`,
        message: `Grade: ${grade}. ${message ? message : ''}`.trim()
      };

      await postJson('/api/inquiries', payload);
      showFeedback(feedback, '🎉 Enrollment received! Our academic coordinator will contact you on WhatsApp/Phone shortly.', false);

      setTimeout(() => {
        form.reset();
        closeModal();
      }, 2500);
    } catch (err) {
      showFeedback(feedback, err.message || 'Failed to submit application. Please check your details.', true);
    } finally {
      if (submitBtn) setButtonBusy(submitBtn, false);
    }
  });
}

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await readJsonResponse(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

async function postJson(url, payload, headers = {}) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let csrfToken = '';
    try {
      csrfToken = await CSRFManager.getToken();
    } catch (_) {
      csrfToken = 'rb_token_' + Math.random().toString(36).slice(2, 10);
    }

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          ...headers
        },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      throw new Error('Unable to connect to server. Please ensure the backend is running or check your connection.');
    }

    const data = await readJsonResponse(response);
    if (response.status === 403 && /security token/i.test(data.message || '') && attempt === 0) {
      CSRFManager.reset();
      continue;
    }
    if (!response.ok || data.success === false) {
      const errMsg = data.message || (response.status >= 500 ? 'Server is temporarily unavailable. Please try again later.' : 'Request failed.');
      throw new Error(errMsg);
    }
    return data;
  }
  throw new Error('Could not verify security token. Please refresh the page and try again.');
}

export { readJsonResponse };

function formToPayload(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, sanitizePlainText(String(value), 1200)])
  );
}

function setButtonBusy(button, busy, text) {
  if (!button) return;
  if (busy) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    if (text) button.textContent = text;
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
  }
}

function showFeedback(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? '#ef4444' : 'var(--green)';
}

function showAppStatus(message, isError = false) {
  if (!appStatus) return;
  appStatus.hidden = false;
  appStatus.textContent = message;
  appStatus.classList.toggle('is-error', isError);
  window.setTimeout(() => {
    appStatus.hidden = true;
  }, 6000);
}

function getInitials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatActivityType(type) {
  return String(type || 'Activity')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function refreshIcons() {
  createIcons(document);
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  localStorage.setItem('robotree_theme', document.documentElement.dataset.theme);

  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    themeToggle.innerHTML = isLight
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  }
}

function initRevealAnimations(root = document) {
  const revealTargets = root.querySelectorAll(
    '.offer-card, .program-card, .team-card, .section-heading, .trusted-band, .stats-strip > div, .contact-grid > div, .contact-form, .newsletter, .admin-card'
  );

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => {
      el.classList.remove('reveal-init');
      el.classList.add('reveal-visible');
      el.style.transitionDelay = '';
      delete el.dataset.revealReady;
      delete el.dataset.revealDelay;
    });
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const delay = Number(entry.target.dataset.revealDelay || 0);
        entry.target.classList.add('reveal-visible');
        obs.unobserve(entry.target);

        window.setTimeout(() => {
          entry.target.style.transitionDelay = '';
          entry.target.style.willChange = 'auto';
          delete entry.target.dataset.revealReady;
          delete entry.target.dataset.revealDelay;
        }, delay + 750);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -70px 0px' });
  }

  revealTargets.forEach((el, idx) => {
    if (el.classList.contains('reveal-visible') || el.dataset.revealReady === 'true') return;

    const delay = (idx % 6) * 60;
    el.classList.add('reveal-init');
    el.dataset.revealReady = 'true';
    el.dataset.revealDelay = String(delay);
    if (delay > 0) el.style.transitionDelay = `${delay}ms`;
    revealObserver.observe(el);
  });
}

function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stats-strip strong');
  const statsContainer = document.querySelector('.stats-strip');
  let hasAnimatedStats = false;

  if (!statsContainer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasAnimatedStats) {
        hasAnimatedStats = true;
        animateStats();
      }
    });
  }, { threshold: 0.3 });

  statsObserver.observe(statsContainer);

  function animateStats() {
    statNumbers.forEach((el) => {
      const rawText = el.textContent.trim();
      const match = rawText.match(/^([0-9,]+)(\+?)/);
      if (!match) return;

      const targetNum = parseInt(match[1].replace(/,/g, ''), 10);
      const suffix = match[2] || '';
      const duration = 1400;
      const startTime = performance.now();

      function updateCounter(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        el.textContent = Math.floor(easeProgress * targetNum).toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          el.textContent = rawText;
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }
}

function trackEvent(event, extra = {}) {
  if (localStorage.getItem('robotree_cookie_consent') !== 'all') return;
  const variant = localStorage.getItem('robotree_ab_variant') || 'A';
  postJson('/api/analytics/event', {
    event,
    variant,
    path: window.location.pathname,
    ...extra
  }).catch(() => {});
}

/* ============================================================
   20 ESSENTIAL WEBSITE ENHANCEMENTS IMPLEMENTATION
   ============================================================ */

/* 1. Scroll Progress Bar & Floating Back to Top */
function initScrollProgressBarAndFloatingToTop() {
  let progressBar = document.getElementById('scrollProgressBar');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'scrollProgressBar';
    progressBar.className = 'scroll-progress-bar';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', '0');
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');
    progressBar.setAttribute('aria-label', 'Reading progress');
    document.body.prepend(progressBar);
  }

  let toTopBtn = document.getElementById('toTop');
  if (!toTopBtn) {
    toTopBtn = document.createElement('button');
    toTopBtn.id = 'toTop';
    toTopBtn.className = 'footer-to-top is-floating';
    toTopBtn.type = 'button';
    toTopBtn.setAttribute('aria-label', 'Scroll back to top');
    toTopBtn.setAttribute('title', 'Scroll back to top');
    toTopBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
    toTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(toTopBtn);
  } else if (!toTopBtn.classList.contains('is-floating')) {
    toTopBtn.classList.add('is-floating');
  }

  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      progressBar.setAttribute('aria-valuenow', Math.round(progress));
    }

    if (toTopBtn) {
      if (scrollTop > 260) {
        toTopBtn.classList.add('is-visible');
      } else {
        toTopBtn.classList.remove('is-visible');
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* 2. Site Quick Search Dialog (Ctrl+K) */
function initSiteSearch() {
  let searchModal = document.getElementById('searchModal');
  if (!searchModal) {
    searchModal = document.createElement('div');
    searchModal.id = 'searchModal';
    searchModal.className = 'modal-backdrop search-modal-backdrop';
    searchModal.setAttribute('role', 'dialog');
    searchModal.setAttribute('aria-modal', 'true');
    searchModal.setAttribute('aria-labelledby', 'searchModalTitle');
    searchModal.hidden = true;
    searchModal.innerHTML = `
      <article class="modal-card search-modal-card">
        <div class="search-modal-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="siteSearchInput" placeholder="Search courses, Junior Innovation Lab, workshops, locations..." autocomplete="off" aria-label="Search website content">
          <button class="modal-close" id="searchModalClose" type="button" aria-label="Close search modal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <h2 id="searchModalTitle" class="visually-hidden">Site Search</h2>
        <div class="search-modal-results" id="searchResults" role="region" aria-live="polite"></div>
        <div class="search-modal-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>Enter</kbd> to select</span>
          <span><kbd>Esc</kbd> to close</span>
        </div>
      </article>
    `;
    document.body.appendChild(searchModal);
  }

  const searchClose = document.getElementById('searchModalClose');
  const searchInput = document.getElementById('siteSearchInput');
  const searchResults = document.getElementById('searchResults');

  if (!searchModal || !searchInput) return;

  const searchableIndex = [
    { title: 'Robotree Junior Innovation Lab (RJIL)', category: 'Programs', url: 'index.html#programs', desc: 'Turnkey STEM & Robotics Lab setup for schools Grade 1-12 with 40+ sessions/year.' },
    { title: 'College & University Programs', category: 'Programs', url: 'index.html#programs', desc: 'Internships, certifications, hackathons and Industry 4.0 Labs for engineers.' },
    { title: 'Corporate Training & Upskilling', category: 'Programs', url: 'index.html#programs', desc: 'Workforce technical workshops in Robotics, AI, IoT, automation and computer vision.' },
    { title: 'Turnkey Lab Setup & Consulting', category: 'Services', url: 'services.html', desc: 'Turnkey STEM, AI, ATL and Drone labs with equipment, curriculum and trainers.' },
    { title: 'Drone Aviation & Quadcopters', category: 'Courses', url: 'courses.html', desc: 'Autonomous drone flight, aerodynamics, telemetry, sensors and piloting.' },
    { title: '3D Printing & Rapid Prototyping', category: 'Courses', url: 'courses.html', desc: 'CAD design, slicing, FDM 3D printing and digital fabrication.' },
    { title: 'Artificial Intelligence & Computer Vision', category: 'Courses', url: 'courses.html', desc: 'Machine learning, OpenCV, object recognition and neural nets for robotics.' },
    { title: 'IoT & Smart Automation Systems', category: 'Courses', url: 'courses.html', desc: 'ESP32, sensor networks, cloud telemetry, MQTT and smart automation.' },
    { title: 'Robotics Starter & Microcontrollers', category: 'Courses', url: 'courses.html', desc: 'Arduino, circuit building, sensors, actuators, and motors for young minds.' },
    { title: 'Junior Innovation Lab (RJIL) State Launch', category: 'Events', url: 'index.html#events', desc: 'Keynote showcase demonstrating 3D printers, autonomous quadcopters, VR and AI.' },
    { title: 'Our Core Mentors & Team', category: 'Team', url: 'team.html', desc: 'Meet our 17 engineering mentors, robotics specialists and educators.' },
    { title: 'Certificate Verification Portal', category: 'Tools', url: 'certificate.html', desc: 'Verify official Robotree student workshop and course credentials.' },
    { title: 'Sentrum Mall Innovation Hub Asansol', category: 'Location', url: 'contact.html', desc: 'Sentrum Mall, 3rd Floor, Shristinagar, Asansol - 713305, West Bengal.' },
    { title: 'Frequently Asked Questions (FAQ)', category: 'Support', url: 'index.html#faq', desc: 'Common queries on RJIL eligibility, lab equipment, certifications and admissions.' }
  ];

  function openSearch() {
    searchModal.hidden = false;
    document.body.classList.add('modal-open');
    searchInput.value = '';
    renderResults(searchableIndex.slice(0, 6));
    setTimeout(() => searchInput.focus(), 50);
  }

  function closeSearch() {
    searchModal.hidden = true;
    if (!document.querySelector('.modal-backdrop:not([hidden])')) {
      document.body.classList.remove('modal-open');
    }
  }

  function renderResults(items) {
    if (!searchResults) return;
    if (!items.length) {
      searchResults.innerHTML = `<div class="search-no-results">No matching results found. Try searching "RJIL", "Drone", "Python" or "Lab".</div>`;
      return;
    }

    searchResults.innerHTML = items.map(item => `
      <a class="search-result-item" href="${item.url}">
        <div class="search-result-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <div class="search-result-info">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.desc)}</p>
        </div>
        <span class="search-result-badge">${escapeHtml(item.category)}</span>
      </a>
    `).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(link => {
      link.addEventListener('click', () => closeSearch());
    });
  }

  const searchBtn = document.getElementById('siteSearchBtn');
  searchBtn?.addEventListener('click', openSearch);
  searchClose?.addEventListener('click', closeSearch);

  searchModal?.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearch();
  });

  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderResults(searchableIndex.slice(0, 6));
      return;
    }
    const matched = searchableIndex.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
    renderResults(matched);
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchModal.hidden) {
        openSearch();
      } else {
        closeSearch();
      }
    }
    if (e.key === 'Escape' && !searchModal.hidden) {
      closeSearch();
    }
  });
}

/* 3. Floating Contact & WhatsApp Action Menu */
function initFloatingContact() {
  let container = document.getElementById('floatingContact');
  if (!container) {
    container = document.createElement('aside');
    container.id = 'floatingContact';
    container.className = 'floating-contact';
    container.setAttribute('aria-label', 'Quick contact and consultation options');
    container.innerHTML = `
      <button class="floating-contact-btn" id="floatingContactTrigger" type="button" aria-label="Open quick contact menu" aria-expanded="false" title="Chat with Robotree Lab Advisor">
        <svg class="icon-chat" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        <svg class="icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span class="floating-contact-badge" aria-hidden="true">1</span>
      </button>
      <div class="floating-contact-menu" id="floatingContactMenu" hidden>
        <div class="floating-contact-header">
          <strong>Robotree Advisory</strong>
          <p>Instant guidance on Labs, Courses &amp; Admissions</p>
        </div>
        <div class="floating-contact-links">
          <a class="floating-link whatsapp" href="https://wa.me/917979038537?text=Hello%20Robotree%2C%20I%20want%20to%20know%20more%20about%20Junior%20Innovation%20Lab%20and%20programs" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.12.82.83-3.04-.19-.31a8.196 8.196 0 0 1-1.26-4.46c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32z"/></svg>
            <span>Chat on WhatsApp<small>+91 7979038537</small></span>
          </a>
          <a class="floating-link call" href="tel:+917979038537">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>Call Lab Admissions<small>Mon-Sat, 9am - 7pm</small></span>
          </a>
          <a class="floating-link email" href="mailto:info@robotree.org">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>Email Inquiry<small>info@robotree.org</small></span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  }

  const trigger = document.getElementById('floatingContactTrigger');
  const menu = document.getElementById('floatingContactMenu');
  if (!trigger || !menu) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = container.classList.toggle('is-open');
    menu.hidden = !isOpen;
    trigger.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && container.classList.contains('is-open')) {
      container.classList.remove('is-open');
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* 4. Universal Password Field Visibility Toggle */
function initPasswordVisibilityToggles() {
  const passwordInputs = document.querySelectorAll('input[type="password"], input[data-password-toggle="true"]');

  passwordInputs.forEach(input => {
    if (input.dataset.hasToggle === 'true') return;
    input.dataset.hasToggle = 'true';
    input.dataset.passwordToggle = 'true';

    let wrap = input.closest('.password-field-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'password-field-wrap';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Show password');
    toggleBtn.setAttribute('title', 'Show password');
    toggleBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      toggleBtn.setAttribute('title', isPassword ? 'Hide password' : 'Show password');

      if (isPassword) {
        toggleBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      } else {
        toggleBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    });

    wrap.appendChild(toggleBtn);
  });
}

/* 5. One-Click Copy Buttons */
function initCopyButtons() {
  let toast = document.querySelector('.copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>Copied to clipboard!</span>`;
    document.body.appendChild(toast);
  }

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const textToCopy = btn.dataset.copy;
      if (!textToCopy) return;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const ta = document.createElement('textarea');
          ta.value = textToCopy;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }

        btn.classList.add('is-copied');
        toast.classList.add('is-active');

        setTimeout(() => {
          btn.classList.remove('is-copied');
        }, 1600);

        setTimeout(() => {
          toast.classList.remove('is-active');
        }, 2200);
      } catch (err) {
        console.warn('Copy failed:', err);
      }
    });
  });
}

/* 6. Marketing UTM Tracking & Storage */
function initUtmTracking() {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const utmData = {};
  let found = false;

  utmKeys.forEach(key => {
    const val = params.get(key);
    if (val) {
      utmData[key] = sanitizePlainText(val, 100);
      found = true;
    }
  });

  if (found) {
    try {
      sessionStorage.setItem('robotree_utm', JSON.stringify(utmData));
    } catch {}
  }
}

function getStoredUtm() {
  try {
    const raw = sessionStorage.getItem('robotree_utm');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* 7. Institutional Partner College Category Tabs */
function initCollegeTabs() {
  const tabs = document.querySelectorAll('.college-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const parentBar = tab.closest('.college-filter-bar') || tab.parentElement;
      const section = tab.closest('section') || document;
      const allTabsInGroup = parentBar.querySelectorAll('.college-tab');
      
      allTabsInGroup.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.getAttribute('data-filter');
      const cards = section.querySelectorAll('.college-card');
      
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = '';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* 8. Interactive & Smooth Continuous Marquee Rotation Engine */
function initMarqueeRotate() {
  const wrappers = document.querySelectorAll('.trusted-marquee-wrapper');
  if (!wrappers.length) return;

  wrappers.forEach(wrapper => {
    const tracks = wrapper.querySelectorAll('.trusted-marquee-track');
    if (!tracks.length) return;

    // Connect controller buttons if present in the parent container
    const container = wrapper.closest('.trusted-band') || wrapper.parentElement;
    const reverseBtn = container.querySelector('#btnMarqueeReverse') || container.querySelector('.btn-reverse');
    const pauseBtn = container.querySelector('#btnMarqueePause') || container.querySelector('.btn-pause');
    const speedBtn = container.querySelector('#btnMarqueeSpeed') || container.querySelector('.btn-speed');
    const liveChip = container.querySelector('.marquee-live-chip');
    const statusText = container.querySelector('.marquee-status-text');

    let isReversed = false;
    let isPaused = false;
    let speedIndex = 0; // 0: Normal (26s), 1: Fast (13s), 2: Gentle (38s)
    const speeds = [
      { duration: '26s', label: 'Speed: Normal' },
      { duration: '13s', label: 'Speed: Fast' },
      { duration: '38s', label: 'Speed: Gentle' }
    ];

    const applySpeed = (dur) => {
      tracks.forEach(track => {
        track.style.animationDuration = dur;
      });
    };

    if (reverseBtn) {
      reverseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isReversed = !isReversed;
        wrapper.classList.toggle('is-reversed', isReversed);
        reverseBtn.setAttribute('aria-pressed', String(isReversed));
        if (statusText) {
          statusText.textContent = isPaused ? 'Auto-Rotation Paused' : (isReversed ? 'Reverse Rotation Active' : 'Continuous Auto-Rotation Active');
        }
      });
    }

    if (pauseBtn) {
      const pauseIcon = pauseBtn.querySelector('.icon-pause');
      const playIcon = pauseBtn.querySelector('.icon-play');
      const label = pauseBtn.querySelector('.ctrl-label');

      pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isPaused = !isPaused;
        wrapper.classList.toggle('is-paused', isPaused);
        pauseBtn.setAttribute('aria-pressed', String(isPaused));

        if (pauseIcon && playIcon) {
          pauseIcon.style.display = isPaused ? 'none' : '';
          playIcon.style.display = isPaused ? 'inline-block' : 'none';
        }
        if (label) {
          label.textContent = isPaused ? 'Play' : 'Pause';
        }
        if (liveChip) {
          liveChip.classList.toggle('is-paused', isPaused);
        }
        if (statusText) {
          statusText.textContent = isPaused ? 'Auto-Rotation Paused' : (isReversed ? 'Reverse Rotation Active' : 'Continuous Auto-Rotation Active');
        }
      });
    }

    if (speedBtn) {
      const speedLabel = speedBtn.querySelector('.ctrl-speed-text') || speedBtn;
      speedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        speedIndex = (speedIndex + 1) % speeds.length;
        const current = speeds[speedIndex];
        applySpeed(current.duration);
        if (speedLabel) speedLabel.textContent = current.label;
      });
    }

    // Touch swipe gesture support for mobile
    let touchStartX = 0;
    wrapper.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        isReversed = (diff > 0);
        wrapper.classList.toggle('is-reversed', isReversed);
        if (reverseBtn) {
          reverseBtn.setAttribute('aria-pressed', String(isReversed));
        }
        if (statusText) {
          statusText.textContent = isPaused ? 'Auto-Rotation Paused' : (isReversed ? 'Reverse Rotation Active' : 'Continuous Auto-Rotation Active');
        }
      }
    }, { passive: true });
  });
}

/** Public Hardware Store Client Subsystem (Catalog, Cart Drawer, Checkout, WhatsApp) */
function initStoreClient() {
  const storeGrid = document.getElementById('storeGrid');
  const catPills = document.querySelectorAll('.store-cat-pill');
  const searchInput = document.getElementById('storeSearchInput');
  const sortSelect = document.getElementById('storeSortSelect');
  const statusBanner = document.getElementById('storeCatalogStatus');

  // Cart Drawer Elements
  const cartTriggerBtn = document.getElementById('openCartDrawerBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartDrawerBackdrop');
  const closeCartBtn = document.getElementById('closeCartDrawerBtn');
  const cartItemsList = document.getElementById('cartDrawerItemsList');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const cartDrawerItemCount = document.getElementById('cartDrawerItemCount');
  const cartSubtotalEl = document.getElementById('cartSubtotalAmount');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const startShoppingBtn = document.getElementById('cartStartShoppingBtn');

  // Checkout Modal Elements
  const openCheckoutBtn = document.getElementById('openCheckoutModalBtn');
  const checkoutModal = document.getElementById('storeCheckoutModal');
  const closeCheckoutBtn = document.getElementById('closeCheckoutModalBtn');
  const checkoutSummaryBox = document.getElementById('checkoutOrderSummaryBox');
  const checkoutForm = document.getElementById('storeCheckoutForm');
  const checkoutFeedback = document.getElementById('orderCheckoutFeedback');
  const btnSubmitOrder = document.getElementById('btnSubmitStoreOrder');
  const btnOrderWhatsApp = document.getElementById('btnOrderWhatsApp');
  const successState = document.getElementById('checkoutSuccessState');
  const successOrderId = document.getElementById('successOrderId');
  const successWhatsAppLink = document.getElementById('successWhatsAppLink');
  const successDoneBtn = document.getElementById('successDoneBtn');

  // Quick View Modal Elements
  const qvModal = document.getElementById('productQuickViewModal');
  const qvCloseBtn = document.getElementById('closeQuickViewModalBtn');
  const qvImage = document.getElementById('qvImage');
  const qvBadge = document.getElementById('qvBadge');
  const qvSku = document.getElementById('qvSku');
  const qvTitle = document.getElementById('qvTitle');
  const qvPrice = document.getElementById('qvPrice');
  const qvOrigPrice = document.getElementById('qvOrigPrice');
  const qvStockTag = document.getElementById('qvStockTag');
  const qvDesc = document.getElementById('qvDesc');
  const qvFeaturesList = document.getElementById('qvFeaturesList');
  const qvQtyInput = document.getElementById('qvQtyInput');
  const qvQtyMinus = document.getElementById('qvQtyMinus');
  const qvQtyPlus = document.getElementById('qvQtyPlus');
  const qvAddToCartBtn = document.getElementById('qvAddToCartBtn');

  let currentQvProduct = null;
  let allProducts = [];
  let activeCategory = 'all';
  let searchQuery = '';
  let sortBy = 'featured';

  // CART PERSISTENCE (LocalStorage)
  const CART_KEY = 'robotree_store_cart_v1';
  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
    updateCartUI();
  }

  function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
        image: product.image || 'assets/store/kit_4wd_robot.jpg',
        sku: product.sku || product.id,
        category: product.category,
        quantity: Math.max(1, quantity),
      });
    }
    saveCart(cart);
    openCartDrawer();
  }

  function updateCartQty(id, delta) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      const idx = cart.indexOf(item);
      cart.splice(idx, 1);
    }
    saveCart(cart);
  }

  function removeFromCart(id) {
    const cart = getCart().filter((i) => i.id !== id);
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  function updateCartUI() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cartCountBadge) cartCountBadge.textContent = totalItems;
    if (cartDrawerItemCount) cartDrawerItemCount.textContent = `(${totalItems} item${totalItems === 1 ? '' : 's'})`;
    if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal.toLocaleString()}`;

    if (!cartItemsList) return;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="cart-empty-view">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p>Your hardware cart is currently empty.</p>
          <button class="btn btn-primary btn-sm" id="cartStartShoppingBtnEmpty" type="button">Explore Catalog</button>
        </div>
      `;
      const btn = document.getElementById('cartStartShoppingBtnEmpty');
      if (btn) btn.addEventListener('click', closeCartDrawer);
      if (openCheckoutBtn) openCheckoutBtn.disabled = true;
      return;
    }

    if (openCheckoutBtn) openCheckoutBtn.disabled = false;

    cartItemsList.innerHTML = cart.map((item) => `
      <div class="cart-item-row" data-cart-id="${escapeHtml(item.id)}">
        <img class="cart-item-thumb" src="${escapeHtml(item.image)}" alt="" onerror="this.src='assets/store/kit_4wd_robot.jpg'">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${escapeHtml(item.title)}</h4>
          <div class="cart-item-price-unit">₹${item.price.toLocaleString()} each</div>
          <div class="cart-item-controls">
            <div class="cart-qty-pill">
              <button type="button" class="cart-qty-btn minus" data-cart-action="minus" data-id="${escapeHtml(item.id)}">&minus;</button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button type="button" class="cart-qty-btn plus" data-cart-action="plus" data-id="${escapeHtml(item.id)}">&plus;</button>
            </div>
            <strong class="cart-item-subtotal">₹${(item.price * item.quantity).toLocaleString()}</strong>
            <button type="button" class="cart-remove-btn" data-cart-action="remove" data-id="${escapeHtml(item.id)}" title="Remove item" aria-label="Remove item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    cartItemsList.querySelectorAll('[data-cart-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.cartAction;
        const id = btn.dataset.id;
        if (action === 'minus') updateCartQty(id, -1);
        if (action === 'plus') updateCartQty(id, 1);
        if (action === 'remove') removeFromCart(id);
      });
    });
  }

  function openCartDrawer() {
    if (cartDrawer) {
      cartDrawer.hidden = false;
      cartDrawer.classList.add('is-open');
    }
    if (cartBackdrop) cartBackdrop.hidden = false;
    document.body.classList.add('drawer-open');
  }

  function closeCartDrawer() {
    if (cartDrawer) {
      cartDrawer.classList.remove('is-open');
      setTimeout(() => { cartDrawer.hidden = true; }, 250);
    }
    if (cartBackdrop) cartBackdrop.hidden = true;
    document.body.classList.remove('drawer-open');
  }

  if (cartTriggerBtn) cartTriggerBtn.addEventListener('click', openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);
  if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
  if (startShoppingBtn) startShoppingBtn.addEventListener('click', closeCartDrawer);

  updateCartUI();

  if (!storeGrid) return;

  async function loadStoreProducts() {
    try {
      const res = await fetch('/api/store/products');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          allProducts = data.products;
          renderCatalog();
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch store products:', e);
    }

    try {
      const res = await fetch('/api/v1/store/products');
      if (res.ok) {
        const data = await res.json();
        if (data && data.products) {
          allProducts = data.products;
          renderCatalog();
        }
      }
    } catch {}
  }

  function getFilteredProducts() {
    let prods = [...allProducts];

    if (activeCategory && activeCategory !== 'all') {
      const catClean = activeCategory.toLowerCase().replace(/[-_\s]+/g, '');
      prods = prods.filter((p) => {
        const pClean = (p.category || '').toLowerCase().replace(/[-_\s]+/g, '');
        return pClean === catClean || (p.category || '').toLowerCase().includes(activeCategory.toLowerCase());
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      prods = prods.filter((p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-asc') {
      prods.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      prods.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      prods.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      prods.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return prods;
  }

  function renderCatalog() {
    const list = getFilteredProducts();

    if (list.length === 0) {
      storeGrid.innerHTML = `
        <div class="store-empty-catalog" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 12px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3 style="color: var(--text); margin-bottom: 6px;">No products match your search</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Try adjusting your keywords or selecting another category.</p>
          <button class="btn btn-secondary btn-sm" id="btnResetStoreFilters" type="button" style="margin-top: 12px;">Reset Filters</button>
        </div>
      `;
      const btnReset = document.getElementById('btnResetStoreFilters');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          activeCategory = 'all';
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          catPills.forEach((p) => p.classList.toggle('is-active', p.dataset.storeCat === 'all'));
          renderCatalog();
        });
      }
      return;
    }

    storeGrid.innerHTML = list.map((p) => {
      const inStock = p.inStock !== false;
      const disc = p.originalPrice && p.originalPrice > p.price
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : 0;
      const features = Array.isArray(p.features) ? p.features.slice(0, 3) : [];

      return `
        <article class="store-card ${!inStock ? 'is-out-of-stock' : ''}" data-product-id="${escapeHtml(p.id)}">
          <div class="store-card-image-wrap">
            <img src="${escapeHtml(p.image || 'assets/store/kit_4wd_robot.jpg')}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.src='assets/store/kit_4wd_robot.jpg'">
            ${disc > 0 ? `<span class="store-discount-badge">${disc}% OFF</span>` : ''}
            <span class="store-stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
              ${inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div class="store-card-body">
            <span class="store-card-cat">${escapeHtml(p.category)}</span>
            <h3 class="store-card-title">${escapeHtml(p.title)}</h3>
            <p class="store-card-sku">SKU: ${escapeHtml(p.sku || p.id)}</p>

            <div class="store-card-price-row">
              <strong class="store-card-price">₹${Number(p.price).toLocaleString()}</strong>
              ${p.originalPrice ? `<span class="store-card-orig-price">₹${Number(p.originalPrice).toLocaleString()}</span>` : ''}
            </div>

            <p class="store-card-desc">${escapeHtml(p.description || '')}</p>

            ${features.length > 0 ? `
              <ul class="store-card-specs">
                ${features.map(f => `<li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ${escapeHtml(f)}</li>`).join('')}
              </ul>
            ` : ''}

            <div class="store-card-actions">
              <button class="btn btn-secondary btn-sm store-btn-qv" data-qv-id="${escapeHtml(p.id)}" type="button">Quick View</button>
              <button class="btn btn-primary btn-sm store-btn-add" data-add-id="${escapeHtml(p.id)}" type="button" ${!inStock ? 'disabled' : ''}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    storeGrid.querySelectorAll('.store-btn-add').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.addId;
        const prod = allProducts.find((p) => p.id === pid);
        if (prod) addToCart(prod, 1);
      });
    });

    storeGrid.querySelectorAll('.store-btn-qv').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.qvId;
        const prod = allProducts.find((p) => p.id === pid);
        if (prod) openQuickView(prod);
      });
    });
  }

  catPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      catPills.forEach((p) => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      activeCategory = pill.dataset.storeCat || 'all';
      renderCatalog();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderCatalog();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderCatalog();
    });
  }

  function openQuickView(prod) {
    currentQvProduct = prod;
    if (qvImage) qvImage.src = prod.image || 'assets/store/kit_4wd_robot.jpg';
    if (qvBadge) qvBadge.textContent = prod.category;
    if (qvSku) qvSku.textContent = `SKU: ${prod.sku || prod.id}`;
    if (qvTitle) qvTitle.textContent = prod.title;
    if (qvPrice) qvPrice.textContent = `₹${Number(prod.price).toLocaleString()}`;
    if (qvOrigPrice) {
      qvOrigPrice.textContent = prod.originalPrice ? `₹${Number(prod.originalPrice).toLocaleString()}` : '';
    }
    const inStock = prod.inStock !== false;
    if (qvStockTag) {
      qvStockTag.textContent = inStock ? 'In Stock' : 'Out of Stock';
      qvStockTag.className = `qv-stock-tag ${inStock ? 'in-stock' : 'out-of-stock'}`;
    }
    if (qvDesc) qvDesc.textContent = prod.description || '';
    if (qvFeaturesList) {
      const feats = Array.isArray(prod.features) ? prod.features : [];
      qvFeaturesList.innerHTML = feats.map(f => `<li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ${escapeHtml(f)}</li>`).join('');
    }
    if (qvQtyInput) qvQtyInput.value = '1';
    if (qvAddToCartBtn) qvAddToCartBtn.disabled = !inStock;

    if (qvModal) {
      qvModal.hidden = false;
      document.body.classList.add('modal-open');
    }
  }

  function closeQuickView() {
    if (qvModal) {
      qvModal.hidden = true;
      document.body.classList.remove('modal-open');
    }
  }

  if (qvCloseBtn) qvCloseBtn.addEventListener('click', closeQuickView);
  if (qvModal && !qvModal._boundBackdrop) {
    qvModal._boundBackdrop = true;
    qvModal.addEventListener('click', (e) => {
      if (e.target === qvModal) closeQuickView();
    });
  }
  if (qvQtyMinus) {
    qvQtyMinus.addEventListener('click', () => {
      if (qvQtyInput) qvQtyInput.value = Math.max(1, Number(qvQtyInput.value || 1) - 1);
    });
  }
  if (qvQtyPlus) {
    qvQtyPlus.addEventListener('click', () => {
      if (qvQtyInput) qvQtyInput.value = Math.min(99, Number(qvQtyInput.value || 1) + 1);
    });
  }
  if (qvAddToCartBtn) {
    qvAddToCartBtn.addEventListener('click', () => {
      if (!currentQvProduct) return;
      const qty = Math.max(1, Number(qvQtyInput?.value || 1));
      addToCart(currentQvProduct, qty);
      closeQuickView();
    });
  }

  if (openCheckoutBtn) {
    openCheckoutBtn.addEventListener('click', () => {
      const cart = getCart();
      if (!cart.length) return alert('Your cart is empty.');
      closeCartDrawer();

      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (checkoutSummaryBox) {
        checkoutSummaryBox.innerHTML = `
          <div class="checkout-summary-head">
            <strong>Selected Hardware Items (${cart.length}):</strong>
            <span style="color: var(--green); font-weight: 800;">Total: ₹${subtotal.toLocaleString()}</span>
          </div>
          <div class="checkout-summary-list">
            ${cart.map(item => `
              <div class="checkout-summary-item">
                <span>${escapeHtml(item.title)} &times; ${item.quantity}</span>
                <strong>₹${(item.price * item.quantity).toLocaleString()}</strong>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (successState) successState.hidden = true;
      if (checkoutForm) checkoutForm.hidden = false;
      if (checkoutFeedback) checkoutFeedback.textContent = '';
      if (checkoutModal) {
        checkoutModal.hidden = false;
        document.body.classList.add('modal-open');
      }
    });
  }

  function closeStoreCheckoutModal() {
    if (checkoutModal) {
      checkoutModal.hidden = true;
      document.body.classList.remove('modal-open');
    }
  }

  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeStoreCheckoutModal);
  if (successDoneBtn) successDoneBtn.addEventListener('click', closeStoreCheckoutModal);
  if (checkoutModal && !checkoutModal._boundBackdrop) {
    checkoutModal._boundBackdrop = true;
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) closeStoreCheckoutModal();
    });
  }

  if (checkoutForm && !checkoutForm._bound) {
    checkoutForm._bound = true;
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cart = getCart();
      if (!cart.length) return showFeedback(checkoutFeedback, 'Cart is empty.', true);

      const name = document.getElementById('orderCustName').value.trim();
      const phone = document.getElementById('orderCustPhone').value.trim();
      const email = document.getElementById('orderCustEmail').value.trim();
      const institution = document.getElementById('orderCustInstitution')?.value.trim() || '';
      const address = document.getElementById('orderCustAddress').value.trim();
      const notes = document.getElementById('orderCustNotes')?.value.trim() || '';

      if (!name || !phone || !email || !address) {
        return showFeedback(checkoutFeedback, 'Please fill in all required fields marked with *', true);
      }

      setButtonBusy(btnSubmitOrder, true, 'Submitting Order...');
      try {
        const csrfToken = await getCsrfToken();
        const payload = {
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          customerAddress: `${address}${institution ? ' (' + institution + ')' : ''}`,
          notes,
          items: cart.map(i => ({ productId: i.id, title: i.title, price: i.price, quantity: i.quantity }))
        };

        const res = await fetch('/api/store/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(payload)
        });

        const result = await readJsonResponse(res);
        if (!res.ok || !result.success) throw new Error(result.message || 'Failed to place order.');

        const orderId = result.order?.id || 'ORD-' + Date.now();
        const total = result.order?.totalAmount || cart.reduce((s, i) => s + i.price * i.quantity, 0);

        const waMsg = encodeURIComponent(
          `*Robotree Hardware Order Reference:* ${orderId}\n` +
          `*Customer Name:* ${name}\n` +
          `*Phone:* ${phone}\n` +
          `*Email:* ${email}\n` +
          `*Delivery Address:* ${address}\n\n` +
          `*Order Items:*\n` +
          cart.map(i => `• ${i.title} x${i.quantity} = Rs. ${(i.price * i.quantity).toLocaleString()}`).join('\n') +
          `\n\n*Total Order Value:* Rs. ${total.toLocaleString()}\n` +
          (notes ? `*Notes:* ${notes}\n\n` : '\n') +
          `Please confirm receipt and estimated delivery.`
        );

        if (successOrderId) successOrderId.textContent = orderId;
        if (successWhatsAppLink) successWhatsAppLink.href = `https://wa.me/917908034945?text=${waMsg}`;

        clearCart();

        checkoutForm.hidden = true;
        if (successState) successState.hidden = false;
      } catch (err) {
        showFeedback(checkoutFeedback, err.message, true);
      } finally {
        setButtonBusy(btnSubmitOrder, false);
      }
    });
  }

  if (btnOrderWhatsApp && !btnOrderWhatsApp._bound) {
    btnOrderWhatsApp._bound = true;
    btnOrderWhatsApp.addEventListener('click', () => {
      const cart = getCart();
      if (!cart.length) return alert('Your cart is empty.');

      const name = document.getElementById('orderCustName').value.trim() || 'Prospective Student';
      const phone = document.getElementById('orderCustPhone').value.trim() || 'N/A';
      const email = document.getElementById('orderCustEmail').value.trim() || 'N/A';
      const address = document.getElementById('orderCustAddress').value.trim() || 'Campus Pickup';
      const notes = document.getElementById('orderCustNotes')?.value.trim() || '';
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const waMsg = encodeURIComponent(
        `*Robotree Hardware Quote & Order Inquiry*\n` +
        `*Customer Name:* ${name}\n` +
        `*Contact:* ${phone} / ${email}\n` +
        `*Delivery/Pickup Address:* ${address}\n\n` +
        `*Selected Hardware Items:*\n` +
        cart.map(i => `• ${i.title} x${i.quantity} (Rs. ${(i.price * i.quantity).toLocaleString()})`).join('\n') +
        `\n\n*Estimated Total:* Rs. ${total.toLocaleString()}\n` +
        (notes ? `*Special Request:* ${notes}\n\n` : '\n') +
        `Please confirm availability, educational discount, and dispatch date.`
      );

      window.open(`https://wa.me/917908034945?text=${waMsg}`, '_blank');
    });
  }

  loadStoreProducts();
}

/** Branch-Wise Training Filter Tabs Subsystem */
function initBranchTabs() {
  const tabBtns = document.querySelectorAll('.branch-tab-btn');
  const courseCards = document.querySelectorAll('.branch-course-card');

  if (!tabBtns.length || !courseCards.length) return;

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetBranch = btn.dataset.branch || 'all';

      tabBtns.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      courseCards.forEach((card) => {
        const cardBranch = card.dataset.branch;
        if (targetBranch === 'all' || cardBranch === targetBranch) {
          card.style.display = '';
          card.removeAttribute('hidden');
        } else {
          card.style.display = 'none';
          card.setAttribute('hidden', '');
        }
      });
    });
  });
}




