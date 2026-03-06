# Document Digester for Central Coast Accounting

AI-powered financial document analyzer for receipts, invoices, and expenses.

## Features

- 📄 Upload receipts, invoices, bank statements
- 🤖 AI extracts:
  - Vendor name
  - Amount and date
  - Category (auto-assigned)
  - Line items
  - Tax amounts
- 💰 Expense tracking dashboard
- 📊 Export to CSV for QuickBooks/Excel
- 🏷️ Category filtering

## Quick Start

```bash
npm run install:all
cp backend/.env.example backend/.env
# Add OPENAI_API_KEY
npm run dev
```

Opens at: http://localhost:5173

## Categories

Auto-categorizes into:
- Office Supplies
- Meals
- Travel
- Equipment
- Software
- Services
- Utilities
- Rent
- Insurance
- Professional Services
- Marketing
- Other

## Export

Click "Export CSV" to download all expenses for import into QuickBooks, Xero, or Excel.
