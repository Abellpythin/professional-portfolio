// ============================================================================
//  content/portfolio.js  —  THE ONLY FILE YOU NEED TO EDIT FOR YOUR CONTENT
// ============================================================================
//  Everything below is PLACEHOLDER text. Nothing is pulled from anywhere.
//  Search this file for "TODO" and replace each value with your own.
//
//  How it works
//  ------------
//  * SITE      – your name / headline / contact shown in the UI.
//  * SECTIONS  – the groups shown in the top navigation (and the 3D wall zones).
//  * ITEMS     – every clickable thing in the room. One entry = one object
//                on a wall / shelf / desk. Add, remove, or reorder freely.
//  * TOUR      – the order used by the "Guided tour" button.
//
//  Each section has a limited number of physical "slots" in the room
//  (see README → "How many items fit?"). Extra items still appear in the
//  side panel lists, they just don't get their own 3D object.
// ============================================================================

export const SITE = {
  name: "Your Name",                                   // TODO
  headline: "Researcher · Computer Science & Biomedical AI",      // TODO
  tagline: "Welcome to my lab-office. Click anything on the walls to explore my work.", // TODO
  email: "you@example.com",                            // TODO
  accent: "#7ee7d1",                                   // UI + glow colour
  // Shows a small yellow "placeholder" note inside panels until you set
  // `placeholder: false` on an item (or turn all notes off here).
  showPlaceholderNotes: true,
};

// Single room. (Kept as a list so a second room could be added later.)
export const ROOMS = [
  { id: "office", label: "Office", icon: "🔬" },
];

export const SECTIONS = [
  { id: "education",     label: "Education",     icon: "🎓", blurb: "Degrees and diplomas." },
  { id: "research",      label: "Research",      icon: "🔬", blurb: "Projects, manuscripts and methods." },
  { id: "presentations", label: "Presentations", icon: "🎤", blurb: "Talks and posters I have given." },
  { id: "events",        label: "Events",        icon: "🎟️", blurb: "Conferences, workshops and programs attended." },
  { id: "honors",        label: "Honors",        icon: "🏅", blurb: "Academic honors and recognitions." },
  { id: "leadership",    label: "Leadership",    icon: "🚩", blurb: "Roles where I led people or programs." },
  { id: "awards",        label: "Awards",        icon: "🏆", blurb: "Awards and competitions." },
  { id: "projects",      label: "Projects",      icon: "📚", blurb: "Software and side projects on the bookshelf." },
  { id: "profiles",      label: "Connect",       icon: "🔗", blurb: "Resume, profiles and contact." },
];

// ----------------------------------------------------------------------------
//  ITEM FIELDS (all optional except id / section / title)
//
//    id         unique, no spaces. Used in the URL: yoursite/#research-1
//    section    one of the SECTIONS ids above
//    title      big heading in the panel + tooltip
//    subtitle   one line under the heading (institution · dates)
//    short      very short text drawn ON the 3D object (plaque / badge / pennant)
//    art        procedural artwork style (see list below) — used when no image
//    image      path to a real image, e.g. "assets/textures/degree.jpg".
//               Leave it "" to show the generated artwork. If the path is wrong
//               the artwork is shown too (see the browser console).
//    body       array of paragraphs
//    tags       array of small chips
//    facts      [["Label","Value"], ...]  shown as a tidy grid
//    entries    [{ title, meta, text, href }]  publications / talks / roles list
//    gallery    [{ src, caption }]  extra images (click to zoom)
//    links      [{ label, href }]  buttons at the bottom
//    placeholder  set to false once the item holds real content
//
//  art styles:  certificate · brain · neural · quantum · waves   (frames)
//               stage (slide) · badge · laurel · pennant · trophy · book
//               icon-resume · icon-linkedin · icon-github · icon-website
//               icon-scholar · icon-email · nameplate
//  trophy shapes (awards):  trophy:"cup" | "star" | "medal"
// ----------------------------------------------------------------------------

