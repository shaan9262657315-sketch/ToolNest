import { tools } from "@/lib/tools";
import { ToolCard } from "@/components/ToolCard";
import Link from "next/link";

const featuredSlugs = [
  "percentage-calculator",
  "age-difference",
  "bmi-calculator",
  "loan-calculator",
  "cgpa-to-percentage-calculator",
  "word-character-counter",
  "image-compressor",
  "qr-code-generator",
  "password-generator",
  "json-formatter",
];

export default function Home() {
  const featured = featuredSlugs
    .map((s) => tools.find((t) => t.slug === s))
    .filter(Boolean) as typeof tools;

  return (
    <main>
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center md:py-28">

          <div className="mx-auto mb-5 inline-flex rounded-full border bg-white px-4 py-2 text-sm font-semibold shadow-sm dark:bg-slate-900">
            ⚡ Shaan E Sahil · 100+ Free Tools
          </div>

          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Everything you need,
            <br />
            <span className="gradient-text">in one toolkit.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Fast calculators, converters, developer utilities, student tools,
            image tools, PDF tools and productivity utilities — designed to
            work directly in your browser.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex rounded-2xl bg-indigo-600 px-7 py-4 font-bold text-white shadow-lg hover:bg-indigo-700"
            >
              Explore all tools →
            </Link>
          </div>

          <p className="mt-6 text-sm font-semibold text-gray-500">
            Built by Shaan E Sahil
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-bold text-indigo-600">MOST USEFUL</p>
            <h2 className="mt-1 text-3xl font-black">Popular tools</h2>
          </div>

          <Link href="/tools" className="font-semibold text-indigo-600">
            View all →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="border-y bg-white/60 py-14 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-black">
            Built for everyday problems
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="card p-6">
              <b>Privacy-first</b>
              <p className="mt-2 text-gray-500">
                Sensitive data is processed locally whenever practical.
              </p>
            </div>

            <div className="card p-6">
              <b>Fast by design</b>
              <p className="mt-2 text-gray-500">
                Simple tools run directly in your browser.
              </p>
            </div>

            <div className="card p-6">
              <b>One clean toolkit</b>
              <p className="mt-2 text-gray-500">
                No account required for core utilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} ToolNest · Free Online Utilities
        </p>
        <p className="mt-2 font-semibold">
          Built by Shaan E Sahil
        </p>
      </footer>
    </main>
  );
}

