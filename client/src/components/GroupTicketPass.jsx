import styles from './TicketPass.module.css';
import eventConfig from '../eventConfig.json';
import dholratriLogo from '../assets/dholratri-logo.png'; // 1. Import logo

// 2. Reusable border component
const TicketBorder = () => (
  <svg className={styles.ticketBorder} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="none" rx="16" ry="16" stroke="var(--accent-color)" strokeWidth="4" strokeDasharray="10 10" strokeDashoffset="0" />
  </svg>
);

function GroupTicketPass({ tickets }) {
  const commonTicket = tickets[0];
  const tierDetails = eventConfig.tiers.find(t => t.id === commonTicket.ticketType);
  const tierName = tierDetails ? tierDetails.name : commonTicket.ticketType;

  return (
    // 3. JSX completely restructured
    <div className={`${styles.ticketPass} ${styles.groupPass}`}>
      <TicketBorder />

      {/* --- Main Info Section --- */}
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
            <strong>Admits</strong>
            <span>Five (5) Guests</span>
          </div>
        </div>
        
        {/* Attendee list takes up the bottom section */}
        <div className={styles.attendeeInfo}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              {tickets.map(t => (
                 <li key={t._id} style={{ marginBottom: '0.25rem' }}>
                   <strong>›</strong> {`${t.gender === 'male' ? 'Mr. ' : 'Miss. '}${t.attendeeName}`}
                 </li>
              ))}
            </ul>
        </div>
      </div>

      {/* --- QR Code Section (Scrollable list of 5 QRs) --- */}
      <div className={styles.qrStub} style={{ gap: '1.5rem', justifyContent: 'flex-start', overflowY: 'auto', maxHeight: '350px' }}>
         {tickets.map(ticket => {
            const prefixedName = `${ticket.gender === 'male' ? 'Mr. ' : 'Miss. '}${ticket.attendeeName}`;
            return (
              <div key={ticket._id} className={styles.qrCodeWrapper} style={{flexShrink: 0}}>
                <img src={ticket.qrCodeDataUrl} alt={`QR for ${prefixedName}`} />
                <p>{prefixedName}</p>
                <span>ID: {ticket._id}</span>
              </div>
            );
        })}
      </div>
    </div>
  );
}

export default GroupTicketPass;
