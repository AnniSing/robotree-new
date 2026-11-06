# UI/UX Design System Specification (DESIGN_SYSTEM)

**Product Name:** Robotree Robotics Corporate & STEM Education Web Platform  
**Document Version:** 2.1.0  
**Status:** Living Specification  
**Entity:** Robotree Robotics LLP (GeM & MSME Accredited Entity)  
**Author:** Principal Design System Architect & UI Engineer  

---

## 01. Design Philosophy

The Robotree Design System embodies a high-tech, futuristic, aerospace, and robotics-inspired aesthetic while preserving enterprise readability and educational accessibility.

Key Tenets:
1. **Precision & Clarity:** High-contrast typography and defined visual hierarchies prevent cognitive overload for students and parents.
2. **Technological Elegance:** Deep space navy surfaces (`#06101a`) paired with vibrant cybernetic emerald neon accents (`#78d844`).
3. **Responsive Fluency:** Fluid layouts using modern CSS Flexbox, Grid, and `clamp()` type scaling.
4. **Universal Accessibility (WCAG 2.1 AA):** Strict minimum contrast ratios (4.5:1 for normal text, 3:1 for large text), visible keyboard focus indicators, and reduced-motion consideration.

---

## 02. Color System & Semantic Tokens

### 2.1 Dark Mode (Primary Palette)
```css
:root {
  /* Surfaces & Backgrounds */
  --bg: #06101a;          /* Deep space canvas */
  --bg-deep: #030b13;     /* Darker footer / modal backdrop */
  --panel: #0b1824;       /* Card & elevated container surface */
  --panel-2: #0f1d2a;     /* Secondary nested card surface */

  /* Borders & Dividers */
  --line: rgba(183, 209, 229, 0.16);       /* Subtle structural border */
  --line-bright: rgba(116, 217, 67, 0.48);  /* Glowing emerald highlight border */

  /* Brand Accents */
  --green: #78d844;       /* Electric cyber emerald (Primary CTA) */
  --green-2: #9bea57;     /* Hover highlight green */
  --green-dark: #305f20;  /* Active / pressed background green */

  /* Semantic Text Palette */
  --text: #ffffff;          /* Primary headings & high-contrast body */
  --text-secondary: #cbd5e1;/* Standard readable copy */
  --text-muted: #94a3b8;    /* Metadata, timestamps, captions */
  --text-accent: #78d844;   /* Brand emphasis & icons */
  --text-inverse: #06101a;  /* High-contrast text on bright buttons */
  --text-danger: #ef4444;   /* Error states & validation warnings */
  --text-info: #38bdf8;     /* Informational badges & links */
}
```

### 2.2 Light Mode Variation
```css
[data-theme="light"] {
  --bg: #f3f7f2;
  --bg-deep: #ffffff;
  --panel: #ffffff;
  --panel-2: #edf7eb;
  --line: rgba(15, 23, 42, 0.14);
  --line-bright: rgba(83, 171, 43, 0.48);
  --text: #0f172a;
  --text-secondary: #334155;
  --text-muted: #64748b;
  --text-accent: #16a34a;
  --text-inverse: #ffffff;
}
```

---

## 03. Typography Scale & Fonts

The system leverages system-ui and modern sans-serif fonts (`Inter`, `Segoe UI`, `Roboto`, `sans-serif`) for optimal cross-platform rendering without network blocking.

| Token | Size (Rem / Px) | Line Height | Typical Usage |
|:---|:---|:---|:---|
| `--fs-xs` | `0.8125rem` (13px) | 1.4 | Badges, tags, eyebrows, table metadata |
| `--fs-sm` | `0.875rem` (14px) | 1.5 | Subtext, navigation links, secondary pills |
| `--fs-base` | `1.0000rem` (16px) | 1.6 | Body text, input controls, primary buttons |
| `--fs-md` | `1.1250rem` (18px) | 1.5 | Card titles, subsection headings |
| `--fs-lg` | `1.2500rem` (20px) | 1.4 | Prominent stat labels, modal headers |
| `--fs-xl` | `1.5000rem` (24px) | 1.3 | Major stat highlights, section subheads |
| `--fs-2xl` | `2.0000rem` (32px) | 1.2 | Section titles (`<h2>`) |
| `--fs-3xl` | `clamp(2.5rem, 5vw, 4rem)` | 1.1 | Hero display banner (`<h1>`) |

---

## 04. Corner Radii & Elevation (Shadows)

```css
:root {
  --radius-sm: 6px;       /* Tags, small badges, buttons */
  --radius-md: 10px;      /* Standard card components & inputs */
  --radius-lg: 16px;      /* Large panels, hero floating cards, modals */
  --radius-full: 9999px;  /* Pill buttons & avatar frames */
  --shadow: 0 18px 52px rgba(0, 0, 0, 0.46);
}
```

---

## 05. Core Component Patterns

### 5.1 Hero Floating Metric Card
The live floating stat badge in the hero section is hydrated dynamically via `/api/site-settings`.
- **Background:** `var(--panel)` with glassmorphic `backdrop-filter: blur(12px)`.
- **Border:** `1px solid var(--line-bright)`.
- **Pill Tag:** Glowing green indicator dot with pulse animation.
- **Metric Highlight:** Dynamic large number (`20,000+`) rendered with `--fs-2xl` font weight 800.
- **Label:** Dynamic label (`Students Trained`) in `--fs-sm` secondary text.

### 5.2 Course Exploration Card
- High-definition image header with aspect ratio 16:9.
- Domain category tag in top-right corner.
- Duration badge (e.g. `8 Weeks`) and Skill Level badge (e.g. `Intermediate`).
- Key curriculum bullet points.
- Dual action bar: Primary green button ("Enroll Now") + Outline button ("Curriculum").

### 5.3 Certificate Verification Visualizer
- Clean search form with validation state feedback.
- Interactive HTML5 Canvas preview generating high-DPI certificate renderings.
- Official GeM & MSME Government of India accreditation seal stamp.

### 5.4 Government Protocol Compliance Footer
- Centralized footer banner across all 11 pages.
- Styling: High-contrast muted gold and silver typography emphasizing Government of India protocols.
- Permanent absence of proprietary copyright claims.

---

## 06. Accessibility (a11y) Guidelines

- **Focus Visibility:** All interactive elements (`<button>`, `<a>`, `<input>`, `<select>`) must display a high-contrast focus outline when navigated via keyboard:
  ```css
  :focus-visible {
    outline: 2px solid var(--green);
    outline-offset: 3px;
  }
  ```
- **Motion Reduction:** Respect user system settings via media query:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
