import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { dbOperations } from '../db/database.js';
import { analyzeDocument } from '../services/openai.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    cb(null, extname && mimetype);
  }
});

router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let extractedText = '';
    
    // Extract text from PDF
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    }

    // Analyze with AI
    const analysis = await analyzeDocument(req.file.path, extractedText);

    // Save to database
    const result = dbOperations.run(`
      INSERT INTO documents (
        filename, original_name, file_path, file_type, extracted_text,
        parties, important_dates, key_terms, deadlines, legal_citations, summary,
        case_reference, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.mimetype,
      extractedText,
      JSON.stringify(analysis.parties),
      JSON.stringify(analysis.important_dates),
      JSON.stringify(analysis.key_terms),
      JSON.stringify(analysis.deadlines),
      JSON.stringify(analysis.legal_citations),
      analysis.summary,
      req.body.case_reference || null,
      req.body.tags || null
    ]);

    const saved = dbOperations.get('SELECT * FROM documents WHERE id = ?', [result.lastInsertRowid]);

    res.json({
      success: true,
      document: {
        ...saved,
        parties: JSON.parse(saved.parties || '[]'),
        important_dates: JSON.parse(saved.important_dates || '[]'),
        key_terms: JSON.parse(saved.key_terms || '[]'),
        deadlines: JSON.parse(saved.deadlines || '[]'),
        legal_citations: JSON.parse(saved.legal_citations || '[]')
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const { search, tag } = req.query;
    
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (extracted_text LIKE ? OR original_name LIKE ? OR summary LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const docs = dbOperations.all(query, params);
    
    res.json(docs.map(d => ({
      ...d,
      parties: JSON.parse(d.parties || '[]'),
      important_dates: JSON.parse(d.important_dates || '[]'),
      key_terms: JSON.parse(d.key_terms || '[]'),
      deadlines: JSON.parse(d.deadlines || '[]'),
      legal_citations: JSON.parse(d.legal_citations || '[]')
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const doc = dbOperations.get('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      ...doc,
      parties: JSON.parse(doc.parties || '[]'),
      important_dates: JSON.parse(doc.important_dates || '[]'),
      key_terms: JSON.parse(doc.key_terms || '[]'),
      deadlines: JSON.parse(doc.deadlines || '[]'),
      legal_citations: JSON.parse(doc.legal_citations || '[]')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { case_reference, tags, status } = req.body;
    
    dbOperations.run(
      'UPDATE documents SET case_reference = ?, tags = ?, status = ? WHERE id = ?',
      [case_reference, tags, status, req.params.id]
    );
    
    const updated = dbOperations.get('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const doc = dbOperations.get('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    
    if (doc && fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }
    
    dbOperations.run('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
