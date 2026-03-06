import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import documentsRoutes from './routes/documents.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 4002;

await initDatabase();

app.use(cors());
app.use(express.json());

app.use('/api/documents', documentsRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Document Digester - Accounting' });
});

app.listen(PORT, () => {
  console.log(`💰 Document Digester (Accounting) running at http://localhost:${PORT}`);
});
