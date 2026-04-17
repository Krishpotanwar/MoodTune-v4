export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]" />
      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-20 sm:px-10">
        <div className="inline-flex w-fit rounded-full border border-black/10 bg-white/70 px-4 py-1 text-sm font-medium text-black/70 backdrop-blur">
          MoodTune v4 · Phase 1 Scaffold
        </div>
        <div className="space-y-6">
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            The Next.js rebuild is live and ready for Phase 2 features.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-700">
            This page stays intentionally light while we wire the database,
            session middleware, embeddings, and health checks underneath it.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-medium text-slate-500">API</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              <code>/api/health</code>
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Verifies Supabase, Gemini reachability, embeddings, and corpus size.
            </p>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Routing</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              Cookie-first
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Middleware mints a durable <code>mt_sid</code> and routes persist it idempotently.
            </p>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Bundled ML</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              MiniLM q8
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Local embeddings are traced into server output from <code>public/models</code>.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
