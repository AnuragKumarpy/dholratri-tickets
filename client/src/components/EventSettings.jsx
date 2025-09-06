import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './EventSettings.module.css';

// Default state for a new tier
const newTierTemplate = { id: '', name: '', price: 0, perks: 'Perk 1, Perk 2' };
// Default state for the whole settings form if none exists in DB
const defaultSettings = {
  eventName: 'DholRatri Dandiya Night',
  paymentUpiId: 'your-upi@bank',
  paymentQrUrl: '',
  tiers: [{...newTierTemplate, id: 'general', name: 'General', price: 500}],
};

function EventSettings() {
  const [eventName, setEventName] = useState('');
  const [paymentUpiId, setPaymentUpiId] = useState('');
  const [currentQrUrl, setCurrentQrUrl] = useState('');
  const [newQrFile, setNewQrFile] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Auth error handler
  const handleAuthError = useCallback((error) => {
    console.error("Auth Error:", error);
    localStorage.removeItem('authToken');
    navigate('/login');
  }, [navigate]);

  // Load settings from DB on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) return handleAuthError('Token invalid');

      if (response.ok) {
        const data = await response.json();
        if (data) {
          // If settings exist, load them
          setEventName(data.eventName);
          setPaymentUpiId(data.paymentUpiId);
          setCurrentQrUrl(data.paymentQrUrl || '');
          setTiers(data.tiers || []);
        } else {
          // If DB is empty, load defaults
          setEventName(defaultSettings.eventName);
          setPaymentUpiId(defaultSettings.paymentUpiId);
          setTiers(defaultSettings.tiers);
        }
      }
    };
    fetchSettings();
  }, [handleAuthError]);

  // --- Tier Management Handlers ---
  const handleTierChange = (index, field, value) => {
    const newTiers = [...tiers];
    // Convert price to number
    newTiers[index][field] = field === 'price' ? Number(value) : value;
    setTiers(newTiers);
  };

  const addTier = () => {
    setTiers([...tiers, { ...newTierTemplate, id: `tier_${Date.now()}` }]);
  };

  const removeTier = (index) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  // --- Main Save Handler ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('authToken');

    // We MUST use FormData because we are sending a file
    const formData = new FormData();
    formData.append('eventName', eventName);
    formData.append('paymentUpiId', paymentUpiId);
    // We must STRINGIFY the tiers array to send it in FormData
    formData.append('tiers', JSON.stringify(tiers));
    
    // Only append the QR file IF the user selected one
    if (newQrFile) {
      formData.append('paymentQrFile', newQrFile);
    }

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }, // NO Content-Type, FormData sets it
        body: formData,
      });

      if (response.status === 401 || response.status === 403) return handleAuthError('Token invalid');

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      toast.success(result.message);
      // If we uploaded a new file, we must refresh the settings to get the new URL
      if (newQrFile) {
        window.location.reload(); // Simple refresh to show new QR
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.settingsCard}>
      <form onSubmit={handleSaveSettings} className={styles.formGrid}>
        <h2>Event Settings</h2>

        <div className={styles.formGroup}>
          <label htmlFor="eventName">Event Name</label>
          <input type="text" id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="paymentUpiId">Payment UPI ID</label>
          <input type="text" id="paymentUpiId" value={paymentUpiId} onChange={(e) => setPaymentUpiId(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label>Current Payment QR Code</label>
          {currentQrUrl ? (
            <div className={styles.currentQr}>
              <img src={currentQrUrl} alt="Current Payment QR" />
            </div>
          ) : (
            <p>No QR code uploaded yet.</p>
          )}
          <label htmlFor="paymentQrFile">Upload New QR Code (Optional)</label>
          <input type="file" id="paymentQrFile" onChange={(e) => setNewQrFile(e.target.files[0])} accept="image/png, image/jpeg" />
        </div>

        <div className={`${styles.formGroup} ${styles.tierEditor}`}>
          <h3>Ticket Tiers</h3>
          {tiers.map((tier, index) => (
            <div key={index} className={styles.tierRow}>
              <input type="text" placeholder="ID (e.g. 'general')" value={tier.id} onChange={(e) => handleTierChange(index, 'id', e.target.value)} required />
              <input type="text" placeholder="Name (e.g. 'General Pass')" value={tier.name} onChange={(e) => handleTierChange(index, 'name', e.target.value)} required />
              <input type="text" placeholder="Perks (comma, separated)" value={tier.perks} onChange={(e) => handleTierChange(index, 'perks', e.target.value)} />
              <input type="number" placeholder="Price" value={tier.price} onChange={(e) => handleTierChange(index, 'price', e.target.value)} required />
              <button type="button" onClick={() => removeTier(index)} className={styles.removeTierBtn}>X</button>
            </div>
          ))}
          <button type="button" onClick={addTier} className={styles.addTierBtn}>Add Tier</button>
        </div>

        <button type="submit" className={styles.saveBtn} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
}

export default EventSettings;