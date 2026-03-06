import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const REQUIRED_KEYS = ['OPENAI_API_KEY'];
const envPath = path.resolve(process.cwd(), '.env');

router.get('/', (req, res) => {
  const configured = {};
  REQUIRED_KEYS.forEach((key) => {
    configured[key] = Boolean(process.env[key]);
  });
  res.json(configured);
});

router.post('/', (req, res) => {
  try {
    const updates = {};
    REQUIRED_KEYS.forEach((key) => {
      const rawValue = req.body ? req.body[key] : undefined;
      updates[key] = rawValue == null ? '' : String(rawValue).trim();
    });

    const existingContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    const lines = existingContent.length ? existingContent.split(/\r?\n/) : [];
    const updatedLines = [];
    const seenKeys = new Set();

    for (const line of lines) {
      const index = line.indexOf('=');
      if (index !== -1) {
        const currentKey = line.slice(0, index).trim();
        if (REQUIRED_KEYS.includes(currentKey)) {
          updatedLines.push(`${currentKey}=${updates[currentKey]}`);
          seenKeys.add(currentKey);
          continue;
        }
      }
      updatedLines.push(line);
    }

    REQUIRED_KEYS.forEach((key) => {
      if (!seenKeys.has(key)) {
        updatedLines.push(`${key}=${updates[key]}`);
      }
      process.env[key] = updates[key];
    });

    const finalContent = updatedLines.join('\n');
    fs.writeFileSync(envPath, finalContent.endsWith('\n') ? finalContent : `${finalContent}\n`);

    const configured = {};
    REQUIRED_KEYS.forEach((key) => {
      configured[key] = Boolean(updates[key]);
    });

    res.json({ success: true, configured });
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({ error: 'Unable to save settings' });
  }
});

export default router;
