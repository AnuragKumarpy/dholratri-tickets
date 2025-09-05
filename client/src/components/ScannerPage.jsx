import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import styles from './ScannerPage.module.css';
import pageStyles from './EventPage.module.css';
import formStyles from './BookingForm.module.css';

const SCANNER_PASSCODE = 'DHOLRATRI2025';

function ScannerPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // CHANGE #1: We've added 'scanResult' to the dependency array.
  // This makes the effect run again when we reset the scan result.
  useEffect(() => {
    // CHANGE #2: Only try to start the scanner if authorized AND there's no result being shown.
    if (!isAuthorized || scanResult) return;

    let scanner;
    try {
        scanner = new Html5QrcodeScanner('qr-reader', {
        qrbox: { width: 250, height: 250 },
        fps: 5,
      });

      const onScanSuccess = async (decodedText) => {
        // Check if scanner is still active before trying to clear
        if (scanner && scanner.getState() === 2) { // 2 is SCANNING state
          scanner.clear();
        }

        try {
          const response = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: decodedText }),
          });
          const result = await response.json();
          setScanResult({ ...result, success: response.ok });
        } catch (err) { // This 'err' is now used, fixing the lint warning
          console.error("API call failed", err);
          setScanResult({ success: false, message: 'Network Error' });
        }
      };

      scanner.render(onScanSuccess);

    } catch (error) {
      console.error("Error initializing scanner:", error);
    }

    return () => {
      if (scanner && scanner.getState() === 2) {
        scanner.clear().catch(_err => { /* This fixes the ESLint warning */ });
      }
    };
  }, [isAuthorized, scanResult]);

  // ... The rest of the component is the same
  const handleAuth = (e) => {
    e.preventDefault();
    if (passcode === SCANNER_PASSCODE) { setIsAuthorized(true); } 
    else { alert('Incorrect Passcode'); }
  };

  if (scanResult) {
    return (
      <div className={`${styles.resultOverlay} ${scanResult.success ? styles.success : styles.error}`}>
        <h1>{scanResult.message}</h1>
        {scanResult.name && <h2>{scanResult.name}</h2>}
        <button onClick={() => setScanResult(null)} className={pageStyles.bookButton}>Scan Next Ticket</button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className={pageStyles.pageContainer}>
        <div className={pageStyles.eventCard}>
          <h1 className={pageStyles.title}>Scanner Access</h1>
          <form onSubmit={handleAuth} className={formStyles.formContainer}>
            <input type="password" placeholder="Enter Passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
            <button className={pageStyles.bookButton}>Authorize</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.eventCard}>
        <h1 className={pageStyles.title}>Scan Pass QR Code</h1>
        <div id="qr-reader"></div>
      </div>
    </div>
  );
}

export default ScannerPage;