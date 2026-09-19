{{-- Drop into resources/views/layouts/public.blade.php inside <head> --}}
<title>VoxSign | Ugandan Sign Language tools and school software</title>
<meta name="description" content="VoxSign builds Ugandan Sign Language translation and speech tools for Deaf and speech-impaired people, plus PearlEdu, an offline-first school platform for attendance, grading and fees. Built in Kampala.">
<link rel="canonical" href="https://voxsign.co.ug/">
<meta name="theme-color" content="#0F1E2E">

<meta property="og:type" content="website">
<meta property="og:site_name" content="VoxSign">
<meta property="og:locale" content="en_UG">
<meta property="og:url" content="https://voxsign.co.ug/">
<meta property="og:title" content="VoxSign | Ugandan Sign Language tools and school software">
<meta property="og:description" content="Ugandan Sign Language translation and speech tools for Deaf and speech-impaired people, plus an offline-first school platform for Ugandan institutions.">
<meta property="og:image" content="https://voxsign.co.ug/images/voxsign/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="VoxSign: accessibility tools and school software built in Uganda.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="VoxSign | Ugandan Sign Language tools and school software">
<meta name="twitter:description" content="Ugandan Sign Language translation and speech tools, plus an offline-first school platform for Ugandan institutions.">
<meta name="twitter:image" content="https://voxsign.co.ug/images/voxsign/og-card.png">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Public+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://voxsign.co.ug/#org",
      "name": "VoxSign Technologies",
      "url": "https://voxsign.co.ug/",
      "logo": "https://voxsign.co.ug/images/brand/logo-512.png",
      "description": "VoxSign builds Ugandan Sign Language translation and assistive speech tools, and PearlEdu, an offline-first school management platform.",
      "foundingLocation": {"@type": "Place", "name": "Kampala, Uganda"},
      "address": {"@type": "PostalAddress", "addressLocality": "Kampala", "addressCountry": "UG"},
      "email": "hello@voxsign.co.ug",
      "knowsLanguage": ["en", "Ugandan Sign Language"]
    },
    {
      "@type": "WebSite",
      "@id": "https://voxsign.co.ug/#website",
      "url": "https://voxsign.co.ug/",
      "name": "VoxSign",
      "publisher": {"@id": "https://voxsign.co.ug/#org"},
      "inLanguage": "en-UG"
    },
    {
      "@type": "SoftwareApplication",
      "name": "VoxSign Accessibility",
      "applicationCategory": "CommunicationApplication",
      "operatingSystem": "Web, Android",
      "url": "https://voxsign.co.ug/accessibility",
      "publisher": {"@id": "https://voxsign.co.ug/#org"},
      "description": "Ugandan Sign Language translation and assistive speech recognition for Deaf, hard-of-hearing and speech-impaired people.",
      "offers": {"@type": "Offer", "price": "0", "priceCurrency": "UGX"}
    },
    {
      "@type": "SoftwareApplication",
      "name": "PearlEdu by VoxSign",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, Android",
      "url": "https://voxsign.co.ug/institutions",
      "publisher": {"@id": "https://voxsign.co.ug/#org"},
      "description": "Offline-first school management for attendance, grading, fees and parent communication in Ugandan schools."
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Does VoxSign work without internet?",
          "acceptedAnswer": {"@type": "Answer", "text": "Yes. PearlEdu records attendance and marks on the device and uploads them when the network returns, so a dropped connection never costs a teacher their work."}
        },
        {
          "@type": "Question",
          "name": "Which sign language does VoxSign support?",
          "acceptedAnswer": {"@type": "Answer", "text": "Ugandan Sign Language, built with Deaf signers in Uganda rather than adapted from American Sign Language."}
        },
        {
          "@type": "Question",
          "name": "Are VoxSign Accessibility and PearlEdu the same product?",
          "acceptedAnswer": {"@type": "Answer", "text": "No. VoxSign Accessibility is for Deaf, hard-of-hearing and speech-impaired people. PearlEdu is school management software for institutions. They are sold and used separately."}
        },
        {
          "@type": "Question",
          "name": "What does it cost to run PearlEdu in a school?",
          "acceptedAnswer": {"@type": "Answer", "text": "Pricing is per school and depends on enrolment. Contact VoxSign in Kampala for a quote."}
        }
      ]
    }
  ]
}
</script>
<style>
/* ============================================================
   VoxSign landing page
   No gradients, no pill shapes, no all-caps eyebrow labels.
   Corners are 2px. Rules are hairlines that mark real structure.

   Palette: deep navy carries the structure, cool neutrals carry the
   reading surfaces, and a single teal accent marks every action.
   One accent, used only where something can be clicked or is
   in sequence, is what keeps the page reading as professional.
   ============================================================ */

:root {
  --ink: #0F1E2E;
  --panel: #17293D;
  --panel-deep: #0A1624;
  --paper: #FFFFFF;
  --mist: #F3F5F8;
  --rule: #DCE2E9;
  --rule-dark: #2B3D52;
  --text: #2C3A4B;
  --text-dim: #5C6B7D;
  --action: #0F766E;
  --action-press: #0B5E58;
  --accent-on-dark: #5EC4B6;
  --on-dark: #E8EDF3;
  --on-dark-dim: #A9B6C6;

  /* Used by the avatar's SVG fallback */
  --sign: var(--accent-on-dark);
  --voice: var(--on-dark);

  --display: "Bricolage Grotesque", Georgia, serif;
  --body: "Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif;

  --measure: 62ch;
  --gutter: clamp(20px, 5vw, 64px);
  --shell: 1180px;
  --radius: 2px;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--text);
  font-family: var(--body);
  font-size: 17px;
  line-height: 1.6;
  font-synthesis-weight: none;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: var(--display);
  color: var(--ink);
  font-weight: 600;
  letter-spacing: -0.021em;
  line-height: 1.08;
  margin: 0;
  text-wrap: balance;
}

p { margin: 0; max-width: var(--measure); }
img { max-width: 100%; display: block; }

a { color: var(--ink); text-decoration-thickness: 1px; text-underline-offset: 3px; }
a:hover { color: var(--action); }

:focus-visible {
  outline: 2px solid var(--action);
  outline-offset: 3px;
  border-radius: var(--radius);
}
.on-dark :focus-visible { outline-color: var(--accent-on-dark); }

