import styles from './TicketPass.module.css'; // We will reuse the same style file
import eventConfig from '../eventConfig.json';

// This component expects a 'tickets' prop, which is an ARRAY of all 5 ticket objects
function GroupTicketPass({ tickets }) {
  // Get common info from the first ticket in the group (they are all the same)
  const commonTicket = tickets[0];
  const tierDetails = eventConfig.tiers.find(t => t.id === commonTicket.ticketType);
  const tierName = tierDetails ? tierDetails.name : commonTicket.ticketType;

  return (
    // We will add a 'groupPass' class later in the CSS step to style this
    <div className={`${styles.ticketPass} ${styles.groupPass}`}>
      
      {/* Main Info Section - This will list all attendees */}
      <div className={styles.mainInfo}>
        <div className={styles.header}>
          <span>{eventConfig.location} Event</span>
          <h2>{eventConfig.eventName}</h2>
        </div>
        
        <div className={styles.attendeeInfo}>
          <h3>{tierName} (Admits 5)</h3>
          <p>Pass Holder Group. Phone: {commonTicket.phone}</p>
        </div>

        <div className={styles.details} style={{ gridTemplateColumns: '1fr', gap: '0.5rem' }}>
          <strong>Attendees:</strong>
          <ul style={{ paddingLeft: '20px', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {tickets.map(ticket => {
              // Generate the prefixed name for each person
              const prefixedName = `${ticket.gender === 'male' ? 'Mr. ' : ticket.gender === 'female' ? 'Miss. ' : ''}${ticket.attendeeName}`;
              return <li key={ticket._id} style={{ fontWeight: 600, color: '#333' }}>{prefixedName}</li>;
            })}
          </ul>
        </div>
      </div>

      {/* QR Stub Section - This will list all 5 QR codes in a scrollable list */}
      <div className={styles.qrStub} style={{ justifyContent: 'flex-start', gap: '1.25rem', overflowY: 'auto', maxHeight: '400px' }}>
        {tickets.map(ticket => {
            const prefixedName = `${ticket.gender === 'male' ? 'Mr. ' : ticket.gender === 'female' ? 'Miss. ' : ''}${ticket.attendeeName}`;
            return (
              <div key={ticket._id} style={{ textAlign: 'center', width: '100%', flexShrink: 0 }}>
                <img src={ticket.qrCodeDataUrl} alt={`QR for ${prefixedName}`} style={{ width: '150px', height: '150px' }} />
                <p style={{ fontSize: '0.9rem', margin: '0.25rem 0 0 0', fontWeight: '600', color: 'black' }}>{prefixedName}</p>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#333' }}>ID: {ticket._id}</span>
              </div>
            );
        })}
          <p style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center', marginTop: '1rem', flexShrink: 0 }}>
            Each QR code is valid for one (1) entry.
          </p>
      </div>
    </div>
  );
}

export default GroupTicketPass;
