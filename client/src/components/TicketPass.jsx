import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';
import styles from './TicketPass.module.css';
import eventConfig from '../eventConfig.json';
import dholratriLogo from '../assets/dholratri-logo.png';

const TicketBorder = () => (
  <svg className={styles.ticketBorder} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="none" rx="16" ry="16" stroke="var(--accent-color)" strokeWidth="4" strokeDasharray="10 10" strokeDashoffset="0" />
  </svg>
);

function TicketPass({ ticket }) {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  if (!ticket || !ticket.ticketType) {
    console.error("TicketPass received invalid ticket data:", ticket);
    return null;
  }

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    toast.loading('Preparing your pass...');

    try {
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Higher resolution for crisp text/images
        style: {
          margin: '0' // Ensure no extra margin is captured
        }
      });
      
      toast.dismiss();
      const link = document.createElement('a');
      link.download = `DholRatri-Pass-${ticket.attendeeName.replace(/\s/g, '_')}-${ticket._id.slice(-6)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Download started!');

    } catch (error) {
      toast.dismiss();
      toast.error('Could not download ticket.');
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const tierDetails = eventConfig.tiers.find(t => t.id === ticket.ticketType);
  const tierName = tierDetails ? tierDetails.name : ticket.ticketType;

  const tierStyleMap = {
    'general': styles.generalPass,
    'premium': styles.premiumPass,
    'luxury': styles.luxuryPass,
    'groupof5': styles.groupPass
  };
  const dedicatedStyleClass = tierStyleMap[ticket.ticketType] || '';
  const prefixedName = `${ticket.gender === 'male' ? 'Mr. ' : 'Miss. '}${ticket.attendeeName}`;

  return (
    <div ref={ticketRef} className={`${styles.ticketPass} ${dedicatedStyleClass}`}>
      <TicketBorder />
      <div className={styles.mainInfo}>
        <img src={dholratriLogo} alt="DholRatri Logo" className={styles.brandLogo} />
        <div className={styles.header}>
          <span>{eventConfig.location} Event Pass</span>
          <h2>{eventConfig.eventName}</h2>
        </div>
        <div className={styles.details}>
          <div><strong>Ticket Type</strong><span>{tierName}</span></div>
          <div><strong>Date</strong><span>26th September</span></div>
          <div><strong>Status</strong><span style={{color: 'var(--accent-color)'}}>{ticket.status}</span></div>
          <div><strong>Time</strong><span>6:00 PM - 10:00 PM</span></div>
          <div style={{ gridColumn: '1 / -1' }}><strong>Venue</strong><span>Veridian Resort, Dehradun</span></div>
          
          {/* New Download Button Container */}
          <div className={styles.downloadButtonContainer}>
             <button onClick={handleDownload} className={styles.downloadButton} disabled={isDownloading}>
                {isDownloading ? 'Downloading...' : 'Download Pass'}
             </button>
          </div>

        </div>
        <div className={styles.attendeeInfo}>
          <h3>{prefixedName}</h3>
          <p>Official Pass Holder</p>
        </div>
      </div>
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

