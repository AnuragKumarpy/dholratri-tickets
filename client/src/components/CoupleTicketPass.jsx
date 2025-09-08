import styles from './TicketPass.module.css'; // We reuse the existing styles
import eventConfig from '../eventConfig.json';

// This component expects a prop 'tickets' which is an ARRAY of the two ticket objects
function CoupleTicketPass({ tickets }) {
  const [ticketA, ticketB] = tickets; // Split the array into two tickets

  // Get tier details (they will be the same)
  const tierDetails = eventConfig.tiers.find(t => t.id === ticketA.ticketType);
  const tierName = tierDetails ? tierDetails.name : ticketA.ticketType;

  // Create the prefixed names (using the logic from TicketPass.jsx)
  const nameA = `${ticketA.gender === 'male' ? 'Mr. ' : ticketA.gender === 'female' ? 'Miss. ' : ''}${ticketA.attendeeName}`;
  const nameB = `${ticketB.gender === 'male' ? 'Mr. ' : ticketB.gender === 'female' ? 'Miss. ' : ''}${ticketB.attendeeName}`;

  return (
    <div className={styles.ticketPass}>
      {/* Main Info Section */}
      <div className={styles.mainInfo}>
        <div className={styles.header}>
          <span>{eventConfig.location} Event</span>
          <h2>{eventConfig.eventName}</h2>
        </div>
        
        {/* Attendee 1 Info */}
        <div className={styles.attendeeInfo} style={{ marginBottom: '1.5rem' }}>
          <h3>{nameA}</h3>
          <p>Pass Holder 1</p>
        </div>

        {/* Attendee 2 Info */}
        <div className={styles.attendeeInfo}>
          <h3>{nameB}</h3>
          <p>Pass Holder 2</p>
        </div>

        <div className={styles.details}>
          <div>
            <strong>Ticket Type</strong>
            <span style={{ textTransform: 'capitalize' }}>{tierName} (Admits 2)</span>
          </div>
          <div>
            <strong>Phone</strong>
            <span>{ticketA.phone}</span>
          </div>
          <div>
            <strong>Status</strong>
            <span style={{ color: '#16a34a', textTransform: 'uppercase' }}>{ticketA.status}</span>
          </div>
           <div>
            <strong>Pass ID (P1)</strong>
            <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{ticketA._id}</span>
          </div>
           <div>
            <strong>Pass ID (P2)</strong>
            <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{ticketB._id}</span>
          </div>
        </div>
      </div>

      {/* QR Stub Section (with 2 QRs) */}
      <div className={styles.qrStub} style={{ justifyContent: 'space-around', gap: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={ticketA.qrCodeDataUrl} alt="QR Code 1" style={{ width: '150px', height: '150px' }} />
          <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>QR for {nameA}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <img src={ticketB.qrCodeDataUrl} alt="QR Code 2" style={{ width: '150px', height: '150px' }} />
          <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>QR for {nameB}</p>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center', marginTop: '1rem' }}>
          Present this at entry. Each QR code is valid for one (1) entry.
        </p>
      </div>
    </div>
  );
}

export default CoupleTicketPass;
