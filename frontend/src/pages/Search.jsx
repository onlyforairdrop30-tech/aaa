import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { search, getSearchHistory } from '../api';

function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (query.trim()) onSearch(query.trim()); };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', maxWidth: '700px', margin: '0 auto', gap: '12px' }}>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the web..." style={{ flex: 1, padding: '16px 24px', fontSize: '16px', border: '2px solid #E0DDEF', borderRadius: '50px', outline: 'none' }} />
      <button type="submit" disabled={loading || !query.trim()} style={{ padding: '16px 32px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳' : '🔍'} Search
      </button>
    </form>
  );
}

function ResultCard({ result }) {
  return (
    <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'white', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px', border: '1px solid #E0DDEF', textDecoration: 'none' }}>
      <div style={{ fontSize: '12px', color: '#085041', marginBottom: '4px' }}>{result.url}</div>
      <h3 style={{ fontSize: '18px', color: '#1A1035', marginBottom: '8px' }}>{result.title}</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>{result.description}</p>
    </a>
  );
}

export default function Search({ user }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [history, setHistory] = useState([]);
  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => { try { const res = await getSearchHistory(); setHistory(res.data.history); } catch (err) {} };
  const handleSearch = async (query) => {
    setLoading(true); setSearchedQuery(query); setResults([]);
    try {
      const res = await search(query);
      setResults(res.data.results);
      if (res.data.results.length === 0) toast('No results found.', { icon: '🤷' });
      loadHistory();
    } catch (err) { toast.error(err.response?.data?.detail || 'Search failed'); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ minHeight: '100vh', background: '#F4F3FE' }}>
      <div style={{ background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 100%)', padding: '60px 20px 40px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '32px', marginBottom: '8px' }}>🔍 College Search Engine</h1>
        <p style={{ color: '#C8C4F8', fontSize: '16px', marginBottom: '32px' }}>Welcome, {user?.name}!</p>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '40px' }}><div style={{ fontSize: '36px' }}>⏳</div><p style={{ color: '#666' }}>Searching...</p></div>}
        {!loading && searchedQuery && <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>{results.length} results for "<strong>{searchedQuery}</strong>"</p>}
        {!loading && results.map((r, i) => <ResultCard key={i} result={r} />)}
        {!loading && !searchedQuery && history.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E0DDEF' }}>
            <h3 style={{ fontSize: '18px', color: '#1A1035', marginBottom: '16px' }}>📋 Recent Searches</h3>
            {history.slice(0, 5).map((h, i) => (
              <button key={i} onClick={() => handleSearch(h.query)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #F0EEFF', padding: '12px 0', cursor: 'pointer' }}>
                <span style={{ fontSize: '14px' }}>🔍 {h.query}</span>
                <span style={{ fontSize: '12px', color: '#999' }}>{h.results_count} results</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}