import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import EventSettings from './EventSettings'; // 1. IMPORT our new component

function AdminDashboard() {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = (error) => { /* ... (unchanged) ... */
    console.error("Auth Error:", error);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const getPendingPurchases = async () => { /* ... (unchanged) ... */
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { return handleAuthError('No token found'); }
      const response = await fetch('/api/admin/purchases', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        return handleAuthError('Token is invalid or expired');
      }
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setPurchases(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getPendingPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleApprove = async (id) => { /* ... (unchanged) ... */
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/purchases/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) return handleAuthError('Token error');
      getPendingPurchases(); 
    } catch (error) {
      console.error("Approve Error:", error);
    }
  };

  const handleReject = async (id) => { /* ... (unchanged) ... */
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/purchases/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) return handleAuthError('Token error');
      getPendingPurchases();
    } catch (error) {
      console.error("Reject Error:", error);
    }
  };

  const handleLogout = () => { /* ... (unchanged) ... */
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.headerBar}>
        <h1>Admin Dashboard</h1>
        <div className={styles.headerActions}>
          <button onClick={getPendingPurchases} className={styles.refreshBtn} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh List'}
          </button>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Log Out
          </button>
        </div>
      </div>
      
      {/* 2. RENDER THE NEW SETTINGS COMPONENT */}
      <EventSettings />

      {/* --- This is your existing pending approvals list --- */}
      <div className={styles.pendingApprovals}>
        <h2>Pending Approvals ({purchases.length})</h2>
        {purchases.map((purchase) => (
          <div key={purchase._id} className={styles.bookingCard}>
            <h3>{purchase.attendees ? purchase.attendees.join(', ') : 'No Attendees Listed'}</h3>
            <p><strong>Ticket Type:</strong> <span style={{ textTransform: 'capitalize' }}>{purchase.ticketType}</span> ({purchase.ticketCount})</p>
            <p><strong>Phone:</strong> {purchase.phone}</p>
            <p><strong>UTR:</strong> {purchase.utr}</p>
            {/* Note: Screenshot link will be a Cloudinary URL after you upload one */}
            <a href={purchase.screenshotPath} target="_blank" rel="noopener noreferrer" className={styles.screenshotLink}>
              View Screenshot
            </a>
            <div className={styles.actions}>
              <button onClick={() => handleApprove(purchase._id)} className={styles.approveBtn}>Approve</button>
              <button onClick={() => handleReject(purchase._id)} className={styles.rejectBtn}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;