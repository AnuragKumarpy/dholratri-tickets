import { useState } from 'react';
import styles from './StatusPage.module.css';
import formStyles from './BookingForm.module.css';
import pageStyles from './EventPage.module.css';

function StatusPage() {
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState('');

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    setMessage('Checking...');
    setBooking(null);
    try {
      const response = await fetch(`https://dholratri-server.onrender.com/api/bookings/status/${phone}`);
      const data = await response.json();
      if (response.ok) {
        setBooking(data);
        setMessage('');
      } else {
        setMessage(data.message);
      }
    } catch (_error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.eventCard}>
        <h1 className={pageStyles.title}>Check Your Pass Status</h1>
        <form onSubmit={handleCheckStatus} className={formStyles.formContainer}>
          <input
            type="tel"
            placeholder="Enter Your Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button className={pageStyles.bookButton}>Check Status</button>
        </form>

        {message && <p className={pageStyles.description}>{message}</p>}

        {booking && booking.status === 'approved' && (
          <div className={styles.passContainer}>
            <h2>Official Entry Pass</h2>
            <h3>{booking.fullName}</h3>
            <p>Status: APPROVED</p>
            <img src={booking.qrCodeDataUrl} alt="Your QR Code" />
            <p>Present this QR code at the entry gate.</p>
          </div>
        )}

        {booking && booking.status === 'pending' && <p className={pageStyles.description}>Your booking is still under review.</p>}
        {booking && booking.status === 'rejected' && <p className={pageStyles.description}>Your booking was not approved. Please contact us for more details.</p>}

      </div>
    </div>
  );
}

export default StatusPage;
