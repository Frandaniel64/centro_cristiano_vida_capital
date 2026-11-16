#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ClienteApi } from './cliente.js';
import { leerConfig } from './config.js';
import { crearServidor } from './servidor.js';

const servidor = crearServidor(new ClienteApi(leerConfig()));
await servidor.connect(new StdioServerTransport());
console.error('ccvida-contenido: servidor MCP listo (stdio).');
