import { useState } from 'react';
import Lottie from 'react-lottie';
import { AnimatePresence } from 'framer-motion'; 
import toast from 'react-hot-toast';
import styles from './StatusPage.module.css';
import formStyles from './BookingForm.module.css';
import pageStyles from './EventPage.module.css';
import TicketPass from './TicketPass.jsx';
import pendingAnimationData from '../assets/pending-animation.json';

function StatusPage() {
  const [phone, setPhone] = useState('');
  const [tickets, setTickets] = useState([]); 
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = () => {
    window.print();
    toast.success('Preparing your tickets...');
  }

  const lottieOptions = {
    loop: true,
    autoplay: true,
    animationData: pendingAnimationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    setMessage('');
    setTickets([]);
    setIsLoading(true);
    try {
      // THIS IS THE FIX: Trim the phone number BEFORE sending it to the API
      const cleanPhone = phone.trim();
      if (!cleanPhone) return; // Don't search if the field is just spaces

      const response = await fetch(`/api/tickets/status/${cleanPhone}`); // Use the clean phone
      const data = await response.json();
      
      if (response.ok) {
        setTickets(data); 
        setMessage(data.length === 0 ? 'No booking found for this phone number.' : '');
      } else {
        setMessage(data.message); // This will now correctly show the 404 message from the server
      }
    } catch (error) { 
      console.error('Status check failed:', error); 
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const approvedTickets = tickets.filter(t => t.status === 'approved');
  const pendingTickets = tickets.filter(t => t.status === 'pending-approval' || t.status === 'payment-pending');
  const rejectedTickets = tickets.filter(t => t.status === 'rejected');

  return (
    <div className={pageStyles.pageContainer} style={{ minHeight: '120vh' }}>
      <div className={pageStyles.eventCard} style={{ maxWidth: '900px' }}>
        
        <div className="print-hide">
          <h1 className={pageStyles.title}>Check Your Pass Status</h1>
          <form onSubmit={handleCheckStatus} className={formStyles.formContainer} style={{ margin: '0 auto' }}>
            <input
              type="tel"
              placeholder="Enter Your Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)} // User input is not trimmed while typing
              required
            />
            <button className={pageStyles.bookButton} disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Check Status'}
            </button>
          </form>
          {message && <p className={pageStyles.description}>{message}</p>}
        </div>

        {pendingTickets.length > 0 && (
          <div className={`${styles.statusBox} print-hide`}>
            <Lottie options={lottieOptions} height={200} width={200} />
            <h2 className={styles.statusTitle}>Your Booking is Under Review</h2>
            <p className={pageStyles.description}>
              We have received your payment confirmation for {pendingTickets.length} ticket(s).
            </p>
          </div>
        )}
        {rejectedTickets.length > 0 && (
           <div className={`${styles.statusBox} print-hide`}>
             <h2 className={styles.statusTitle} style={{color: '#dc2626'}}>Booking Rejected</h2>
             <p className={pageStyles.description}>
                Your booking for {rejectedTickets.length} ticket(s) was not approved.
             </p>
           </div>
        )}

        {approvedTickets.length > 0 && (
          <>
            <div className={`${styles.passListHeader} print-hide`}>
              <h2 className={styles.statusTitle}>Your Official Pass(es)</h2>
              <button onClick={handlePrint} className={styles.printButton}>
                Print All Tickets
              </button>
            </div>

            <div className={`${styles.passListContainer} print-container`}>
              <AnimatePresence>
                {approvedTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket._id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    exit={{ opacity: 0 }}
                  >
                    <TicketPass ticket={ticket} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default StatusPage;