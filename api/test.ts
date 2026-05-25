import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const p1 = path.join(__dirname, '../backend/dim-data.json');
  const p2 = path.join(__dirname, '../../backend/dim-data.json');
  const p3 = '/var/task/backend/dim-data.json';

  res.json({
    dirname: __dirname,
    p1exists: fs.existsSync(p1),
    p2exists: fs.existsSync(p2),
    p3exists: fs.existsSync(p3),
    files: fs.readdirSync('/var/task').slice(0, 20).join(', '),
  });
}
