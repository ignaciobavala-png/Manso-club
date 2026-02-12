export function SectionLayout({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16">
          <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter text-black leading-none">
            {title}<span className="text-zinc-200">_</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mt-6 ml-2 italic">
            {subtitle}
          </p>
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </main>
  );
}
