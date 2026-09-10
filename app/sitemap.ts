import type { MetadataRoute } from "next"; import {tools} from "@/lib/tools";
export default function sitemap():MetadataRoute.Sitemap{const base="https://tool-nest-phi.vercel.app";return [{url:base,lastModified:new Date()},{url:base+"/tools",lastModified:new Date()},...tools.map(t=>({url:`${base}/tools/${t.slug}`,lastModified:new Date()}))]}
