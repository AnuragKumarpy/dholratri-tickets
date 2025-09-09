import styles from './TicketPass.module.css';
import eventConfig from '../eventConfig.json';
import dholratriLogo from '../assets/dholratri-logo.png'; 

const TicketBorder = () => (
  <svg className={styles.ticketBorder} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="none" rx="16" ry="16" stroke="var(--accent-color)" strokeWidth="4" strokeDasharray="10 10" strokeDashoffset="0" />
  </svg>
);

function CoupleTicketPass({ tickets }) {
  // --- THIS IS THE FIX ---
  if (!tickets || tickets.length < 2 || !tickets[0] || !tickets[1]) {
    console.error("CoupleTicketPass received invalid ticket data:", tickets);
    return null;
  }
  // --- END OF FIX ---

  const [ticketA, ticketB] = tickets;
  const tierDetails = eventConfig.tiers.find(t => t.id === ticketA.ticketType);
  const tierName = tierDetails ? tierDetails.name : ticketA.ticketType;

  const nameA = `${ticketA.gender === 'male' ? 'Mr. ' : ticketA.gender === 'female' ? 'Miss. ' : ''}${ticketA.attendeeName}`;
  const nameB = `${ticketB.gender === 'male' ? 'Mr. ' : ticketB.gender === 'female' ? 'Miss. ' : ''}${ticketB.attendeeName}`;

  return (
    <div className={`${styles.ticketPass} ${styles.couplePass}`}>
      <TicketBorder />
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
            <strong>Date</strong>
            <span>26th September</span>
          </div>
           <div>
            <strong>Admits</strong>
            <span>Two (2) Guests</span>
          </div>
          <div>
            <strong>Time</strong>
            <span>6:00 PM - 10:00 PM</span>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Venue</strong>
            <span>Veridian Resort, Suddhowala, Dehradun</span>
          </div>
        </div>
        <div className={styles.attendeeInfo}>
          <h3 style={{ lineHeight: 1.3 }}>{nameA}</h3>
          <p style={{
              margin: '0.25rem 0',
              color: 'var(--accent-color)',
              fontWeight: '700',
              fontSize: '1rem',
              fontFamily: 'var(--font-heading)'
          }}>
            coupled with
          </p>
          <h3 style={{ lineHeight: 1.3 }}>{nameB}</h3>
        </div>
      </div>
      <div className={styles.qrStub} style={{ gap: '1rem', justifyContent: 'center' }}>
        <div className={styles.qrCodeWrapper}>
           <img src={ticketA.qrCodeDataUrl} alt="QR Code 1" />
           <p>{nameA}</p>
           <span>ID: {ticketA._id}</span>
        </div>
         <div className={styles.qrCodeWrapper}>
           <img src={ticketB.qrCodeDataUrl} alt="QR Code 2" />
           <p>{nameB}</p>
           <span>ID: {ticketB._id}</span>
        </div>
      </div>
    </div>
  );
}

export default CoupleTicketPass;

