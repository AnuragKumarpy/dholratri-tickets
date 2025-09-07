import { useState } from 'react';
import styles from './Footer.module.css';
import contactData from '../contactInfo.json';

const InstagramIcon = () => (
  <svg role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const EmailIcon = () => (
  <svg role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PhoneIcon = () => (
  <svg role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <footer className={styles.footerBar}>
        <div className={styles.contactTrigger} onClick={handleToggle}>
          <PhoneIcon />
        </div>
      </footer>
      {isExpanded && (
        <div className={styles.contactCard}>
          <div className={styles.cardHeader}>
            <h3>Contact Us</h3>
            <button onClick={handleToggle} className={styles.closeButton}>
              <CloseIcon />
            </button>
          </div>
          <div className={styles.contactDetails}>
            <p>&copy; {new Date().getFullYear()} DholRatri | {contactData.address}</p>
          </div>
          <div className={styles.socialLinks}>
            <a href={contactData.instagram.url} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              <InstagramIcon />
              <span>Instagram</span>
            </a>
            <a href={`mailto:${contactData.email}`} className={styles.socialLink}>
              <EmailIcon />
              <span>Email</span>
            </a>
            <a href={`tel:${contactData.phone.replace(/\s/g, '')}`} className={styles.socialLink}>
              <PhoneIcon />
              <span>Phone</span>
            </a>
          </div>
          <div className={styles.additionalLinks}>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Check Status feature coming soon!'); }}>Check Status</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Book Ticket feature coming soon!'); }}>Book Ticket</a>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;