export const ITEMS = [
  // ───────────────────────────── EDUCATION ─────────────────────────────
  {
    id: "degree", section: "education", art: "certificate",
    title: "Bachelor of Science in Your Major",              // TODO
    subtitle: "Your University · Month Year",               // TODO
    certificate: { heading: "Bachelor of Science", line: "in Your Major" },
    image: "",                                             // TODO: e.g. "assets/textures/degree.jpg" once you add your scan
    body: [
      "Placeholder: one or two sentences about the degree, your concentration, and anything a reviewer should notice (thesis, honors track, relevant coursework).",
    ],
    facts: [
      ["Institution", "Your University"],
      ["Degree", "B.S., Your Major"],
      ["Graduated", "Month Year"],
      ["GPA", "x.xx / 4.00"],
    ],
    tags: ["Computer Science", "Mathematics"],
    links: [{ label: "Open transcript (PDF)", href: "assets/documents/transcript.pdf" }],
  },
  {
    id: "diploma", section: "education", art: "certificate",
    title: "Diploma",                                        // TODO
    subtitle: "Your University · Month Year",               // TODO
    certificate: { heading: "Diploma", line: "with distinction" },
    image: "",                                             // TODO: e.g. "assets/textures/diploma.jpg"
    body: ["Placeholder: add the honors designation or notes about the diploma here."],
    facts: [["Institution", "Your University"], ["Awarded", "Month Year"]],
  },

  // ───────────────────────────── RESEARCH ─────────────────────────────
  {
    id: "research-1", section: "research", art: "brain",
    title: "Research Project One",                          // TODO
    subtitle: "Advisor Name · Lab / Division · 2024 – Present",
    body: [
      "Placeholder abstract: state the problem, why it matters, your approach, and the main finding in three or four sentences.",
      "Placeholder second paragraph: describe your specific contribution and the methods you used.",
    ],
    tags: ["Deep learning", "Medical imaging", "Vision transformers"],
    facts: [
      ["Role", "Lead researcher"],
      ["Methods", "Method A, Method B"],
      ["Data", "Dataset name (n = ...)"],
      ["Status", "Manuscript in preparation"],
    ],
    entries: [
      { title: "Title of your manuscript", meta: "Venue · Year · Status", text: "Authors: You, Advisor Name", href: "#" },
    ],
    links: [{ label: "Read the paper", href: "#" }, { label: "Code on GitHub", href: "https://github.com/your-handle" }],
  },
  {
    id: "research-2", section: "research", art: "neural",
    title: "Research Project Two",                          // TODO
    subtitle: "Collaborator · Institution · 2023 – 2024",
    body: ["Placeholder: describe this second project. Delete this item if you only have one."],
    tags: ["Machine learning"],
    facts: [["Role", "Contributor"], ["Methods", "Method C"]],
  },
  {
    id: "research-3", section: "research", art: "quantum",
    title: "Research Project Three",                        // TODO
    subtitle: "Program · Institution · Summer Year",
    body: ["Placeholder: describe this third project, or change `art` to brain / neural / waves / quantum."],
    tags: ["Quantum computing"],
    facts: [["Role", "Research intern"]],
  },

  // ─────────────────────────── PRESENTATIONS ───────────────────────────
  {
    id: "talk-1", section: "presentations", art: "stage",
    title: "Oral Presentation Title",                       // TODO
    subtitle: "Conference or Symposium · Month Year",
    body: ["Placeholder: what you presented, the audience, and the outcome (questions, follow-ups, feedback)."],
    tags: ["Oral", "20 min"],
    links: [{ label: "Slides (PDF)", href: "assets/documents/slides-1.pdf" }],
  },
  {
    id: "talk-2", section: "presentations", art: "stage",
    title: "Poster Presentation Title",                     // TODO
    subtitle: "Research Day · Month Year",
    body: ["Placeholder: describe the poster and where it was presented."],
    tags: ["Poster"],
  },

  // ────────────────────────────── EVENTS ──────────────────────────────
  {
    id: "event-1", section: "events", art: "badge", short: "CONFERENCE",
    title: "Conference Name",                               // TODO
    subtitle: "City · Month Year",
    body: ["Placeholder: what you attended or contributed to at this event."],
    tags: ["Attendee"],
  },
  {
    id: "event-2", section: "events", art: "badge", short: "WORKSHOP",
    title: "Workshop Name",                                 // TODO
    subtitle: "Institution · Month Year",
    body: ["Placeholder."],
  },
  {
    id: "event-3", section: "events", art: "badge", short: "SUMMER SCHOOL",
    title: "Summer Program Name",                           // TODO
    subtitle: "Location · Summer Year",
    body: ["Placeholder."],
  },

  // ────────────────────────────── HONORS ──────────────────────────────
  {
    id: "honor-1", section: "honors", art: "laurel", short: "Dean's List",
    title: "Dean's List",                                   // TODO
    subtitle: "Your University · Semesters",
    body: ["Placeholder: criteria for the honor and when you received it."],
  },
  {
    id: "honor-2", section: "honors", art: "laurel", short: "Honors Program",
    title: "Honors Program",                                // TODO
    subtitle: "Your University · Years",
    body: ["Placeholder."],
  },
  {
    id: "honor-3", section: "honors", art: "laurel", short: "Scholar",
    title: "Named Scholarship",                             // TODO
    subtitle: "Organization · Year",
    body: ["Placeholder."],
  },

  // ──────────────────────────── LEADERSHIP ────────────────────────────
  {
    id: "lead-1", section: "leadership", art: "pennant", short: "PRESIDENT",
    title: "President, Your Student Organization",          // TODO
    subtitle: "Organization · Years",
    body: ["Placeholder: what you led, how many people, and what changed because of you."],
    entries: [{ title: "Initiative or event you ran", meta: "Year", text: "One-line impact statement." }],
  },
  {
    id: "lead-2", section: "leadership", art: "pennant", short: "MENTOR",
    title: "Peer Mentor / Tutor",                           // TODO
    subtitle: "Program · Years",
    body: ["Placeholder."],
  },
  {
    id: "lead-3", section: "leadership", art: "pennant", short: "CAPTAIN",
    title: "Team Lead / Captain",                           // TODO
    subtitle: "Team · Year",
    body: ["Placeholder."],
  },

  // ────────────────────────────── AWARDS ──────────────────────────────
  {
    id: "award-1", section: "awards", art: "trophy", trophy: "cup",
    title: "First Place, Competition Name",                 // TODO
    subtitle: "Organizer · Year",
    body: ["Placeholder: what the competition was and what you built or won."],
  },
  {
    id: "award-2", section: "awards", art: "trophy", trophy: "star",
    title: "Outstanding Student Award",                     // TODO
    subtitle: "Department · Year",
    body: ["Placeholder."],
  },
  {
    id: "award-3", section: "awards", art: "trophy", trophy: "medal",
    title: "Best Poster / Paper",                           // TODO
    subtitle: "Conference · Year",
    body: ["Placeholder."],
  },

  // ────────────────────────────── PROJECTS ─────────────────────────────
  //  Each project is a book on the shelf. Click it and it slides out.
  { id: "project-1", section: "projects", art: "book", title: "Project One",   subtitle: "Python · PyTorch",      body: ["Placeholder project description. What it does, why you built it, what you learned."], tags: ["Python"], links: [{ label: "Repository", href: "https://github.com/your-handle" }] },
  { id: "project-2", section: "projects", art: "book", title: "Project Two",   subtitle: "Kotlin · Android",      body: ["Placeholder project description."] },
  { id: "project-3", section: "projects", art: "book", title: "Project Three", subtitle: "JavaScript · WebGL",    body: ["Placeholder project description."] },
  { id: "project-4", section: "projects", art: "book", title: "Project Four",  subtitle: "Qiskit · Python",       body: ["Placeholder project description."] },
  { id: "project-5", section: "projects", art: "book", title: "Project Five",  subtitle: "R · Statistics",        body: ["Placeholder project description."] },
  { id: "project-6", section: "projects", art: "book", title: "Project Six",   subtitle: "C++ · Systems",         body: ["Placeholder project description."] },

  // ───────────────────────────── CONNECT ──────────────────────────────
  //  kind:"link" items open an external URL / your resume file.
  { id: "resume",   section: "profiles", kind: "link", art: "icon-resume",   title: "Resume / CV", subtitle: "PDF", href: "assets/documents/resume.pdf", cta: "Open resume",  body: ["Add your resume as assets/documents/resume.pdf (see README)."] },
  { id: "linkedin", section: "profiles", kind: "link", art: "icon-linkedin", title: "LinkedIn",    subtitle: "Professional profile", href: "https://www.linkedin.com/in/your-handle", cta: "Open LinkedIn", body: ["Replace the link with your profile URL."] },
  { id: "github",   section: "profiles", kind: "link", art: "icon-github",   title: "GitHub",      subtitle: "Code and projects",    href: "https://github.com/your-handle",           cta: "Open GitHub",   body: ["Replace the link with your GitHub URL."] },
  { id: "website",  section: "profiles", kind: "link", art: "icon-website",  title: "Website",     subtitle: "Personal site",        href: "https://your-website.example",             cta: "Open website",  body: ["Replace the link with your site URL."] },
  { id: "scholar",  section: "profiles", kind: "link", art: "icon-scholar",  title: "Google Scholar / ORCID", subtitle: "Publications", href: "https://scholar.google.com/", cta: "Open profile", body: ["Optional. Delete this item if you do not need it."] },
  { id: "email",    section: "profiles", kind: "link", art: "icon-email",    title: "Email",       subtitle: "Best way to reach me", href: "mailto:you@example.com", cta: "Send an email", body: ["Replace with your email address."] },

  // The brass nameplate on the desk. `placement:"desk"` pins it there.
  { id: "about", section: "profiles", placement: "desk", art: "nameplate",
    title: "About me",                                       // TODO
    subtitle: "Researcher · Your Institution",
    body: [
      "Placeholder: a short, confident research statement (3–5 sentences). What questions drive you, what you have built, and what you want to do next.",
    ],
    tags: ["Research interest A", "Research interest B", "Research interest C"],
    facts: [["Based in", "City, State"], ["Looking for", "PhD / research positions"]],
  },

];

// Guided tour order (item ids and/or section ids). Delete lines to shorten it.
export const TOUR = [
  { id: "about",      say: "Start at the desk: a short introduction." },
  { id: "degree",     say: "Education: the framed degree and diploma." },
  { id: "research-1", say: "Research: the centrepiece on the back wall." },
  { id: "talk-1",     say: "Presentations: talks and posters." },
  { id: "event-1",    say: "Events I have attended or contributed to." },
  { id: "honor-1",    say: "Honors on the east wall." },
  { id: "lead-1",     say: "Leadership roles, shown as pennants." },
  { id: "award-1",    say: "Awards on the shelf." },
  { id: "project-1",  say: "Projects live on the bookshelf." },
  { id: "resume",     say: "How to reach me." },
];
