import Link from "next/link";
import { ArrowUpRight, Calculator, Code2, Clock3, DollarSign, GraduationCap, ImageIcon, Palette, Shuffle, Type, Wrench } from "lucide-react";
import type { Tool } from "@/lib/tools";

const icons:any={Calculators:Calculator,Finance:DollarSign,Student:GraduationCap,"Date & Time":Clock3,Developer:Code2,Text:Type,Image:ImageIcon,Design:Palette,"CSS & Design":Palette,Random:Shuffle,Utility:Wrench,Converters:Wrench,Security:Wrench,Health:Calculator,Math:Calculator,Productivity:Clock3};
export function ToolCard({tool}:{tool:Tool}){
 const Icon=icons[tool.category]||Wrench;
 return <Link href={"/tools/"+tool.slug} className="card group block p-5 transition hover:-translate-y-1 hover:shadow-xl">
   <div className="mb-4 flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950"><Icon size={21}/></div><ArrowUpRight className="text-gray-400 transition group-hover:text-indigo-600" size={19}/></div>
   <h3 className="font-bold">{tool.name}</h3><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{tool.description}</p>
 </Link>
}