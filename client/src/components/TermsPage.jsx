import { Link } from 'react-router-dom';
import pageStyles from './EventPage.module.css'; // Reuse the main page styles
import styles from './TermsPage.module.css';     // Use our new specific styles

function TermsPage() {
  return (
    <div className={pageStyles.pageContainer}>
      <div className={`${pageStyles.eventCard} ${styles.termsContent}`}>
        <h1 className={pageStyles.title}>Terms & Conditions</h1>
        <p>
          Welcome to DholRatri Dandiya Night 2025. To ensure a safe, respectful, and enjoyable experience for all our guests, your entry is subject to the following terms and conditions. By purchasing a ticket, you agree to abide by these rules.
        </p>

        <h2>1. Code of Conduct</h2>
        <ul>
          <li>
            <strong>Zero Tolerance for Harassment:</strong> We are committed to providing a safe environment for everyone. Harassment of any kind, including but not limited to verbal abuse, intimidation, or any form of physical or sexual harassment, especially towards women, is strictly prohibited. Violators will be immediately removed from the event without a refund and may be handed over to law enforcement.
          </li>
          <li>
            <strong>Maintain Civic Sense:</strong> All attendees are expected to conduct themselves with decorum and respect for fellow guests, performers, and staff. Please help us keep the venue clean and do not damage any property.
          </li>
          <li>
            <strong>Disruptive Behavior:</strong> Any individual engaging in fights, arguments, or behavior deemed disruptive by the event staff will be escorted from the premises without a refund.
          </li>
        </ul>

        <h2>2. Prohibited Items & Substances</h2>
        <ul>
          <li>
            <strong>Alcohol and Drugs:</strong> This is a strictly alcohol-free and drug-free event. You are not permitted to bring or consume alcohol or any illegal substances within the event premises. Any individual found in possession of or under the influence of such substances will be denied entry or removed immediately.
          </li>
          <li>
            <strong>Outside Food and Beverages:</strong> For safety and security reasons, outside food and drinks are not allowed.
          </li>
          <li>
            <strong>Other Prohibited Items:</strong> Weapons of any kind, flammable materials, and any other items deemed dangerous by security are strictly forbidden.
          </li>
        </ul>

        <h2>3. Entry & Security</h2>
        <ul>
          <li>
            <strong>Right of Admission Reserved:</strong> The event organizers reserve the right to refuse admission to anyone, even those with a valid ticket, if they are deemed a security risk.
          </li>
          <li>
            <strong>Security Checks:</strong> All attendees are subject to a security search upon entry. Your cooperation is appreciated.
          </li>
          <li>
            <strong>Ticket Policy:</strong> All ticket sales are final and non-refundable. The QR code is valid for a single entry only.
          </li>
        </ul>
        
        <p>
          Thank you for your cooperation in making DholRatri Dandiya Night a memorable and safe celebration for all.
        </p>

        <Link to="/" className={`${pageStyles.bookButton} ${styles.backButton}`}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default TermsPage;