.shell {
  width: 100%;
  max-width: var(--shell);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

.skip {
  position: absolute; left: -9999px;
  background: var(--ink); color: #fff;
  padding: 12px 18px; z-index: 100; border-radius: var(--radius);
}
.skip:focus { left: 12px; top: 12px; }

/* ---------- Buttons: rectangles, not pills ---------- */

.btn {
  display: inline-block;
  font-family: var(--body);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.005em;
  padding: 13px 22px;
  border-radius: var(--radius);
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: background-color .14s ease, border-color .14s ease, color .14s ease;
}
.btn-solid { background: var(--action); color: #fff; }
.btn-solid:hover { background: var(--action-press); color: #fff; }
.btn-line { background: transparent; color: var(--ink); border-color: var(--rule); }
.btn-line:hover { border-color: var(--ink); color: var(--ink); background: var(--mist); }
.on-dark .btn-line { color: var(--on-dark); border-color: var(--rule-dark); }
.on-dark .btn-line:hover { background: rgba(255,255,255,.06); border-color: var(--on-dark-dim); color: #fff; }

/* ---------- Header ---------- */

.masthead {
  position: sticky; top: 0; z-index: 50;
  background: var(--paper);
  border-bottom: 1px solid var(--rule);
}
.masthead-in {
  display: flex; align-items: center; gap: 28px;
  min-height: 68px;
}
.brand {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--display);
  font-weight: 700; font-size: 21px;
  color: var(--ink); text-decoration: none;
  letter-spacing: -0.02em;
  margin-right: auto;
}
.brand img { width: 30px; height: 30px; }

.nav { display: flex; align-items: center; gap: 26px; }
.nav a {
  font-size: 15.5px; font-weight: 500;
  color: var(--text); text-decoration: none;
  padding: 6px 0;
  border-bottom: 2px solid transparent;
}
.nav a:hover { color: var(--ink); border-bottom-color: var(--action); }
.masthead .btn { padding: 10px 18px; font-size: 15px; }

.nav-toggle { display: none; }

@media (max-width: 900px) {
  .nav, .masthead .btn-solid { display: none; }
  .nav-toggle {
    display: inline-block; background: none;
    border: 1px solid var(--rule); border-radius: var(--radius);
    padding: 9px 14px; font: 600 15px var(--body); color: var(--ink);
  }
  .nav.open {
    display: flex; flex-direction: column; align-items: flex-start;
    position: absolute; inset: 68px 0 auto 0;
    background: var(--paper); border-bottom: 1px solid var(--rule);
    padding: 12px var(--gutter) 22px; gap: 4px;
  }
  .nav.open a { padding: 11px 0; width: 100%; border-bottom: 1px solid var(--mist); }
}

/* ---------- Hero ---------- */

.hero {
  background: var(--ink);
  color: var(--on-dark);
  border-bottom: 1px solid var(--panel);
  overflow: hidden;
}
.hero h1, .hero h2, .hero h3 { color: #fff; }

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: end;
  padding-top: clamp(52px, 8vw, 92px);
}

.hero h1 {
  font-size: clamp(2.5rem, 6.1vw, 4.15rem);
  font-weight: 600;
  line-height: 1.02;
  letter-spacing: -0.03em;
  max-width: 15ch;
}
.hero-lede {
  margin-top: 22px;
  font-size: clamp(1.02rem, 1.7vw, 1.16rem);
  color: var(--on-dark-dim);
  max-width: 48ch;
}
.hero-lede strong { color: #fff; font-weight: 600; }

.hero-actions {
  display: flex; flex-wrap: wrap; gap: 12px;
  margin-top: 30px;
}

/* Two doors, stated plainly, sitting on a rule so they read as a real split */
.hero-doors {
  display: grid; grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--rule-dark);
  margin-top: 46px;
  padding-bottom: clamp(30px, 5vw, 52px);
}
.door {
  padding: 20px 26px 4px 0;
  border-right: 1px solid var(--rule-dark);
}
.door:last-child { border-right: 0; padding-left: 26px; padding-right: 0; }
.door h2 {
  font-size: 1.06rem; font-weight: 600; letter-spacing: -0.01em;
  margin-bottom: 6px;
}
.door p { font-size: 15px; color: var(--on-dark-dim); max-width: 34ch; }
.door a { color: #fff; text-decoration-color: var(--accent-on-dark); }
.door a:hover { color: var(--accent-on-dark); }

/* Avatar: stands on a floor line, does not float */
.stage {
  position: relative;
  align-self: end;
  min-height: 460px;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.stage-figure {
  position: relative;
  width: 100%;
  height: clamp(370px, 45vw, 470px);
  display: block;
}
.stage-figure canvas { display: block; }

/* The floor the figure stands on, drawn in the page as a flat band,
   so the grounding survives even before the 3D model finishes loading. */
.stage-floor {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 1px; background: var(--rule-dark);
}
.stage-shadow {
  position: absolute; bottom: 0; left: 50%;
  width: 42%; height: 16px;
  transform: translateX(-50%);
  background: var(--panel-deep);
  border-radius: 50%;
  filter: blur(9px);
  opacity: .85;
}
.stage-note {
  border-top: 1px solid var(--rule-dark);
  padding: 12px 0 clamp(30px, 5vw, 52px);
  font-size: 14px;
  color: var(--on-dark-dim);
}
.stage-note b { color: #fff; font-weight: 600; }

/* Loader states written by vx-avatar-loader.js */
.vx-avatar-loading {
  position: absolute; left: 0; right: 0; bottom: 28px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.vx-avatar-loading-meta { width: min(220px, 60%); text-align: center; }
.vx-avatar-loading-bar { height: 2px; background: var(--rule-dark); }
.vx-avatar-loading-bar > i {
  display: block; height: 100%; width: 0;
  background: var(--accent-on-dark);
  transition: width .2s linear;
}
.vx-avatar-loading-text { margin: 8px auto 0; font-size: 13px; color: var(--on-dark-dim); }
.vx-avatar-fallback { display: flex; align-items: flex-end; justify-content: center; padding-bottom: 24px; }

@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; align-items: start; }
  .stage { order: -1; min-height: 0; }
  .stage-figure { height: 320px; }
  .hero-doors { grid-template-columns: 1fr; }
  .door { border-right: 0; border-bottom: 1px solid var(--rule-dark); padding: 18px 0; }
  .door:last-child { padding: 18px 0; border-bottom: 0; }
}

/* ---------- Section frame ---------- */

.band { padding: clamp(56px, 8vw, 96px) 0; border-bottom: 1px solid var(--rule); }
.band-mist { background: var(--mist); }
.band-ink { background: var(--ink); color: var(--on-dark); border-bottom-color: var(--panel); }
.band-ink h2, .band-ink h3 { color: #fff; }

.band-head { max-width: 58ch; margin-bottom: clamp(30px, 4vw, 46px); }
.band-head h2 {
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  letter-spacing: -0.026em;
}
.band-head p { margin-top: 14px; font-size: 1.04rem; color: var(--text-dim); }
.band-ink .band-head p { color: var(--on-dark-dim); }

/* ---------- Products: two columns divided by a rule, not two identical cards --- */

.products { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.product {
  padding: 34px 40px 34px 0;
  border-top: 2px solid var(--action);
}
.product + .product {
  padding: 34px 0 34px 40px;
  border-left: 1px solid var(--rule);
  border-top-color: var(--ink);
}
.product h3 { font-size: 1.42rem; letter-spacing: -0.02em; }
.product-for {
  font-size: 14.5px; font-weight: 600; color: var(--action);
  margin-top: 8px;
}
.product + .product .product-for { color: var(--text-dim); }
.product p.product-copy { margin-top: 14px; color: var(--text); max-width: 42ch; }

.spec { margin: 22px 0 26px; padding: 0; list-style: none; }
.spec li {
  padding: 9px 0 9px 0;
  border-bottom: 1px solid var(--rule);
  font-size: 15.5px;
  display: flex; gap: 14px; align-items: baseline;
}
.spec li span { color: var(--text-dim); font-size: 14.5px; }
.spec li b { font-weight: 600; color: var(--ink); min-width: 9.5ch; flex-shrink: 0; }

.product-actions { display: flex; flex-wrap: wrap; gap: 10px; }

@media (max-width: 860px) {
  .products { grid-template-columns: 1fr; }
  .product { padding: 28px 0; }
  .product + .product { padding: 28px 0; border-left: 0; }
}

/* ---------- How it works: a real sequence, so numbering is honest ---------- */

.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--rule-dark); }
.step { background: var(--ink); padding: 26px 24px 30px; }
.step-n {
  font-family: var(--display); font-size: 1.5rem; font-weight: 700;
  color: var(--accent-on-dark); line-height: 1; margin-bottom: 14px;
}
.step h3 { font-size: 1.1rem; margin-bottom: 8px; }
.step p { font-size: 15px; color: var(--on-dark-dim); }
@media (max-width: 760px) { .steps { grid-template-columns: 1fr; } }

/* ---------- Numbers ---------- */

.figures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--rule); }
.figure-cell { background: var(--paper); padding: 26px 24px; }
.band-mist .figure-cell { background: var(--paper); }
.figure-n {
  font-family: var(--display); font-size: clamp(2rem, 4vw, 2.7rem);
  font-weight: 700; color: var(--ink); line-height: 1; letter-spacing: -0.03em;
}
.figure-cell p { margin-top: 10px; font-size: 15px; color: var(--text-dim); max-width: 30ch; }
@media (max-width: 760px) { .figures { grid-template-columns: 1fr; } }

/* ---------- Team ---------- */

.team {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 26px 22px;
}
.member img {
  width: 100%; aspect-ratio: 7 / 8; object-fit: cover;
  border-radius: var(--radius);
  background: var(--mist);
  filter: saturate(.92);
}
.member h3 { font-size: 1.02rem; margin-top: 12px; }
.member p { font-size: 14.5px; color: var(--text-dim); margin-top: 2px; }
@media (max-width: 820px) { .team { grid-template-columns: repeat(2, 1fr); } }

/* ---------- Partners ---------- */

.partners {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 18px 46px;
}
.partners img {
  height: 46px; width: auto; object-fit: contain;
  filter: grayscale(1); opacity: .62;
}
.partners img:hover { filter: none; opacity: 1; }

/* ---------- FAQ ---------- */

.faq { max-width: 74ch; }
.faq details {
  border-bottom: 1px solid var(--rule);
  padding: 4px 0;
}
.faq summary {
  cursor: pointer; list-style: none;
  font-family: var(--display); font-size: 1.1rem; font-weight: 600;
  color: var(--ink); padding: 16px 34px 16px 0;
  position: relative;
}
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after {
  content: "+"; position: absolute; right: 4px; top: 14px;
  font-size: 1.4rem; font-weight: 500; color: var(--action); line-height: 1;
}
.faq details[open] summary::after { content: "\2212"; }
.faq details p { padding: 0 34px 18px 0; color: var(--text); }

/* ---------- Contact ---------- */

.contact-grid {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 64px); align-items: start;
}
.contact-list { list-style: none; margin: 0; padding: 0; }
.contact-list li {
  border-top: 1px solid var(--rule-dark);
  padding: 14px 0;
  display: grid; grid-template-columns: 8.5rem 1fr; gap: 16px;
  font-size: 15.5px;
}
.contact-list b { font-weight: 600; color: #fff; }
.contact-list a { color: var(--on-dark); text-decoration-color: var(--accent-on-dark); }
.contact-list a:hover { color: var(--accent-on-dark); }
.contact-list span { color: var(--on-dark-dim); }
@media (max-width: 820px) {
  .contact-grid { grid-template-columns: 1fr; }
  .contact-list li { grid-template-columns: 1fr; gap: 2px; }
}

/* ---------- Footer ---------- */

.foot { background: var(--panel-deep); color: var(--on-dark-dim); padding: 44px 0 34px; }
.foot-top {
  display: flex; flex-wrap: wrap; gap: 24px 48px;
  justify-content: space-between; align-items: flex-start;
  padding-bottom: 26px; border-bottom: 1px solid var(--rule-dark);
}
.foot nav { display: flex; flex-wrap: wrap; gap: 10px 30px; }
.foot a { color: var(--on-dark); font-size: 15px; text-decoration: none; }
.foot a:hover { color: #fff; text-decoration: underline; text-decoration-color: var(--accent-on-dark); }
.foot-base {
  padding-top: 22px; font-size: 14px;
  display: flex; flex-wrap: wrap; gap: 8px 28px; justify-content: space-between;
}
.foot .brand { color: #fff; margin-right: 0; }

</style>

<!-- Resolves the bare "three" imports in vx-avatar-loader.js to the self-hosted copy -->
<script type="importmap">
{
  "imports": {
    "three": "/vendor/three-0.170.0/three.module.js",
    "three/addons/": "/vendor/three-0.170.0/addons/"
  }
}
</script>
