import { tools } from "@/lib/tools";
import { ToolRunner } from "@/components/ToolRunner";
import { ToolCard } from "@/components/ToolCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams(){return tools.map(t=>({slug:t.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params; const t=tools.find(x=>x.slug===slug); if(!t)return {};
 return {title:`${t.name} — Free Online Tool | ToolNest`,description:t.description,alternates:{canonical:`/tools/${t.slug}`}};
}
export default async function ToolPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const t=tools.find(x=>x.slug===slug); if(!t)notFound();
 const related=tools.filter(x=>x.category===t.category&&x.slug!==t.slug).slice(0,4);
 return <main className="mx-auto max-w-6xl px-4 py-10">
  <div className="mb-8 text-sm text-gray-500"><a href="/">Home</a> / <a href="/tools">Tools</a> / {t.name}</div>
  <div className="mb-8"><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{t.category}</span><h1 className="mt-4 text-4xl font-black md:text-5xl">{t.name}</h1><p className="mt-3 max-w-3xl text-lg text-gray-500">{t.description}</p></div>
  <ToolRunner slug={t.slug}/>
  <article className="mt-12 grid gap-8 md:grid-cols-[1fr_300px]"><div className="card p-7"><h2 className="text-2xl font-black">How to use {t.name}</h2><p className="mt-4 leading-8 text-gray-600 dark:text-gray-300">Enter your values or paste your data into the tool above and choose the action. Results are calculated instantly. For browser-based utilities, your input stays on your device unless a feature explicitly requires a remote service.</p><h2 className="mt-8 text-2xl font-black">Frequently asked questions</h2><h3 className="mt-5 font-bold">Is ToolNest free?</h3><p className="mt-2 text-gray-600 dark:text-gray-300">Yes. The core tools are designed to be free to use.</p><h3 className="mt-5 font-bold">Do I need an account?</h3><p className="mt-2 text-gray-600 dark:text-gray-300">No account is required for the core tools.</p></div><aside><h2 className="mb-4 text-xl font-black">Related tools</h2><div className="space-y-4">{related.map(x=><ToolCard key={x.slug} tool={x}/>)}</div></aside></article>
 </main>
}