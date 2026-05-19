import { Reveal } from "./Reveal";

export function Section({
  id,
  index,
  title,
  intro,
  children,
}: {
  id: string;
  index: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-content scroll-mt-24 px-6 py-20">
      <Reveal>
        <div className="mb-10">
          <p className="kicker mb-3">
            <span className="text-accent">{index}</span> — {title}
          </p>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            {title}
          </h2>
          {intro ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {intro}
            </p>
          ) : null}
        </div>
      </Reveal>
      {children}
    </section>
  );
}
