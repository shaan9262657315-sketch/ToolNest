"use client";

import Link from "next/link";
import { Search, Wrench, X } from "lucide-react";
import { useState } from "react";
import { tools } from "@/lib/tools";

export function Header() {
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();

  const results = query
    ? tools
        .filter((t) =>
          `${t.name} ${t.category} ${t.description}`
            .toLowerCase()
            .includes(query)
        )
        .slice(0, 8)
    : [];

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">

        {/* BRAND */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-xl font-black"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <Wrench size={20} />
          </span>

          <span>
            Tool<span className="gradient-text">Nest</span>
          </span>
        </Link>

        {/* SEARCH */}
        <div className="relative ml-auto w-full max-w-xl">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQ("");
            }}
            placeholder="Search 100+ tools..."
            aria-label="Search tools"
            className="tool-input w-full pl-10 pr-10"
          />

          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-3 top-2.5 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          )}

          {results.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              {results.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  onClick={() => setQ("")}
                  className="block rounded-xl p-3 transition hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <div className="font-bold">{tool.name}</div>

                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {tool.category}
                  </div>

                  <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                    {tool.description}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl border bg-white p-4 text-sm text-gray-500 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              No tools found for <b>&quot;{q}&quot;</b>
            </div>
          )}
        </div>

        {/* ALL TOOLS */}
        <Link
          href="/tools"
          className="hidden shrink-0 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-gray-100 md:block dark:hover:bg-slate-800"
        >
          All Tools
        </Link>
      </div>

      {/* MOBILE BRANDING */}
      <div className="border-t px-4 py-2 text-center text-xs font-semibold text-gray-500 md:hidden dark:border-slate-800">
        Shaan E Sahil · Free Online Tools
      </div>
    </header>
  );
}

