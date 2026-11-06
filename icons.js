/* Small self-hosted icon renderer for production CSP and offline reliability. */

const iconPaths = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'arrow-right': '<path d="M5 12h14M13 5l7 7-7 7"/>',
  'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  'play-circle': '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
  boxes: '<path d="m12 2 7 4v7l-7 4-7-4V6l7-4Z"/><path d="M5 6l7 4 7-4M12 10v7"/><path d="m5 13 7 4 7-4"/>',
  'users-round': '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'badge-check': '<path d="m12 2 2.4 2.2 3.2-.1.6 3.1 2.4 2.2-1.4 2.9.6 3.1-3 1.5-1.4 2.9-3.4-.5-3.4.5-1.4-2.9-3-1.5.6-3.1-1.4-2.9 2.4-2.2.6-3.1 3.2.1L12 2Z"/><path d="m8 12 2.5 2.5L16 9"/>',
  bot: '<rect x="5" y="8" width="14" height="10" rx="2"/><path d="M12 8V4M9 4h6M8 13h.01M16 13h.01M9 18v2M15 18v2"/>',
  'brain-circuit': '<path d="M8 6a3 3 0 0 0-3 3 3 3 0 0 0 0 6 3 3 0 0 0 3 3h2V6H8Z"/><path d="M16 6a3 3 0 0 1 3 3 3 3 0 0 1 0 6 3 3 0 0 1-3 3h-2V6h2Z"/><path d="M10 9H7M14 9h3M10 14H7M14 14h3M12 6v12"/>',
  drone: '<path d="M10 10h4v4h-4z"/><path d="M10 12H5M14 12h5M12 10V5M12 14v5"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="20" r="2"/>',
  printer: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/><path d="M18 12h.01"/>',
  glasses: '<circle cx="7" cy="15" r="4"/><circle cx="17" cy="15" r="4"/><path d="M11 15h2M3 15l2-7M21 15l-2-7"/>',
  'code-2': '<path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6"/>',
  radar: '<path d="M19.07 4.93A10 10 0 1 1 4.93 19.07"/><path d="M12 12 21 3"/><circle cx="12" cy="12" r="2"/><path d="M16 8a5.7 5.7 0 0 1 1.7 4"/>',
  goal: '<path d="M12 13V3l8 4-8 4"/><path d="M12 13a6 6 0 1 0 6 6"/><path d="M12 13a3 3 0 1 0 3 3"/>',
  school: '<path d="m4 10 8-5 8 5-8 5-8-5Z"/><path d="M6 12v5c2 2 10 2 12 0v-5"/><path d="M20 10v6"/>',
  landmark: '<path d="M3 21h18M5 21V10M19 21V10M3 10h18L12 3 3 10ZM8 14v3M12 14v3M16 14v3"/>',
  blocks: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="8.5" y="14" width="7" height="7" rx="1"/>',
  'graduation-cap': '<path d="m22 10-10-5-10 5 10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v6"/>',
  'briefcase-business': '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 12h18M9 12v2h6v-2"/>',
  university: '<path d="M3 21h18M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M2 10l10-7 10 7"/>',
  facebook: '<path d="M15 8h-2a2 2 0 0 0-2 2v2H8v4h3v6h4v-6h3l1-4h-4v-1a1 1 0 0 1 1-1h3V8h-4Z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  linkedin: '<path d="M6 9v12M6 5v.01M10 21V9h4v2a4 4 0 0 1 7 2.5V21h-4v-7a2 2 0 0 0-4 0v7h-3Z"/>',
  youtube: '<path d="M22 12s0-4-1-5-4-1-9-1-8 0-9 1-1 5-1 5 0 4 1 5 4 1 9 1 8 0 9-1 1-5 1-5Z"/><path d="m10 9 5 3-5 3V9Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/>',
  activity: '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  log_out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>'
};

const aliases = {
  'log-out': 'log_out'
};

export function createIcons(root = document) {
  root.querySelectorAll('[data-lucide]').forEach((element) => {
    if (element.tagName.toLowerCase() === 'svg') return;
    const iconName = aliases[element.dataset.lucide] || element.dataset.lucide;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = iconPaths[iconName] || '<circle cx="12" cy="12" r="8"/>';
    element.replaceWith(svg);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => createIcons());
  } else {
    createIcons();
  }
}
