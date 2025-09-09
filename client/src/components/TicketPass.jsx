import styles from './TicketPass.module.css';
import eventConfig from '../eventConfig.json';
import dholratriLogo from '../assets/dholratri-logo.png'; // 1. Import the logo

// 2. A small component for the decorative SVG border
const TicketBorder = () => (
  <svg className={styles.ticketBorder} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="none" rx="16" ry="16" stroke="var(--accent-color)" strokeWidth="4" strokeDasharray="10 10" strokeDashoffset="0" />
  </svg>
);

function TicketPass({ ticket }) {
  const tierDetails = eventConfig.tiers.find(t => t.id === ticket.ticketType);
  const tierName = tierDetails ? tierDetails.name : ticket.ticketType;

  // Tier-specific styling logic (unchanged)
  const tierStyleMap = {
    'general': styles.generalPass,
    'premium': styles.premiumPass,
    'luxury': styles.luxuryPass,
  };
  const dedicatedStyleClass = tierStyleMap[ticket.ticketType] || '';

  // Prefixed name logic (unchanged)
  const prefixedName = `${ticket.gender === 'male' ? 'Mr. ' : ticket.gender === 'female' ? 'Miss. ' : ''}${ticket.attendeeName}`;

  return (
    // 3. The JSX is completely restructured to match the new CSS
    <div className={`${styles.ticketPass} ${dedicatedStyleClass}`}>
      <TicketBorder />
      
      {/* --- Main Info Section (Left) --- */}
      <div className={styles.mainInfo}>
        <img src={dholratriLogo} alt="DholRatri Logo" className={styles.brandLogo} />
        
        <div className={styles.header}>
          <span>{eventConfig.location} Event Pass</span>
          <h2>{eventConfig.eventName}</h2>
        </div>

        <div className={styles.details}>
          <div>
            <strong>Ticket Type</strong>
            <span style={{ textTransform: 'capitalize' }}>{tierName}</span>
          </div>
          <div>
            <strong>Status</strong>
            <span style={{ textTransform: 'uppercase', color: 'var(--accent-color)' }}>{ticket.status}</span>
          </div>
        </div>

        <div className={styles.attendeeInfo}>
          <h3>{prefixedName}</h3>
          <p>Official Pass Holder</p>
        </div>
      </div>

      {/* --- QR Code Section (Right) --- */}
      <div className={styles.qrStub}>
        <div className={styles.qrCodeWrapper}>
           <img src={ticket.qrCodeDataUrl} alt="Your Ticket QR Code" />
           <p>Present this pass at entry</p>
           <span>ID: {ticket._id}</span>
        </div>
      </div>
    </div>
  );
}

export default TicketPass;
