import { useState } from 'react';
import toast from 'react-hot-toast'; // Import toast
import styles from './BookingForm.module.css';
import eventPageStyles from './EventPage.module.css';

function BookingForm() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true); // Start loading

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('phone', phone);
    formData.append('utr', utr);
    formData.append('screenshot', screenshot);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        toast.success(result.message); // Use success toast
        // Clear the form on success
        setFullName('');
        setPhone('');
        setUtr('');
        event.target.reset(); // Resets the file input
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong'); // Use error toast
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className={eventPageStyles.pageContainer}>
      <div className={eventPageStyles.eventCard}>
        <h1 className={eventPageStyles.title}>Book Your Pass</h1>
        <form className={styles.formContainer} onSubmit={handleSubmit}>
          {/* ... inputs are the same */}
          <input type="text" placeholder="Full Name (as per Government ID)" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <input type="tel" placeholder="Phone / WhatsApp Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input type="text" placeholder="Payment UTR / Transaction ID" value={utr} onChange={(e) => setUtr(e.target.value)} required />
          <input type="file" onChange={(e) => setScreenshot(e.target.files[0])} required />

          {/* Conditionally render button text and disable it */}
          <button className={eventPageStyles.bookButton} disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;