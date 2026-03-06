import React, { useEffect, useState } from 'react';

const DOCUMENTS_API = '/api/documents';
const SETTINGS_API = '/api/settings';
const REQUIRED_KEYS = [
  { key: 'OPENAI_API_KEY', label: 'OpenAI API Key' }
];

function App() {
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [settingsStatus, setSettingsStatus] = useState(() => {
    const initial = {};
    REQUIRED_KEYS.forEach((field) => {
      initial[field.key] = false;
    });
    return initial;
  });
  const [settingsValues, setSettingsValues] = useState(() => {
    const initial = {};
    REQUIRED_KEYS.forEach((field) => {
      initial[field.key] = '';
    });
    return initial;
  });
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsMessageType, setSettingsMessageType] = useState('success');
  const [savingSettings, setSavingSettings] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${DOCUMENTS_API}/upload`, {
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
      const res = await fetch(`${DOCUMENTS_API}?search=${search}`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  const loadSettingsStatus = async () => {
    try {
      const res = await fetch(SETTINGS_API);
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      const statusUpdate = {};
      REQUIRED_KEYS.forEach(({ key }) => {
        statusUpdate[key] = Boolean(data[key]);
      });
      setSettingsStatus(statusUpdate);
    } catch (err) {
      console.error('Settings status error:', err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Category', 'Amount', 'Tax', 'Payment Method'];
    const rows = documents.map((d) => [
      d.date,
      d.vendor,
      d.category,
      d.amount,
      d.tax_amount || 0,
      d.payment_method
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
  };

  useEffect(() => {
    loadDocuments();
  }, [search]);

  useEffect(() => {
    loadSettingsStatus();
  }, []);

  const totalAmount = documents.reduce((sum, d) => sum + (d.amount || 0), 0);
  const categories = [...new Set(documents.map((d) => d.category))];
  const tabs = [
    { id: 'documents', label: 'Documents' },
    { id: 'settings', label: 'Settings' }
  ];
  const messageColor = settingsMessageType === 'success' ? '#2a9d8f' : '#d62828';

  const handleSettingsChange = (key, value) => {
    setSettingsValues((prev) => ({ ...prev, [key]: value }));
    setSettingsMessage('');
  };

  const handleSettingsSave = async () => {
    setSettingsMessage('');
    setSavingSettings(true);
    try {
      const payload = {};
      REQUIRED_KEYS.forEach(({ key }) => {
        payload[key] = settingsValues[key] ?? '';
      });

      const res = await fetch(SETTINGS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save settings');
      }

      await res.json();
      setSettingsMessage('Settings saved successfully.');
      setSettingsMessageType('success');
      loadSettingsStatus();
    } catch (error) {
      console.error('Save settings error:', error);
      setSettingsMessage(`Failed to save settings: ${error.message}`);
      setSettingsMessageType('error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>💰 Document Digester - Accounting</h1>
            <p>Upload receipts and invoices for automatic expense tracking</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '999px',
                border: activeTab === tab.id ? '1px solid #333' : '1px solid #cfcfcf',
                background: activeTab === tab.id ? '#333' : '#fff',
                color: activeTab === tab.id ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'documents' ? (
        <>
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
              <p>
                <strong>Total Expenses:</strong> ${totalAmount.toFixed(2)}
              </p>
              <p>
                <strong>Total Documents:</strong> {documents.length}
              </p>

              <h4 style={{ marginTop: '20px' }}>By Category</h4>
              {categories.map((cat) => (
                <div key={cat} style={{ margin: '5px 0' }}>
                  {cat}: ${documents.filter((d) => d.category === cat).reduce((s, d) => s + d.amount, 0).toFixed(2)}
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
                  {documents.map((doc) => (
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
        </>
      ) : (
        <section
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div>
            <h2>API Key Settings</h2>
            <p>Manage the API keys that power document digestion.</p>
          </div>

          {REQUIRED_KEYS.map((field) => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <label htmlFor={field.key} style={{ fontWeight: '600' }}>
                  {field.label}
                </label>
                <span
                  style={{
                    color: settingsStatus[field.key] ? '#2a9d8f' : '#d62828',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  {settingsStatus[field.key] ? '✅ Configured' : '❌ Missing'}
                </span>
              </div>
              <input
                id={field.key}
                type="password"
                value={settingsValues[field.key]}
                placeholder="Enter API Key"
                onChange={(e) => handleSettingsChange(field.key, e.target.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  fontSize: '16px'
                }}
              />
            </div>
          ))}

          {settingsMessage && (
            <div style={{ color: messageColor, fontWeight: 600 }}>{settingsMessage}</div>
          )}

          <button
            onClick={handleSettingsSave}
            disabled={savingSettings}
            style={{
              alignSelf: 'flex-start',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#333',
              color: '#fff',
              fontSize: '16px',
              cursor: savingSettings ? 'not-allowed' : 'pointer'
            }}
            type="button"
          >
            {savingSettings ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </section>
      )}
    </div>
  );
}

export default App;
