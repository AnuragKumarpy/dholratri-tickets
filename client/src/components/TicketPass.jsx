// Removed all imports for useRef and ReactToPrint
import styles from './TicketPass.module.css';
import eventConfig from '../eventConfig.json';

// This is now just a display component. It doesn't know how to print itself.
function TicketPass({ ticket }) {
  const tierDetails = eventConfig.tiers.find(t => t.id === ticket.ticketType);
   const tierName = tierDetails ? tierDetails.name : ticket.ticketType;
  
    // --- NEW DESIGN LOGIC ---
    const tierStyleMap = {
      'general': styles.generalPass,
      'premium': styles.premiumPass,
      'luxury': styles.luxuryPass,
    };
    // Get the correct style class, or default to an empty string
    const dedicatedStyleClass = tierStyleMap[ticket.ticketType] || '';
    // --- END NEW LOGIC ---
    // Removed the ref from the div
    return (
    <div className={styles.ticketPass}>
      <div className={styles.mainInfo}>
        <div className={styles.header}>
          <span>{eventConfig.location} Event</span>
          <h2>{eventConfig.eventName}</h2>
        </div>
        
        {/* --- THIS BLOCK IS UPDATED WITH PREFIX LOGIC --- */}
        <div className={styles.attendeeInfo}>
          <h3>
            {/* --- NEW PREFIX LOGIC --- */}
            {ticket.gender === 'male' ? 'Mr. ' : ticket.gender === 'female' ? 'Miss. ' : ''}
            {ticket.attendeeName}
          </h3>
          <p>Pass Holder</p>
        </div>
        {/* --- END OF UPDATED BLOCK --- */}

        <div className={styles.details}>
          <div>
            <strong>Ticket Type</strong>
            <span style={{ textTransform: 'capitalize' }}>{tierName}</span>
          </div>
          <div>
            <strong>Phone</strong>
            <span>{ticket.phone}</span>
          </div>
          <div>
            <strong>Status</strong>
            <span style={{ color: '#16a34a', textTransform: 'uppercase' }}>{ticket.status}</span>
          </div>
          <div>
            <strong>Pass ID</strong>
            <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{ticket._id}</span>
          </div>
        </div>
        
        {/* Removed the print button container and ReactToPrint component */}

      </div>

      <div className={styles.qrStub}>
        <img src={ticket.qrCodeDataUrl} alt="Your Ticket QR Code" />
        <p>Present this entire screen at the entry gate. This QR code is valid for one (1) entry per ticket.</p>
      </div>
    </div>
  );
}

export default TicketPass;
