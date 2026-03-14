import { ReactNode } from "react";

function PageSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,235,0.88))] p-5 shadow-[0_28px_60px_-34px_rgba(19,24,42,0.45)] ring-1 ring-white/55 backdrop-blur-sm transition-transform duration-300 ease-out hover:-translate-y-0.5 sm:p-6">
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,168,76,0.22),transparent_70%)]" />
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#7a6853]">
          Control Module
        </p>
        <h2 className="text-xl font-semibold text-[#1d1a2b] sm:text-2xl">
          {title}
        </h2>
        <p className="text-sm text-[#4a4763] sm:text-base">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export default PageSection;
