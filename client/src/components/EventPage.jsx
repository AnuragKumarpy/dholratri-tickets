import styles from './EventPage.module.css';
import { Link } from 'react-router-dom'; // 1. Import Link

function EventPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.eventCard}>
        <Link to="/status" style={{color: 'white', marginTop: '1rem', display: 'block'}}>
  Already booked? Check your status here.
</Link>
        <h1 className={styles.title}>DHOLRATRI DANDIYA NIGHTS</h1>
        <p className={styles.description}>
          Join us for the most electrifying Dandiya and Garba night of the year! Get ready to dance to the beats of live dhol and the best desi music under the stars.
        </p>
        {/* 2. Change button to Link and add the 'to' prop */}
        <Link to="/book" className={styles.bookButton}>
          Book Now
        </Link>
      </div>
    </div>
  );
}

export default EventPage;