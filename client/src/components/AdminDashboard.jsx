import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import EventSettings from './EventSettings';

function AdminDashboard() {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = (error) => {
    console.error("Auth Error:", error);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const getPendingPurchases = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return handleAuthError('No token found');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://dholratri-tickets.onrender.com';
      const response = await fetch(`${apiUrl}/api/admin/purchases`, {
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
  }, [getPendingPurchases]); // Proper dependency

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://dholratri-tickets.onrender.com';
      const response = await fetch(`${apiUrl}/api/admin/purchases/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) return handleAuthError('Token error');
      if (!response.ok) throw new Error('Failed to approve purchase');
      getPendingPurchases();
    } catch (error) {
      console.error("Approve Error:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://dholratri-tickets.onrender.com';
      const response = await fetch(`${apiUrl}/api/admin/purchases/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) return handleAuthError('Token error');
      if (!response.ok) throw new Error('Failed to reject purchase');
      getPendingPurchases();
    } catch (error) {
      console.error("Reject Error:", error);
    }
  };

  const handleLogout = () => {
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
      <EventSettings />
      <div className={styles.pendingApprovals}>
        <h2>Pending Approvals ({purchases.length})</h2>
        {purchases.map((purchase) => (
          <div key={purchase._id} className={styles.bookingCard}>
            <h3>{purchase.attendees ? purchase.attendees.join(', ') : 'No Attendees Listed'}</h3>
            <p><strong>Ticket Type:</strong> <span style={{ textTransform: 'capitalize' }}>{purchase.ticketType}</span> ({purchase.ticketCount})</p>
            <p><strong>Phone:</strong> {purchase.phone}</p>
            <p><strong>UTR:</strong> {purchase.utr}</p>
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
