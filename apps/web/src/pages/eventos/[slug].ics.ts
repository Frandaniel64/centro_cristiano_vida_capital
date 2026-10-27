import type { APIRoute, GetStaticPaths } from 'astro';
import { eventos, type Evento } from '../../data/sitio';
import { ics } from '../../lib/eventos';

export const getStaticPaths = (() =>
  eventos.map((evento) => ({ params: { slug: evento.slug }, props: { evento } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) => {
  const evento = props.evento as Evento;
  const url = new URL(`/eventos/${evento.slug}`, site).href;
  return new Response(ics(evento, url), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
