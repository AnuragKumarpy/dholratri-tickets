import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './EventSettings.module.css';

const newTierTemplate = { id: '', name: '', price: 0, perks: 'Perk 1, Perk 2' };
const defaultSettings = {
  eventName: 'DholRatri Dandiya Night',
  paymentUpiId: 'your-upi@bank',
  paymentQrUrl: '',
  tiers: [{ ...newTierTemplate, id: 'general', name: 'General', price: 500 }],
};

function EventSettings() {
  const [eventName, setEventName] = useState('');
  const [paymentUpiId, setPaymentUpiId] = useState('');
  const [currentQrUrl, setCurrentQrUrl] = useState('');
  const [newQrFile, setNewQrFile] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = useCallback((error) => {
    console.error("Auth Error:", error);
    localStorage.removeItem('authToken');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://dholratri-tickets.onrender.com';
      const response = await fetch(`${apiUrl}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) return handleAuthError('Token invalid');

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setEventName(data.eventName);
          setPaymentUpiId(data.paymentUpiId);
          setCurrentQrUrl(data.paymentQrUrl || '');
          setTiers(data.tiers || []);
        } else {
          setEventName(defaultSettings.eventName);
          setPaymentUpiId(defaultSettings.paymentUpiId);
          setCurrentQrUrl(defaultSettings.paymentQrUrl);
          setTiers(defaultSettings.tiers);
        }
      } else {
        setEventName(defaultSettings.eventName);
        setPaymentUpiId(defaultSettings.paymentUpiId);
        setCurrentQrUrl(defaultSettings.paymentQrUrl);
        setTiers(defaultSettings.tiers);
      }
    };
    fetchSettings();
  }, [handleAuthError]);

  const handleTierChange = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value;
    setTiers(newTiers);
  };

  const addTier = () => {
    setTiers([...tiers, { ...newTierTemplate, id: `tier-${tiers.length + 1}` }]);
  };

  const removeTier = (index) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('eventName', eventName);
      formData.append('paymentUpiId', paymentUpiId);
      formData.append('tiers', JSON.stringify(tiers));
      if (newQrFile) formData.append('paymentQrFile', newQrFile);

      const apiUrl = import.meta.env.VITE_API_URL || 'https://dholratri-tickets.onrender.com';
      const response = await fetch(`${apiUrl}/api/admin/settings`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.status === 401 || response.status === 403) return handleAuthError('Token invalid');
      if (!response.ok) throw new Error('Failed to save settings');

      const result = await response.json();
      toast.success(result.message);
      setNewQrFile(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.settingsCard}>
      <h2>Event Settings</h2>
      <form className={styles.formGrid} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="eventName">Event Name</label>
          <input
            type="text"
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="paymentUpiId">Payment UPI ID</label>
          <input
            type="text"
            id="paymentUpiId"
            value={paymentUpiId}
            onChange={(e) => setPaymentUpiId(e.target.value)}
            required
          />
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
          <input
            type="file"
            id="paymentQrFile"
            onChange={(e) => setNewQrFile(e.target.files[0])}
            accept="image/png, image/jpeg"
          />
        </div>
        <div className={`${styles.formGroup} ${styles.tierEditor}`}>
          <h3>Ticket Tiers</h3>
          {tiers.map((tier, index) => (
            <div key={index} className={styles.tierRow}>
              <input
                type="text"
                placeholder="ID (e.g. 'general')"
                value={tier.id}
                onChange={(e) => handleTierChange(index, 'id', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Name (e.g. 'General Pass')"
                value={tier.name}
                onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Perks (comma, separated)"
                value={tier.perks}
                onChange={(e) => handleTierChange(index, 'perks', e.target.value)}
              />
              <input
                type="number"
                placeholder="Price"
                value={tier.price}
                onChange={(e) => handleTierChange(index, 'price', e.target.value)}
                required
              />
              <button type="button" onClick={() => removeTier(index)} className={styles.removeTierBtn}>
                X
              </button>
            </div>
          ))}
          <button type="button" onClick={addTier} className={styles.addTierBtn}>
            Add Tier
          </button>
        </div>
        <button type="submit" className={styles.saveBtn} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
}

export default EventSettings;
