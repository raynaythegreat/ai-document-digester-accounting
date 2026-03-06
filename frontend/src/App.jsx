import React, { useState } from 'react';

const API_BASE = '/api/documents';

function App() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        loadDocuments();
        alert('✅ Receipt uploaded and analyzed!');
      } else {
        alert('Failed to upload');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}?search=${search}`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Category', 'Amount', 'Tax', 'Payment Method'];
    const rows = documents.map(d => [
      d.date,
      d.vendor,
      d.category,
      d.amount,
      d.tax_amount || 0,
      d.payment_method
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
  };

  const totalAmount = documents.reduce((sum, d) => sum + (d.amount || 0), 0);
  const categories = [...new Set(documents.map(d => d.category))];

  React.useEffect(() => {
    loadDocuments();
  }, [search]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1>💰 Document Digester - Accounting</h1>
      <p>Upload receipts and invoices for automatic expense tracking</p>

      <div style={{ margin: '20px 0', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} />
        {uploading && <p>⏳ Uploading and analyzing...</p>}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px', fontSize: '16px' }}
        />
        <button onClick={exportToCSV} style={{ padding: '10px 20px' }}>
          📊 Export CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        <div>
          <h3>Summary</h3>
          <p><strong>Total Expenses:</strong> ${totalAmount.toFixed(2)}</p>
          <p><strong>Total Documents:</strong> {documents.length}</p>
          
          <h4 style={{ marginTop: '20px' }}>By Category</h4>
          {categories.map(cat => (
            <div key={cat} style={{ margin: '5px 0' }}>
              {cat}: ${documents.filter(d => d.category === cat).reduce((s, d) => s + d.amount, 0).toFixed(2)}
            </div>
          ))}
        </div>

        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Vendor</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Category</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{doc.date || '-'}</td>
                  <td style={{ padding: '10px' }}>{doc.vendor || '-'}</td>
                  <td style={{ padding: '10px' }}>{doc.category || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>${(doc.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
