import React, { useState } from 'react';

const API_BASE = '/api/documents';

function App() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

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
        alert('✅ Document uploaded and analyzed!');
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

  React.useEffect(() => {
    loadDocuments();
  }, [search]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>⚖️ Document Digester - Law Group</h1>
      <p>Upload legal documents for AI analysis</p>

      <div style={{ margin: '20px 0', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} />
        {uploading && <p>⏳ Uploading and analyzing...</p>}
      </div>

      <input
        type="text"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '20px', fontSize: '16px' }}
      />

      <div style={{ display: 'grid', gap: '15px' }}>
        {documents.map(doc => (
          <div key={doc.id} style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>{doc.original_name}</h3>
            <p><strong>Summary:</strong> {doc.summary}</p>
            <p><strong>Parties:</strong> {doc.parties?.join(', ') || 'None'}</p>
            <p><strong>Deadlines:</strong> {doc.deadlines?.join(', ') || 'None'}</p>
            <p><strong>Case Ref:</strong> {doc.case_reference || 'Not assigned'}</p>
            <small style={{ color: '#666' }}>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
