import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import documentsRoutes from './routes/documents.js';

const app = express();
const PORT = process.env.PORT || 4001;

await initDatabase();

app.use(cors());
app.use(express.json());

app.use('/api/documents', documentsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Document Digester - Law Group' });
});

app.listen(PORT, () => {
  console.log(`⚖️  Document Digester (Law) running at http://localhost:${PORT}`);
});
