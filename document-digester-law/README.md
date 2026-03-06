# Document Digester for Santa Maria Law Group

AI-powered document analysis tool for legal documents, contracts, and case files.

## Features

- 📄 Upload PDFs and images (scanned documents)
- 🤖 AI extracts key information automatically:
  - Contract parties and dates
  - Case file details and deadlines
  - Legal citations and references
  - Key terms and obligations
- 🔍 Full-text search across all documents
- 🏷️ Tag and organize documents
- 📊 Export to JSON/CSV

## Quick Start

```bash
# Install
npm run install:all

# Configure
cp backend/.env.example backend/.env
# Add your OPENAI_API_KEY

# Run
npm run dev
```

Opens at: http://localhost:5173

## Tech Stack

- Backend: Node.js, Express, sql.js, OpenAI GPT-4 Vision
- Frontend: React, Vite, Modern CSS
- No native dependencies

## Use Cases

- Contract review and analysis
- Case file organization
- Deadline tracking
- Legal research
- Document discovery
