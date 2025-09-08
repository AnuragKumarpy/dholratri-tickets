import { useState } from 'react';
import Lottie from 'react-lottie';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import styles from './StatusPage.module.css';
import formStyles from './BookingForm.module.css';
import pageStyles from './EventPage.module.css';
import TicketPass from './TicketPass.jsx';
import CoupleTicketPass from './CoupleTicketPass.jsx'; // This import is still needed
import pendingAnimationData from '../assets/pending-animation.json';

function StatusPage() {
  const [phone, setPhone] = useState('');
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = () => {
    window.print();
    toast.success('Preparing your tickets...');
  };

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
      const cleanPhone = phone.trim();
      if (!cleanPhone) {
        setMessage('Please enter a valid phone number.');
        setIsLoading(false);
        return;
      }
      const apiUrl = import.meta.env.VITE_API_URL || 'https://dholratri-tickets.onrender.com';
      const response = await fetch(`${apiUrl}/api/tickets/status/${cleanPhone}`);
      const data = await response.json();

      if (response.ok) {
        setTickets(data);
        setMessage(data.length === 0 ? 'No booking found for this phone number.' : '');
      } else {
        setMessage(data.message || 'Server error');
      }
    } catch (error) {
      console.error('Status check failed:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW ROBUST GROUPING LOGIC ---
  const approvedTickets = tickets.filter((t) => t.status === 'approved');
  const pendingTickets = tickets.filter((t) => t.status === 'pending-approval' || t.status === 'payment-pending');
  const rejectedTickets = tickets.filter((t) => t.status === 'rejected');

  // 1. Separate all tickets that are NOT couple passes
  const allSoloTickets = approvedTickets.filter(t => t.ticketType !== 'couple');
  
  // 2. Get ONLY the couple tickets
  const allCoupleTickets = approvedTickets.filter(t => t.ticketType === 'couple');

  // 3. Group all couple tickets by their purchaseId
  const coupleTicketGroups = allCoupleTickets.reduce((acc, ticket) => {
    const purchaseId = ticket.purchaseId.toString();
    if (!acc[purchaseId]) acc[purchaseId] = [];
    acc[purchaseId].push(ticket);
    return acc;
  }, {});

  // 4. Partition the groups into valid pairs and orphans
  const validCouplePasses = []; // Groups with exactly 2 tickets
  const orphanCoupleTickets = []; // Couple tickets from incomplete groups

  Object.values(coupleTicketGroups).forEach(group => {
    if (group.length === 2) {
      validCouplePasses.push(group); // This is a valid pair
    } else {
      // This group is incomplete (e.g., only 1 ticket). Push its tickets
      // to be rendered as solo passes so nothing breaks.
      orphanCoupleTickets.push(...group);
    }
  });

  // 5. Create the final, safe list of all tickets to be rendered as solos
  const finalSoloTicketsToRender = [...allSoloTickets, ...orphanCoupleTickets];
  // --- END OF NEW LOGIC ---


  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.eventCard}>
        <h1 className={pageStyles.title}>Check Your Booking Status</h1>
        <form className={formStyles.formContainer} onSubmit={handleCheckStatus}>
          <input
            type="tel"
            placeholder="Enter Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button className={pageStyles.bookButton} disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Check Status'}
          </button>
        </form>
        {message && <p className={pageStyles.description}>{message}</p>}
        
        {/* Pending/Rejected logic is unchanged */}
        {pendingTickets.length > 0 && (
          <div className={`${styles.statusBox} print-hide`}>
            <Lottie options={lottieOptions} height={200} width={200} />
            <h2 className={styles.statusTitle}>Your Booking is Under Review</h2>
            <p className={pageStyles.description}>
              We have received your payment confirmation. Your pass is pending approval.
            </p>
          </div>
        )}
        {rejectedTickets.length > 0 && (
          <div className={`${styles.statusBox} print-hide`}>
            <h2 className={styles.statusTitle} style={{ color: '#dc2626' }}>
              Booking Rejected
            </h2>
            <p className={pageStyles.description}>
              Your booking for {rejectedTickets.length} ticket(s) was not approved.
            </p>
          </div>
        )}

        {/* This check now correctly checks BOTH lists */}
        {(validCouplePasses.length > 0 || finalSoloTicketsToRender.length > 0) && (
          <>
            <div className={`${styles.passListHeader} print-hide`}>
              <h2 className={styles.statusTitle}>Your Official Pass(es)</h2>
              <button onClick={handlePrint} className={styles.printButton}>
                Print All Tickets
              </button>
            </div>
            <div className={`${styles.passListContainer} print-container`}>
              <AnimatePresence>
                
                {/* --- 1. RENDER ALL VALID COUPLE PASSES (AS GROUPS) --- */}
                {validCouplePasses.map((ticketGroup, index) => (
                  <motion.div
                    key={ticketGroup[0].purchaseId} // Use the common purchaseId as the key
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    exit={{ opacity: 0 }}
                  >
                    <CoupleTicketPass tickets={ticketGroup} /> 
                  </motion.div>
                ))}

                {/* --- 2. RENDER ALL FINAL SOLO PASSES (Original Solos + Orphaned Couples) --- */}
                {finalSoloTicketsToRender.map((ticket, index) => (
                  <motion.div
                    key={ticket._id} // Use the individual ticket ID as key
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: (index + validCouplePasses.length) * 0.2 }} 
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
