import type { APIRoute } from 'astro';
import { armarRobotsTxt } from '../lib/llms';

export const prerender = false;

// Pasa aun en modo construcción (el middleware lo deja en ARCHIVOS).
// Para bloquear algún bot de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended), va en armarRobotsTxt.
export const GET: APIRoute = ({ site }) =>
  new Response(armarRobotsTxt(site!), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
