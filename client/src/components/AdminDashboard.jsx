import { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    const response = await fetch(`https://dholratri-server.onrender.com/api/admin/bookings');
    const data = await response.json();
    setBookings(data);
  };

  // useEffect runs this function once when the component loads
  useEffect(() => {
    fetchBookings();
  }, []);

  const handleApprove = async (id) => {
    await fetch(`https://dholratri-server.onrender.com/api/admin/bookings/${id}/approve`, { method: 'PATCH' });
    fetchBookings(); // Refresh the list
  };

  const handleReject = async (id) => {
    await fetch(`https://dholratri-server.onrender.com/api/admin/bookings/${id}/reject`, { method: 'PATCH' });
    fetchBookings(); // Refresh the list
  };

  return (
    <div className={styles.dashboard}>
      <h1>Admin Dashboard</h1>
      <h2>Pending Bookings ({bookings.length})</h2>
      {bookings.map((booking) => (
        <div key={booking._id} className={styles.bookingCard}>
          <h3>{booking.fullName}</h3>
          <p><strong>Phone:</strong> {booking.phone}</p>
          <p><strong>UTR:</strong> {booking.utr}</p>
          <a href={`https://dholratri-server.onrender.com/${booking.screenshotPath}`} target="_blank" rel="noopener noreferrer" className={styles.screenshotLink}>
            View Screenshot
          </a>
          <div className={styles.actions}>
            <button onClick={() => handleApprove(booking._id)} className={styles.approveBtn}>Approve</button>
            <button onClick={() => handleReject(booking._id)} className={styles.rejectBtn}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
