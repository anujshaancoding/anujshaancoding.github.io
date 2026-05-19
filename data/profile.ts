// =============================================================
//  EDIT THIS FILE ONLY. Everything on the site reads from here.
//  Pre-filled with your real details. Tweak wording / add metrics
//  and screenshots (drop images in /public) when you have them.
//
//  - skills[].items[].level   : 0-100, drives the animated bar chart
//  - visuals[].kind           : which LIVE mini-chart renders on the card
//                               ("matrix" | "network" | "sankey" | "gauge")
// =============================================================

export type SkillGroup = {
  group: string;
  items: { name: string; level: number }[];
};

export type VisualKind = "matrix" | "network" | "sankey" | "gauge";

export const profile = {
  name: "Anuj Kumar",
  title: "Data Visualization Engineer — Power BI Custom Visuals",
  tagline:
    "I build custom Power BI visuals from scratch with React, D3.js and TypeScript.",
  location: "Daltonganj, Jharkhand, India",
  email: "anujshaan261@gmail.com",
  phone: "+91 99318 24747",
  // Drop a square headshot at portfolio/public/profile.jpg (or change path).
  // Leave as "" to hide the photo everywhere until you have one.
  photo: "/profile.jpg",
  links: {
    github: "https://github.com/anujshaancoding",
    linkedin: "https://www.linkedin.com/in/anujshaan/",
    resume: "/resume.pdf", // copy your PDF here as public/resume.pdf
  },
  about:
    "Data Visualization Engineer with 4+ years building production-grade " +
    "custom Power BI visuals in React, D3.js and TypeScript. I've delivered " +
    "7+ marketplace-deployed visuals — several earning “Editor’s Choice” — " +
    "used by enterprise customers in Microsoft Power BI, and independently " +
    "led custom-visual development across multiple client projects.",

  // Competency radar — 6 axes, 0-100. Drives the signature chart.
  radar: [
    { axis: "Power BI API", value: 94 },
    { axis: "D3 / SVG", value: 91 },
    { axis: "React / TS", value: 90 },
    { axis: "Perf @ scale", value: 83 },
    { axis: "Formatting model", value: 89 },
    { axis: "Interaction design", value: 86 },
  ] as { axis: string; value: number }[],

  // Headline stats — counts up when scrolled into view.
  stats: [
    { label: "Custom visuals shipped", value: 7, suffix: "+" },
    { label: "Years in data viz", value: 4, suffix: "+" },
    { label: "“Editor’s Choice” visuals", value: 2, suffix: "" },
    { label: "Enterprise reports served", value: 20, suffix: "+" },
  ],

  skills: [
    {
      group: "Power BI Custom Visuals",
      items: [
        { name: "Visuals API", level: 95 },
        { name: "capabilities.json / data view mapping", level: 92 },
        { name: "Formatting model & pane", level: 90 },
        { name: "Selection & cross-filtering", level: 88 },
        { name: "Tooltips & bookmarks", level: 85 },
        { name: "pbiviz tooling & AppSource", level: 82 },
      ],
    },
    {
      group: "Data Visualization",
      items: [
        { name: "D3.js", level: 92 },
        { name: "SVG / Canvas rendering", level: 90 },
        { name: "Scales, axes, transitions", level: 90 },
        { name: "Hierarchical & force layouts", level: 84 },
        { name: "Large-dataset performance", level: 82 },
      ],
    },
    {
      group: "Frontend",
      items: [
        { name: "React", level: 92 },
        { name: "TypeScript", level: 90 },
        { name: "JavaScript (ES6+)", level: 92 },
        { name: "HTML5 / CSS3 / Sass", level: 88 },
      ],
    },
    {
      group: "Tooling",
      items: [
        { name: "Git", level: 88 },
        { name: "Vitest / Storybook / CI", level: 80 },
        { name: "Shopify / WordPress", level: 75 },
        { name: "GTM / GA4", level: 72 },
      ],
    },
  ] as SkillGroup[],

  visuals: [
    {
      name: "Power Table",
      kind: "matrix" as VisualKind,
      problem:
        "Native Power BI tables/matrices can't render rich per-cell charts for dense, configurable reporting.",
      build:
        "Excel-style matrix visual in React + D3 supporting multiple in-cell mini-charts (bar, pie, bullet, sparkline, gauge) across rows and columns.",
      impact:
        "Reused across multiple client reports for compact, information-dense dashboards.",
      link: "",
    },
    {
      name: "Network Graph (nodes & links)",
      kind: "network" as VisualKind,
      problem:
        "Relationship/flow data needed an interactive node-link visual not available natively.",
      build:
        "Force-directed D3 graph with interactive nodes, links, selection and cross-filtering via the Power BI Visuals API.",
      impact: "Earned “Editor’s Choice” recognition in the marketplace.",
      link: "",
    },
    {
      name: "Sankey Chart",
      kind: "sankey" as VisualKind,
      problem: "Flow/proportion analysis across stages needed a custom Sankey.",
      build:
        "D3 Sankey layout with custom formatting pane, tooltips and cross-filtering.",
      impact: "Deployed to production for enterprise customers.",
      link: "",
    },
    {
      name: "Activity & Linear Gauges",
      kind: "gauge" as VisualKind,
      problem: "Branded, configurable KPI and proportion visuals.",
      build:
        "Performance-focused gauge visuals with full formatting model and selection support.",
      impact: "Part of a 7+ visual suite used in Microsoft Power BI.",
      link: "",
    },
  ],

  projects: [
    {
      name: "Power Table — open-source pbiviz",
      stack: "Power BI Visuals API · React · D3 · TypeScript",
      desc: "Standalone Excel-style matrix custom visual with in-cell bars, bullets and sparklines — on track for Microsoft certification.",
      link: "https://github.com/anujshaancoding",
    },
    {
      name: "@anuj/dataviz-components",
      stack: "React · D3 · Vitest · Storybook · GitHub Actions",
      desc: "Tested, tree-shakeable React+D3 chart library (gauge, sankey, line, bar, KPI) with CI and interactive docs.",
      link: "https://github.com/anujshaancoding",
    },
    {
      name: "ResumeMatch AI",
      stack: "Next.js 15 · TypeScript · Prisma/Postgres · OpenAI",
      desc: "Resume↔JD matching app with a deterministic, offline-testable core, Docker, Sentry and Vitest.",
      link: "https://github.com/anujshaancoding",
    },
  ],

  experience: [
    {
      role: "Frontend Developer — Power BI Custom Visuals",
      company: "Truviz Pvt. Ltd. (Remote)",
      period: "May 2023 – Jun 2026",
      points: [
        "Engineered and delivered 7+ custom Power BI visuals deployed to production and used by customers within Microsoft Power BI environments.",
        "Built performance-focused analytics components; multiple visuals received “Editor’s Choice” in the Power BI custom visuals marketplace.",
        "Designed an Excel-style “Power Table” matrix visual with multiple in-cell chart types.",
        "Independently led custom-visual development the last year — new features, usability, on-time delivery across multiple team projects.",
      ],
    },
    {
      role: "Frontend Developer",
      company: "Pinchforth (Remote)",
      period: "Jun 2021 – Jan 2023",
      points: [
        "Built interactive data visualizations with D3.js and ReactJS.",
        "Developed complex front-end interfaces in React and Sass.",
        "Shopify theme customization; WordPress development; GTM/GA4 analytics.",
      ],
    },
  ],
};
