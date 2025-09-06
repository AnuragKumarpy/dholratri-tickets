import styles from './Footer.module.css';
import contactData from '../contactInfo.json'; // Import our new JSON data

// --- SVG Icon Components (lightweight and self-contained) ---
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

function Footer() {
  return (
    <footer className={styles.footerBar}>
      <div className={styles.contactDetails}>
        <p>&copy; {new Date().getFullYear()} DholRatri | {contactData.address}</p>
      </div>
      <div className={styles.socialLinks}>
        <a href={contactData.instagram.url} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <InstagramIcon />
        </a>
        <a href={`mailto:${contactData.email}`} className={styles.socialLink}>
          <EmailIcon />
        </a>
        <a href={`tel:${contactData.phone.replace(/\s/g, '')}`} className={styles.socialLink}>
          <PhoneIcon />
        </a>
      </div>
    </footer>
  );
}

export default Footer;