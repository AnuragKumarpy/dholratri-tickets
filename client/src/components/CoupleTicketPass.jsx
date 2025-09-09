import styles from './TicketPass.module.css';
import eventConfig from '../eventConfig.json';
import dholratriLogo from '../assets/dholratri-logo.png'; // 1. Import logo

// 2. Reusable border component
const TicketBorder = () => (
  <svg className={styles.ticketBorder} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="none" rx="16" ry="16" stroke="var(--accent-color)" strokeWidth="4" strokeDasharray="10 10" strokeDashoffset="0" />
  </svg>
);

function CoupleTicketPass({ tickets }) {
  const [ticketA, ticketB] = tickets;
  const tierDetails = eventConfig.tiers.find(t => t.id === ticketA.ticketType);
  const tierName = tierDetails ? tierDetails.name : ticketA.ticketType;

  const nameA = `${ticketA.gender === 'male' ? 'Mr. ' : ticketA.gender === 'female' ? 'Miss. ' : ''}${ticketA.attendeeName}`;
  const nameB = `${ticketB.gender === 'male' ? 'Mr. ' : ticketB.gender === 'female' ? 'Miss. ' : ''}${ticketB.attendeeName}`;

  return (
    // 3. JSX completely restructured
    <div className={`${styles.ticketPass} ${styles.couplePass}`}>
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
            <span>Two (2) Guests</span>
          </div>
        </div>

        <div className={styles.attendeeInfo}>
          <h3>{nameA} &amp; {nameB}</h3>
          <p>Official Pass Holders</p>
        </div>
      </div>

      {/* --- QR Code Section (Two QRs) --- */}
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
