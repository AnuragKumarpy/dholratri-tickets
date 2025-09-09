import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './BookingForm.module.css';
import eventPageStyles from './EventPage.module.css';
import eventConfig from '../eventConfig.json'; 
import paymentQrCode from '../assets/payment-qr.png'; 

const defaultAttendee = { name: '', gender: 'male' };

function BookingForm() {
  const [phone, setPhone] = useState('');
  const [attendees, setAttendees] = useState([{ ...defaultAttendee }]);
  const [selectedTierId, setSelectedTierId] = useState(eventConfig.tiers[0].id);
  const [agreeTnc, setAgreeTnc] = useState(false);
  const [agreeWhatsapp, setAgreeWhatsapp] = useState(false);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [step, setStep] = useState(1);
  const [purchaseId, setPurchaseId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Coupon State Management ---
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponMessageType, setCouponMessageType] = useState('info'); // 'info', 'success', 'error'
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // --- Effects ---
  useEffect(() => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponMessage('');
  }, [selectedTierId, attendees.length]);

  useEffect(() => {
    if (selectedTierId === 'couple') {
      setAttendees([{ ...defaultAttendee }, { ...defaultAttendee }]);
    } else if (selectedTierId === 'groupof5') {
      setAttendees([
        { ...defaultAttendee }, { ...defaultAttendee }, { ...defaultAttendee },
        { ...defaultAttendee }, { ...defaultAttendee }
      ]);
    } else {
      setAttendees([{ ...defaultAttendee }]);
    }
  }, [selectedTierId]);

  // --- Attendee Handlers ---
  const handleAttendeeFieldChange = (index, field, value) => {
    const newAttendees = [...attendees];
    newAttendees[index][field] = value;
    setAttendees(newAttendees);
  };
  const addAttendee = () => setAttendees([...attendees, { ...defaultAttendee }]);
  const removeAttendee = (index) => {
    const newAttendees = attendees.filter((_, i) => i !== index);
    setAttendees(newAttendees);
  };

  // --- Price Calculation ---
  const selectedTier = eventConfig.tiers.find(t => t.id === selectedTierId);
  let baseTotal = 0;
  if (selectedTier) {
    baseTotal = ['couple', 'groupof5'].includes(selectedTier.id)
      ? selectedTier.price
      : selectedTier.price * attendees.length;
  }
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'FLAT') {
      discountAmount = appliedCoupon.value;
    } else if (appliedCoupon.type === 'PERCENTAGE') {
      discountAmount = (baseTotal * appliedCoupon.value) / 100;
    } else if (appliedCoupon.type === 'FLAT_PER_TICKET') {
      discountAmount = appliedCoupon.value * attendees.length;
    }
  }
  const finalTotal = Math.max(0, baseTotal - discountAmount);
  
  // --- Coupon Validation Handler ---
  const handleValidateCoupon = async () => {
    if (!couponCode) {
        setCouponMessage('Please enter a coupon code.');
        setCouponMessageType('error');
        return;
    }
    setIsValidatingCoupon(true);
    setCouponMessage('');
    setAppliedCoupon(null);
    try {
        const response = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ couponCode }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        setCouponMessage(result.message);
        setCouponMessageType('success');
        setAppliedCoupon(result.coupon);
    } catch (error) {
        setCouponMessage(error.message || 'Validation failed.');
        setCouponMessageType('error');
    } finally {
        setIsValidatingCoupon(false);
    }
  };

  // --- Form Submission Handlers ---
  const handleStep1Submit = async (event) => {
    event.preventDefault();
    if (!agreeTnc) return toast.error('You must agree to the Terms & Conditions.');
    setIsLoading(true);
    
    const attendeeObjects = attendees.map(a => ({ name: a.name.trim(), gender: a.gender }));
    
    try {
      const response = await fetch('/api/purchase/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          attendees: attendeeObjects, 
          ticketType: selectedTier.id,
          wantsMarketingUpdates: agreeWhatsapp,
          appliedCoupon: appliedCoupon,
          baseTotal,
          finalAmountPaid: finalTotal,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setPurchaseId(result.purchaseId);
      setStep(2);
      toast.success('Details confirmed. Please complete payment.');
    } catch (error) {
      toast.error(error.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData();
    formData.append('utr', utr);
    formData.append('screenshot', screenshot);
    try {
      const response = await fetch(`/api/purchase/confirm/${purchaseId}`, {
        method: 'PATCH',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message);
      setStep(3); 
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setAttendees([{ ...defaultAttendee }]);
    setSelectedTierId(eventConfig.tiers[0].id);
    setAgreeTnc(false);
    setAgreeWhatsapp(false);
    setUtr('');
    setScreenshot(null);
    setStep(1); 
    setPurchaseId(null);
    setIsLoading(false);
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponMessage('');
  };

  // --- Render Logic ---
  const getTicketDescription = () => {
    if (selectedTierId === 'couple') return '1 Couple Pass';
    if (selectedTierId === 'groupof5') return '1 Group of 5 Pass';
    return `${attendees.length} ticket(s)`;
  };
  
  if (step === 1) {
    const isGroupPass = ['couple', 'groupof5'].includes(selectedTierId);
    return (
      <div className={eventPageStyles.pageContainer}>
        <div className={eventPageStyles.eventCard}>
          <h1 className={eventPageStyles.title}>Book Your Pass</h1>
          <form className={styles.formContainer} onSubmit={handleStep1Submit}>
            <div className={styles.tierContainer}>
              {eventConfig.tiers.map(tier => (
                <label key={tier.id} className={styles.tierOption}>
                  <input type="radio" name="ticketTier" value={tier.id} checked={selectedTierId === tier.id} onChange={(e) => setSelectedTierId(e.target.value)} />
                  <div>
                    <strong>{tier.name}</strong> - ₹{tier.price}
                    <small>
                      {tier.id === 'couple' ? 'Total for 2 Guests. ' : tier.id === 'groupof5' ? 'Total for 5 Guests. ' : ''}
                      {tier.perks.join(', ')}
                    </small>
                  </div>
                </label>
              ))}
            </div>

            <input type="tel" placeholder="Phone / WhatsApp Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <hr className={styles.divider} />
            
            {attendees.map((attendee, index) => (
              <div key={index} className={styles.attendeeInputGroup}> 
                <div className={styles.attendeeInput}>
                  <input type="text" placeholder={`Attendee ${index + 1} Name`} value={attendee.name} onChange={(e) => handleAttendeeFieldChange(index, 'name', e.target.value)} required />
                  {attendees.length > 1 && !isGroupPass && (
                    <button type="button" onClick={() => removeAttendee(index)} className={styles.removeBtn}>Remove</button>
                  )}
                </div>
                <div className={styles.genderSelector}> 
                  <label><input type="radio" name={`gender-${index}`} value="male" checked={attendee.gender === 'male'} onChange={(e) => handleAttendeeFieldChange(index, 'gender', e.target.value)}/> Male</label>
                  <label><input type="radio" name={`gender-${index}`} value="female" checked={attendee.gender === 'female'} onChange={(e) => handleAttendeeFieldChange(index, 'gender', e.target.value)}/> Female</label>
                </div>
              </div>
            ))}
            
            {!isGroupPass && <button type="button" onClick={addAttendee} className={styles.addBtn}>+ Add Another Attendee</button>}

            <hr className={styles.divider} />

            <div className={styles.couponInputContainer}>
              <input type="text" placeholder="Enter Coupon Code" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setAppliedCoupon(null); setCouponMessage(''); }} />
              <button type="button" onClick={handleValidateCoupon} className={styles.applyBtn} disabled={isValidatingCoupon}>{isValidatingCoupon ? '...' : 'Apply'}</button>
            </div>
            {couponMessage && <p className={`${styles.couponMessage} ${styles[couponMessageType]}`}>{couponMessage}</p>}
            
            <label className={styles.checkboxLabel}><input type="checkbox" checked={agreeTnc} onChange={(e) => setAgreeTnc(e.target.checked)} /> I agree to the <Link to="/terms-and-conditions" target="_blank"><strong>Terms & Conditions</strong></Link></label>
            <button className={eventPageStyles.bookButton} disabled={isLoading || !agreeTnc}>{isLoading ? 'Processing...' : `Proceed to Pay ₹${finalTotal}`}</button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className={eventPageStyles.pageContainer}>
        <div className={eventPageStyles.eventCard}>
          <h1 className={eventPageStyles.title}>Complete Payment</h1>
          <div className={styles.paymentInstructions}>
            <p>Please pay <strong>₹{finalTotal}</strong> for <strong>{getTicketDescription()}</strong></p>
            {discountAmount > 0 && (
              <p className={styles.couponMessage + ' ' + styles.success}> (Total ₹{baseTotal} - ₹{discountAmount} discount applied)</p>
            )}
            <p>Scan the QR code below or pay via UPI to:</p>
            <strong>{eventConfig.paymentUpiId}</strong>
            <img src={paymentQrCode} alt="Payment QR Code" className={styles.paymentQr} />
            <p>After paying, upload the screenshot and enter the Transaction ID to confirm.</p>
          </div>
          <form className={styles.formContainer} onSubmit={handleStep2Submit}>
            <input type="text" placeholder="Payment UTR / Transaction ID" value={utr} onChange={(e) => setUtr(e.target.value)} required />
            <label>Upload Payment Screenshot</label>
            <input type="file" onChange={(e) => setScreenshot(e.target.files[0])} required accept="image/*" />
            <button className={eventPageStyles.bookButton} disabled={isLoading}>{isLoading ? 'Submitting...' : 'Submit for Approval'}</button>
          </form>
        </div>
      </div>
    );
  }
  
  if (step === 3) {
     return (
      <div className={eventPageStyles.pageContainer}>
        <div className={eventPageStyles.eventCard}>
          <div className={styles.successContainer}>
            <h1 className={eventPageStyles.title}>Booking Received!</h1>
            <p className={styles.successText}>
              Your submission for <strong>{getTicketDescription()}</strong>
              &nbsp;is confirmed and is now under review. Passes will be generated upon approval (typically within 20-30min).
            </p>
            <p className={styles.successText}>
              You can check the status of your booking at any time using your phone number.
            </p>
            <p>For any Query Contact +918210463197</p>
            <div className={styles.successActions}>
              <Link to="/status" className={eventPageStyles.bookButton}>Check Your Status</Link>
              <button onClick={resetForm} className={styles.bookAnotherButton}>Book Another Ticket</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BookingForm;
