import styles from './TicketPass.module.css';
import eventConfig from '../eventConfig.json';
import dholratriLogo from '../assets/dholratri-logo.png';

// Reusable border component
const TicketBorder = () => (
  <svg className={styles.ticketBorder} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="none" rx="16" ry="16" stroke="var(--accent-color)" strokeWidth="4" strokeDasharray="10 10" strokeDashoffset="0" />
  </svg>
);

function TicketPass({ ticket }) {
  const tierDetails = eventConfig.tiers.find(t => t.id === ticket.ticketType);
  const tierName = tierDetails ? tierDetails.name : ticket.ticketType;

  // Tier-specific styling logic
  const tierStyleMap = {
    'general': styles.generalPass,
    'premium': styles.premiumPass,
    'luxury': styles.luxuryPass,
  };
  const dedicatedStyleClass = tierStyleMap[ticket.ticketType] || '';

  // Prefixed name logic
  const prefixedName = `${ticket.gender === 'male' ? 'Mr. ' : ticket.gender === 'female' ? 'Miss. ' : ''}${ticket.attendeeName}`;

  return (
    <div className={`${styles.ticketPass} ${dedicatedStyleClass}`}>
      <TicketBorder />
      
      {/* --- Main Info Section (Left) --- */}
      <div className={styles.mainInfo}>
        <img src={dholratriLogo} alt="DholRatri Logo" className={styles.brandLogo} />
        
        <div className={styles.header}>
          <span>{eventConfig.location} Event Pass</span>
          <h2>{eventConfig.eventName}</h2>
        </div>

        {/* --- UPDATED DETAILS GRID --- */}
        <div className={styles.details}>
          <div>
            <strong>Ticket Type</strong>
            <span style={{ textTransform: 'capitalize' }}>{tierName}</span>
          </div>
          <div>
            <strong>Date</strong>
            <span>26th September</span>
          </div>
          <div>
            <strong>Status</strong>
            <span style={{ textTransform: 'uppercase', color: 'var(--accent-color)' }}>{ticket.status}</span>
          </div>
           <div>
            <strong>Time</strong>
            <span>6:00 PM - 10:00 PM</span>
          </div>
          <div style={{ gridColumn: '1 / -1' }}> {/* This spans both columns */}
            <strong>Venue</strong>
            <span>Veridian Resort, Suddhowala, Dehradun</span>
          </div>
        </div>
        {/* --- END OF UPDATED GRID --- */}

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
