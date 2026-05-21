import Link from "next/link";
import { profile } from "@/data/profile";
import { getAllPosts } from "@/lib/blog";
import { Section } from "@/components/Section";
import { Nav } from "@/components/Nav";
import { SideIndex } from "@/components/SideIndex";
import { HeroViz } from "@/components/HeroViz";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { Avatar } from "@/components/Avatar";
import { GlowCard } from "@/components/GlowCard";
import { SkillBars } from "@/components/charts/SkillBars";
import { RadarChart } from "@/components/charts/RadarChart";
import { VisualThumb } from "@/components/charts/VisualThumb";
import { PostCard } from "@/components/blog/PostCard";

const ArrowOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M7 17 17 7M9 7h8v8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Home() {
  const posts = getAllPosts();

  return (
    <main id="top" className="relative">
      <Nav />
      <SideIndex />

      {/* ---------------- Hero ---------------- */}
      <header className="relative min-h-screen overflow-hidden">
        <HeroViz />
        {/* depth scrim — softly dims the streaming lines over the copy area
            so they read as passing *behind* the hero text */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(50% 46% at 25% 43%, rgba(7,10,18,0.85) 0%, rgba(7,10,18,0.5) 50%, rgba(7,10,18,0) 80%)",
          }}
        />
        <div className="relative z-[2] mx-auto grid max-w-content items-center gap-12 px-6 pb-24 pt-36 lg:grid-cols-[1.15fr_0.85fr] lg:pt-44">
          <div>
            <div className="mb-7 flex items-center gap-5">
              {/* passport-style portrait — head-to-chest crop of img1.JPG */}
              <div
                className="relative shrink-0 animate-floaty rounded-2xl p-[2px]"
                style={{
                  background:
                    "linear-gradient(150deg,#4c8dff,#9a6bff 55%,#3de0c2)",
                }}
              >
                <div className="overflow-hidden rounded-[0.9rem] bg-panel">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="w-36 aspect-[4/5] object-cover"
                  />
                </div>
              </div>
              <p className="kicker flex items-center gap-3">
                <span className="h-px w-8 bg-accent" />
                {profile.location}
              </p>
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] [filter:drop-shadow(0_6px_28px_rgba(7,10,18,0.7))] sm:text-7xl">
              {profile.name.split(" ")[0]}
              <br />
              <span className="gradient-text">{profile.name.split(" ").slice(1).join(" ")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              {profile.title}
            </p>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-text/80">
              {profile.tagline}
            </p>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-accent3/30 bg-accent3/10 px-3.5 py-1.5">
              <span className="live-pill">available for work</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`mailto:${profile.email}`} className="btn-primary">
                Hire / contact me
              </a>
              <a href={profile.links.resume} className="btn-ghost">
                Resume (PDF)
              </a>
              <a href={profile.links.github} className="btn-ghost">
                GitHub <ArrowOut />
              </a>
              <a href={profile.links.linkedin} className="btn-ghost">
                LinkedIn <ArrowOut />
              </a>
            </div>
          </div>

          <Reveal delay={150}>
            <div className="glass p-6">
              <div className="mb-1 flex items-center justify-between">
                <span className="kicker">core competencies</span>
                <span className="live-pill">live</span>
              </div>
              <RadarChart data={profile.radar} />
            </div>
          </Reveal>
        </div>

        {/* stats strip */}
        <div className="relative z-[2] mx-auto -mt-8 max-w-content px-6 pb-16">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.05] sm:grid-cols-4">
            {profile.stats.map((s) => (
              <div key={s.label} className="bg-bg/60 p-6 backdrop-blur">
                <div className="font-display text-4xl font-bold gradient-text">
                  <CountUp value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-xs leading-snug text-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ---------------- About ---------------- */}
      <Section id="about" index="01" title="About">
        <Reveal>
          <div className="flex flex-col gap-10 sm:flex-row sm:items-center">
            <Avatar
              src={profile.photoAbout}
              name={profile.name}
              size={200}
              className="mx-auto sm:mx-0"
            />
            <p className="max-w-2xl text-xl leading-relaxed text-text/85">
              {profile.about}
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ---------------- Power BI Visuals ---------------- */}
      <Section
        id="visuals"
        index="02"
        title="Power BI Custom Visuals"
        intro="Each card renders a live, interactive miniature of the real visual — hover the matrix rows and the network nodes."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {profile.visuals.map((v, i) => (
            <Reveal key={v.name} delay={i * 80}>
              <GlowCard>
                <VisualThumb kind={v.kind} />
                <h3 className="font-display text-xl font-semibold">{v.name}</h3>
                <dl className="mt-4 space-y-2.5 text-sm">
                  {[
                    ["Problem", v.problem],
                    ["Built", v.build],
                    ["Impact", v.impact],
                  ].map(([k, val]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wider text-accent2">
                        {k}
                      </dt>
                      <dd className="text-muted">{val}</dd>
                    </div>
                  ))}
                </dl>
                {v.link ? (
                  <a
                    href={v.link}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                  >
                    View <ArrowOut />
                  </a>
                ) : null}
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- Interactive Demos ---------------- */}
      <Section
        id="demos"
        index="03"
        title="Interactive Demos"
        intro="Live, data-driven builds of my flagship visuals. Open one in a new tab — each loads with sample data you can resize from simple to complex, or drop in your own CSV and watch it adapt. Then download a generated report. Zero chart libraries; the layout maths is hand-rolled."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {profile.demos.map((d, i) => (
            <Reveal key={d.slug} delay={i * 80}>
              <a
                href={`/demo/${d.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <GlowCard className="flex flex-col">
                  <VisualThumb kind={d.kind} />
                  <h3 className="font-display text-xl font-semibold">
                    {d.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm text-muted">{d.blurb}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {d.accepts.split(" · ").map((f) => (
                      <span key={f} className="chip">
                        {f}
                      </span>
                    ))}
                  </div>
                  <span className="btn-primary mt-5 w-full justify-center">
                    Open live demo <ArrowOut />
                  </span>
                </GlowCard>
              </a>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- Skills ---------------- */}
      <Section
        id="skills"
        index="04"
        title="Skills"
        intro="Proficiency mapped per domain — the niche (Power BI custom visuals + D3) leads."
      >
        <SkillBars groups={profile.skills} />
      </Section>

      {/* ---------------- Projects — hidden for now; demos cover this ----------------
      <Section
        id="projects"
        index="05"
        title="Projects"
        intro="Public, clickable work that backs the resume."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {profile.projects.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <GlowCard>
                <h3 className="font-display text-lg font-semibold">
                  {p.name}
                </h3>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-accent">
                  {p.stack}
                </p>
                <p className="mt-3 text-sm text-muted">{p.desc}</p>
                <a
                  href={p.link}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  View <ArrowOut />
                </a>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </Section>
      */}

      {/* ---------------- Experience ---------------- */}
      <Section id="experience" index="05" title="Experience">
        <div className="relative space-y-7 pl-8">
          <span className="absolute left-[10px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-accent via-accent2 to-transparent" />
          {profile.experience.map((e, i) => (
            <Reveal key={e.company} delay={i * 90}>
              <div className="relative">
                <span className="absolute -left-[27.5px] top-2 h-3 w-3 rounded-full border-2 border-accent bg-bg" />
                <GlowCard>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold">
                      {e.role}
                      <span className="text-muted"> · {e.company}</span>
                    </h3>
                    <span className="font-mono text-xs text-faint">
                      {e.period}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    {e.points.map((pt, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </GlowCard>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- Writing ---------------- */}
      {posts.length > 0 ? (
        <Section
          id="writing"
          index="06"
          title="Writing"
          intro="Notes, news and practical tips on Power BI custom visuals, D3 and data visualization engineering."
        >
          <div className="grid gap-6 md:grid-cols-3">
            {posts.slice(0, 3).map((p, i) => (
              <Reveal key={p.slug} delay={i * 80}>
                <PostCard post={p} />
              </Reveal>
            ))}
          </div>
          <Reveal delay={240}>
            <Link href="/blog" className="btn-ghost mt-8 inline-flex">
              View all posts <ArrowOut />
            </Link>
          </Reveal>
        </Section>
      ) : null}

      {/* ---------------- Contact ---------------- */}
      <section id="contact" className="mx-auto max-w-content scroll-mt-24 px-6 py-24">
        <Reveal>
          <div className="glass relative overflow-hidden p-10 text-center sm:p-16">
            <p className="kicker mb-4">07 — Contact</p>
            <h2 className="font-display text-3xl font-bold sm:text-5xl">
              Let&apos;s build something
              <br />
              <span className="gradient-text">worth visualizing.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm text-muted">
              Open to full-time roles and freelance Power BI custom-visual work.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={`mailto:${profile.email}`} className="btn-primary">
                {profile.email}
              </a>
              <a href={profile.links.linkedin} className="btn-ghost">
                LinkedIn <ArrowOut />
              </a>
            </div>
          </div>
        </Reveal>

        <footer className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-8 text-xs text-faint sm:flex-row">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <span className="font-mono">
            Built with Next.js · hand-rolled D3 · zero chart deps
          </span>
        </footer>
      </section>
    </main>
  );
}
