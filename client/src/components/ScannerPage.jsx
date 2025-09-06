import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import pageStyles from './EventPage.module.css';
import styles from './ScannerPage.module.css';

function ScannerPage() {
  const [scanResult, setScanResult] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback((error) => {
    console.error("Auth Error:", error);
    localStorage.removeItem('authToken');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (scanResult) return;

    let scanner;
    try {
      scanner = new Html5QrcodeScanner('qr-reader', {
        qrbox: { width: 250, height: 250 },
        fps: 5,
      });

      const onScanSuccess = async (decodedText) => {
        if (scanner && scanner.getState() === 2) {
          scanner.clear().catch((err) => console.error("Failed to clear scanner", err));
        }

        try {
          const token = localStorage.getItem('authToken');
          if (!token) return handleAuthError('No token found');

          const apiUrl = import.meta.env.VITE_API_URL || 'https://dholratri-tickets.onrender.com';
          const response = await fetch(`${apiUrl}/api/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id: decodedText }),
          });

          if (response.status === 401 || response.status === 403) {
            return handleAuthError('Token invalid, logging out.');
          }

          const result = await response.json();
          setScanResult({ ...result, success: response.ok });
        } catch (err) {
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
        scanner.clear().catch((err) => console.error("Failed to clear scanner on unmount", err));
      }
    };
  }, [scanResult, handleAuthError]);

  if (scanResult) {
    return (
      <div className={`${styles.resultOverlay} ${scanResult.success ? styles.success : styles.error}`}>
        <h1>{scanResult.message}</h1>
        {scanResult.name && <h2>{scanResult.name}</h2>}
        <button onClick={() => setScanResult(null)} className={pageStyles.bookButton}>
          Scan Next Ticket
        </button>
      </div>
    );
  }

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.eventCard}>
        <h1 className={pageStyles.title}>Scan Pass QR Code</h1>
        <div id="qr-reader" style={{ width: '100%' }}></div>
      </div>
    </div>
  );
}

export default ScannerPage;
