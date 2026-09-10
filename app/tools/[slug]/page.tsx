import { tools } from "@/lib/tools";
import { ToolRunner } from "@/components/ToolRunner";
import { ToolCard } from "@/components/ToolCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return tools.map((t) => ({
    slug: t.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);

  if (!tool) {
    return {};
  }

  const title = `${tool.name} - Free Online Tool | ToolNest`;

  const description = `${tool.description} Use this free online ${tool.name.toLowerCase()} on ToolNest with instant results and no account required.`;

  return {
    title,
    description,

    alternates: {
      canonical: `/tools/${tool.slug}`,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title,
      description,
      type: "website",
      url: `/tools/${tool.slug}`,
      siteName: "ToolNest",
    },

    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tool = tools.find((t) => t.slug === slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = tools
    .filter(
      (t) =>
        t.category === tool.category &&
        t.slug !== tool.slug
    )
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-sm text-gray-500"
      >
        <a
          href="/"
          className="hover:text-indigo-600"
        >
          Home
        </a>

        <span className="mx-2">/</span>

        <a
          href="/tools"
          className="hover:text-indigo-600"
        >
          Tools
        </a>

        <span className="mx-2">/</span>

        <span className="text-gray-700 dark:text-gray-300">
          {tool.name}
        </span>
      </nav>

      {/* Tool Header */}
      <header className="mb-8">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
          {tool.category}
        </span>

        <h1 className="mt-4 text-4xl font-black md:text-5xl">
          {tool.name}
        </h1>

        <p className="mt-3 max-w-3xl text-lg text-gray-500 dark:text-gray-400">
          {tool.description}
        </p>
      </header>

      {/* Actual Tool */}
      <ToolRunner slug={tool.slug} />

      {/* SEO Content + Related Tools */}
      <article className="mt-12 grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="card p-7">
          <h2 className="text-2xl font-black">
            How to use {tool.name}
          </h2>

          <p className="mt-4 leading-8 text-gray-600 dark:text-gray-300">
            Enter your values or paste your data into the tool above
            and choose the required action. The result is calculated
            instantly, making this tool useful for students,
            professionals, and everyday calculations.
          </p>

          <h2 className="mt-8 text-2xl font-black">
            Why use this {tool.name}?
          </h2>

          <p className="mt-4 leading-8 text-gray-600 dark:text-gray-300">
            ToolNest provides free online tools that are simple,
            fast, and easy to use. You can use this tool directly
            in your browser without creating an account.
          </p>

          <h2 className="mt-8 text-2xl font-black">
            Frequently asked questions
          </h2>

          <h3 className="mt-5 font-bold">
            Is ToolNest free?
          </h3>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Yes. The core tools on ToolNest are free to use.
          </p>

          <h3 className="mt-5 font-bold">
            Do I need an account?
          </h3>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            No account is required for the core online tools.
          </p>

          <h3 className="mt-5 font-bold">
            Does this tool work on mobile?
          </h3>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Yes. ToolNest tools are designed to work in modern
            desktop and mobile web browsers.
          </p>

          <h3 className="mt-5 font-bold">
            Are my inputs stored?
          </h3>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Browser-based tools process your input in the browser
            unless the particular feature explicitly requires a
            remote service.
          </p>
        </div>

        {/* Related Tools */}
        <aside>
          <h2 className="mb-4 text-xl font-black">
            Related tools
          </h2>

          <div className="space-y-4">
            {relatedTools.map((relatedTool) => (
              <ToolCard
                key={relatedTool.slug}
                tool={relatedTool}
              />
            ))}
          </div>
        </aside>
      </article>
    </main>
  );
}
