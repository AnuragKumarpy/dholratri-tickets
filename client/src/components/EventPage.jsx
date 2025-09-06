import { useNavigate } from 'react-router-dom';
import styles from './EventPage.module.css';
import dholratriLogo from '../assets/dholratri-logo.png';

function EventPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.eventCard}>
        <img src={dholratriLogo} alt="DholRatri Dandiya Night Logo" className={styles.logo} />

        {/* 1. Added the .illuminatedTitle class to the <h1> */}
        <h1 className={`${styles.title} ${styles.illuminatedTitle}`}>
          DholRatri Dandiya Night 2025
        </h1>

        {/* 2. Added the .typewriter class to the FIRST <p> tag */}
        <p className={styles.typewriter}>
          Get ready to experience <br />an unforgettable night of music<br /> dance, and celebration! <br />Join us for the grand DholRatri Dandiya Night 2025.
        </p>

        {/* 3. The SECOND <p> tag just uses the normal .description class */}
        <p className={styles.description}>
          Immerse yourself in vibrant rhythms and traditional Dandiya. Book your tickets now and be a part of the most awaited event of the year!
        </p>

        <div>
          <button onClick={() => navigate('/book')} className={styles.bookButton}>
            Book Tickets
          </button>
          <button onClick={() => navigate('/status')} className={styles.statusButton}>
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventPage;