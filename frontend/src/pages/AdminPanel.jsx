import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getPendingStudents,
  approveStudent,
  rejectStudent,
  revokeAccess,
  restoreAccess,
  deleteStudent,
  getAllStudents,
  resetDevice,
  getSearchLogs,
  getStats
} from '../api';

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p, st, l] = await Promise.all([getStats(), getPendingStudents(), getAllStudents(), getSearchLogs()]);
      setStats(s.data);
      setPending(p.data.students || []);
      setStudents(st.data.students || []);
      setLogs(l.data.logs || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveStudent(id);
      toast.success('Approved successfully! ✅');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve student');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectStudent(id);
      toast.success('Rejected successfully! ❌');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject student');
    }
  };

  const handleRevoke = async (id, name) => {
    if (!window.confirm(`Revoke all access for ${name}? The student will be logged out immediately.`)) return;
    try {
      await revokeAccess(id);
      toast.success(`Access revoked for ${name}! 🚫`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to revoke access');
    }
  };

  const handleRestore = async (id, name) => {
    try {
      await restoreAccess(id);
      toast.success(`Access restored for ${name}! ✅`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to restore access');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ Permanently DELETE student "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      toast.success(`Student ${name} deleted permanently! 🗑️`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete student');
    }
  };

  const handleResetDevice = async (id, name) => {
    if (!window.confirm(`Reset device token for ${name}?`)) return;
    try {
      await resetDevice(id);
      toast.success('Device token reset! 📱');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset device token');
    }
  };

  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'pending', icon: '⏳', label: `Pending (${pending.length})` },
    { id: 'students', icon: '👥', label: `All Students (${students.length})` },
    { id: 'logs', icon: '🔍', label: 'Search Logs' },
  ];

  const StatCard = ({ icon, label, value, color }) => (
    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: `2px solid ${color}`, textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: '800', color }}>{value ?? 0}</div>
      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F4F3FE' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: tab === t.id ? '#3C3489' : 'white', color: tab === t.id ? 'white' : '#333', fontWeight: '600', fontSize: '14px', cursor: 'pointer', boxShadow: tab === t.id ? '0 4px 12px rgba(60,52,137,0.3)' : '0 1px 3px rgba(0,0,0,0.1)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px' }}>⏳</div>
            <p style={{ marginTop: '12px', color: '#666' }}>Loading data...</p>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && stats && (
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1A1035' }}>📊 Dashboard Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <StatCard icon="👥" label="Total Students" value={stats.total_students} color="#3C3489" />
                  <StatCard icon="⏳" label="Pending" value={stats.pending} color="#856404" />
                  <StatCard icon="✅" label="Approved" value={stats.approved} color="#085041" />
                  <StatCard icon="❌" label="Rejected / Revoked" value={stats.rejected} color="#8B1A1A" />
                  <StatCard icon="🔍" label="Total Searches" value={stats.total_searches} color="#0C447C" />
                </div>
              </div>
            )}

            {tab === 'pending' && (
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1A1035' }}>⏳ Pending Registration Requests ({pending.length})</h2>
                {pending.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                    <span style={{ fontSize: '48px' }}>✅</span>
                    <p style={{ marginTop: '12px', color: '#666' }}>No pending requests right now!</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {pending.map((s) => (
                      <div key={s.id} style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #E0DDEF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', color: '#1A1035' }}>{s.name}</h3>
                          <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Student ID: <strong>{s.student_id}</strong> | Enroll ID: <strong>{s.college_enroll_id}</strong></p>
                          <p style={{ fontSize: '13px', color: '#666' }}>📧 {s.email}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleApprove(s.id)} style={{ background: '#085041', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✅ Approve</button>
                          <button onClick={() => handleReject(s.id)} style={{ background: '#8B1A1A', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>❌ Reject</button>
                          <button onClick={() => handleDelete(s.id, s.name)} style={{ background: '#666', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'students' && (
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1A1035' }}>👥 Registered Students ({students.length})</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <thead>
                      <tr style={{ background: '#3C3489', color: 'white' }}>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Name</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Student ID</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Enroll ID</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Email</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Status</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Device</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Actions (Admin Only)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#F8F7FF', borderBottom: '1px solid #F0EEFF' }}>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{s.name}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px' }}>{s.student_id}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{s.college_enroll_id}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{s.email}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: s.status === 'approved' ? '#D4EDDA' : s.status === 'pending' ? '#FFF3CD' : '#F8D7DA', color: s.status === 'approved' ? '#155724' : s.status === 'pending' ? '#856404' : '#721C24' }}>
                              {s.status === 'approved' ? 'Active / Approved' : s.status === 'pending' ? 'Pending' : 'Revoked / Rejected'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                            {s.has_device ? <span style={{ color: '#085041', fontWeight: '500' }}>📱 Locked</span> : <span style={{ color: '#999' }}>None</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {s.status === 'approved' ? (
                                <button onClick={() => handleRevoke(s.id, s.name)} title="Revoke Access" style={{ background: '#8B1A1A', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  🚫 Revoke
                                </button>
                              ) : (
                                <button onClick={() => handleRestore(s.id, s.name)} title="Restore Access" style={{ background: '#085041', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  ✅ Restore
                                </button>
                              )}

                              {s.has_device && (
                                <button onClick={() => handleResetDevice(s.id, s.name)} title="Reset Device Lock" style={{ background: '#ED7D31', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                  📱 Reset
                                </button>
                              )}

                              <button onClick={() => handleDelete(s.id, s.name)} title="Permanently Delete" style={{ background: '#333', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'logs' && (
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1A1035' }}>🔍 Search Logs ({logs.length})</h2>
                {logs.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                    <span style={{ fontSize: '48px' }}>📭</span>
                    <p style={{ marginTop: '12px', color: '#666' }}>No searches recorded yet!</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      <thead>
                        <tr style={{ background: '#3C3489', color: 'white' }}>
                          <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Student</th>
                          <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Query</th>
                          <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Results</th>
                          <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px' }}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, i) => (
                          <tr key={log.id} style={{ background: i % 2 === 0 ? 'white' : '#F8F7FF', borderBottom: '1px solid #F0EEFF' }}>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              <strong>{log.student_name}</strong><br />
                              <span style={{ fontSize: '11px', color: '#999' }}>{log.student_id}</span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', maxWidth: '300px' }}>{log.query}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{log.results_count}</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666' }}>
                              {log.searched_at ? new Date(log.searched_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}