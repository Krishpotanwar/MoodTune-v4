import { ChatPanel } from "@/components/chat/ChatPanel";
import { Music2, Sparkles, Heart } from "lucide-react";

const SIGNALS = [
  {
    icon: Music2,
    title: "Emotional Search",
    description: "Describe how you feel. We'll find the music that matches."
  },
  {
    icon: Sparkles,
    title: "AI-Powered Discovery",
    description: "Gemini understands context, pgvector finds the closest match."
  },
  {
    icon: Heart,
    title: "Your Taste Profile",
    description: "Rate songs to build a profile that gets smarter over time."
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505]">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20400%20400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]" />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-white/[0.06] to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-amber-500/[0.04] to-transparent blur-3xl pointer-events-none" />

      <div className="relative mx-auto min-h-screen max-w-[1600px] px-6 py-8 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/8 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-white/80" />
            </div>
            <span className="font-serif text-xl tracking-tight text-white">MoodTune</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-500">
            <a href="#" className="hover:text-neutral-300 transition-colors">Discover</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">Your Profile</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">About</a>
          </nav>
        </header>

        {/* Main Content */}
        <section className="grid flex-1 gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16 items-start">
          {/* Left Column - Brand */}
          <aside className="flex flex-col gap-12 pt-4 lg:pt-8">
            <div className="space-y-8">
              {/* Tagline */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/8">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">v4.0 Now Live</span>
              </div>

              <div className="space-y-6">
                <h1 className="font-serif text-5xl lg:text-6xl leading-[1.1] tracking-tight text-white">
                  <span className="block">Music that</span>
                  <span className="block text-neutral-400">feels like</span>
                  <span className="block">you feel.</span>
                </h1>
                <p className="max-w-md text-lg leading-relaxed text-neutral-500">
                  Describe the weather in your head, the speed of the moment, or the way you want the room to feel. MoodTune translates emotion into tracks.
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4">
              {SIGNALS.map((signal, index) => (
                <div
                  key={signal.title}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/6 hover:border-white/10 transition-all duration-500 hover:bg-white/[0.03]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <signal.icon className="w-5 h-5 text-neutral-400 group-hover:text-white/80 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-neutral-200">{signal.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">{signal.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                Online
              </span>
              <span className="w-px h-4 bg-neutral-800" />
              <span>Powered by Gemini + pgvector</span>
            </div>
          </aside>

          {/* Right Column - Chat */}
          <div className="sticky top-8">
            <ChatPanel />
          </div>
        </section>
      </div>
    </main>
  );
}