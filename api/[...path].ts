import type { IncomingMessage, ServerResponse } from 'http';

// Minimal test - no Express
export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'ok',
    url: req.url,
    cwd: process.cwd(),
    vercel: !!process.env.VERCEL
  }));
}
