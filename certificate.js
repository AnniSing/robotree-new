const params = new URLSearchParams(window.location.search);
const defaults = {
  name: 'Rahul Sharma',
  course: 'FREE Robotics Workshop for Children (Class 2 to 7)',
  date: '26TH JULY, 2026',
  time: '11:00 AM TO 1:00 PM',
  venue: 'ROBOTREE ASANSOL',
  ref_id: `RBT-WS-2026-${Math.floor(1000 + Math.random() * 9000)}`
};

const values = Object.fromEntries(
  Object.entries(defaults).map(([key, fallback]) => [key, clean(params.get(key) || fallback, 140)])
);

const setElementText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

setElementText('certStudentName', values.name.toUpperCase());
setElementText('certCourseTitle', values.course);
setElementText('certDateDisplay', values.date.toUpperCase());
setElementText('certTimeDisplay', values.time.toUpperCase());
setElementText('certRefIdDisplay', values.ref_id.toUpperCase());

const venue = document.getElementById('certVenueDisplay');
if (venue) {
  const strong = venue.querySelector('strong');
  if (strong) strong.textContent = values.venue.toUpperCase();
}

document.title = `Certificate - ${values.name} | Robotree Robotics LLP`;

document.getElementById('printCertificate')?.addEventListener('click', () => window.print());
document.getElementById('closeCertificate')?.addEventListener('click', () => window.close());

function clean(value, maxLength) {
  return String(value || '')
    .trim()
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .slice(0, maxLength);
}
