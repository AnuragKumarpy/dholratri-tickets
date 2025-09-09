import { useState, useEffect } from 'react'; // useEffect is already imported
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
  const [couponCode, setCouponCode] = useState('');
  const [agreeTnc, setAgreeTnc] = useState(false);
  const [agreeWhatsapp, setAgreeWhatsapp] = useState(false);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [step, setStep] = useState(1);
  
  const [purchaseId, setPurchaseId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- UPDATED useEffect HOOK TO HANDLE ALL GROUP PASSES ---
  useEffect(() => {
    if (selectedTierId === 'couple') {
      // If "Couple Pass" is selected, force exactly two attendees
      setAttendees([
        { ...defaultAttendee }, 
        { ...defaultAttendee }
      ]);
    } else if (selectedTierId === 'groupof5') {
      // NEW: If "Group of 5" is selected, force exactly five attendees
      setAttendees([
        { ...defaultAttendee }, 
        { ...defaultAttendee },
        { ...defaultAttendee },
        { ...defaultAttendee },
        { ...defaultAttendee }
      ]);
    } else {
      // If any other pass is selected, reset to one attendee
      setAttendees([{ ...defaultAttendee }]);
    }
  }, [selectedTierId]); // This logic runs every time the selectedTierId changes

  // --- State handler (Unchanged) ---
  const handleAttendeeFieldChange = (index, field, value) => {
    const newAttendees = [...attendees];
    newAttendees[index][field] = value;
    setAttendees(newAttendees);
  };
  
  // --- Attendee Functions (Unchanged) ---
  const addAttendee = () => {
    setAttendees([...attendees, { ...defaultAttendee }]);
  };
  const removeAttendee = (index) => {
    const newAttendees = attendees.filter((_, i) => i !== index);
    setAttendees(newAttendees);
  };

  // --- !! UPDATED PRICE CALCULATION LOGIC !! ---
  const selectedTier = eventConfig.tiers.find(t => t.id === selectedTierId);
  
  // UPDATED CONDITIONAL LOGIC FOR PRICE
  let baseTotal;
  if (selectedTier.id === 'couple' || selectedTier.id === 'groupof5') {
    // For couple OR group pass, the price is the total, not per-person
    baseTotal = selectedTier.price;
  } else {
    // For all other passes, use the original logic
    baseTotal = selectedTier.price * attendees.length;
  }
  
  let calculatedDiscount = 0;
  let couponDisplayMessage = "";

  const currentDate = new Date(); 
  const expiryDate = new Date('2025-09-16T00:00:00'); 
  const isCouponCodeCorrect = couponCode.trim().toLowerCase() === 'earlybird';
  const isDateValid = currentDate < expiryDate;

  // UPDATED COUPON LOGIC
  if (isCouponCodeCorrect && isDateValid) {
    if (selectedTier.id === 'couple') {
      calculatedDiscount = 100; // Example: Flat ₹200 off for a couple pass
      couponDisplayMessage = `Congrats! "EarlyBird" saved your couple pass ₹${calculatedDiscount}!`;
    } else if (selectedTier.id === 'groupof5') {
      calculatedDiscount = 100; // Example: Flat ₹500 off for a group pass
      couponDisplayMessage = `Congrats! "EarlyBird" saved your group pass ₹${calculatedDiscount}!`;
    } else {
      calculatedDiscount = attendees.length * 100; // Original: ₹100 off per ticket
      couponDisplayMessage = `Congrats! "EarlyBird" saved you ₹${calculatedDiscount}!`;
    }
  } else if (isCouponCodeCorrect && !isDateValid) {
    couponDisplayMessage = "Sorry, the 'EarlyBird' coupon has expired.";
  } else if (couponCode.trim() !== "") {
    couponDisplayMessage = "Invalid coupon code.";
  }
  
  const finalTotal = baseTotal - calculatedDiscount;

  // --- FORM SUBMISSION LOGIC (Unchanged) ---
  const handleStep1Submit = async (event) => {
    event.preventDefault();
    if (!agreeTnc) {
      toast.error('You must agree to the Terms & Conditions.');
      return;
    }
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
          appliedCoupon: isCouponCodeCorrect && isDateValid ? 'earlybird' : 'none', 
          discountAmount: calculatedDiscount,
          finalAmountPaid: finalTotal 
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

  // --- HandleStep2Submit (Unchanged) ---
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

  // --- resetForm (Unchanged) ---
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
  };

  // --- RENDER LOGIC ---

  // RENDER STEP 1: INFO FORM
  if (step === 1) {
    const isGroupPass = selectedTierId === 'couple' || selectedTierId === 'groupof5';
    return (
      <div className={eventPageStyles.pageContainer}>
        <div className={eventPageStyles.eventCard}>
          <h1 className={eventPageStyles.title}>Book Your Pass(es)</h1>
          <form className={styles.formContainer} onSubmit={handleStep1Submit}>
            
            <div className={styles.tierContainer}>
              {eventConfig.tiers.map(tier => (
                <label key={tier.id} className={styles.tierOption}>
                  <input type="radio" name="ticketTier" value={tier.id} checked={selectedTierId === tier.id} onChange={(e) => setSelectedTierId(e.target.value)} />
                  <div>
                    <strong>{tier.name}</strong> - ₹{tier.price}
                    {/* UPDATED: Descriptive text for all group passes */}
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
                  <input 
                    type="text" 
                    placeholder={isGroupPass ? `Attendee ${index + 1} Name` : `Attendee ${index + 1} Name (as per ID)`}
                    value={attendee.name} 
                    onChange={(e) => handleAttendeeFieldChange(index, 'name', e.target.value)} 
                    required 
                  />
                  {/* UPDATED: Hide "Remove" button for ALL group passes */}
                  {attendees.length > 1 && !isGroupPass && (
                    <button type="button" onClick={() => removeAttendee(index)} className={styles.removeBtn}>Remove</button>
                  )}
                </div>
  
                <div className={styles.genderSelector}> 
                  <label>
                    <input 
                      type="radio" 
                      name={`gender-${index}`} 
                      value="male" 
                      checked={attendee.gender === 'male'} 
                      onChange={(e) => handleAttendeeFieldChange(index, 'gender', e.target.value)}
                    /> Male
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name={`gender-${index}`} 
                      value="female" 
                      checked={attendee.gender === 'female'} 
                      onChange={(e) => handleAttendeeFieldChange(index, 'gender', e.target.value)}
                    /> Female
                  </label>
                </div>
              </div>
            ))}
            
            {/* UPDATED: Only show "Add" button if NOT a group pass */}
            {!isGroupPass && (
              <button type="button" onClick={addAttendee} className={styles.addBtn}>+ Add Another Attendee</button>
            )}

            <hr className={styles.divider} />

            <input 
              type="text" 
              placeholder="Apply Coupon Code (Use - EARLYBIRD)" 
              value={couponCode} 
              onChange={(e) => setCouponCode(e.target.value)} 
            />
            {couponDisplayMessage && (
              <p className={`${styles.couponMessage} ${calculatedDiscount > 0 ? styles.couponSuccess : styles.couponError}`}>
                {couponDisplayMessage}
              </p>
            )}
            
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={agreeTnc} onChange={(e) => setAgreeTnc(e.target.checked)} />
              I agree to the&nbsp;
              <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                <strong>Terms & Conditions</strong>
              </Link>
              &nbsp;(Mandatory)
            </label>

            <button className={eventPageStyles.bookButton} disabled={isLoading || !agreeTnc}>
              {isLoading ? 'Processing...' : `Proceed to Pay ₹${finalTotal}`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- HELPER FUNCTION FOR RENDER STEPS 2 & 3 ---
  const getTicketDescription = () => {
    if (selectedTierId === 'couple') return '1 Couple Pass';
    if (selectedTierId === 'groupof5') return '1 Group of 5 Pass';
    return `${attendees.length} ticket(s)`;
  };

  // RENDER STEP 2: PAYMENT FORM
  if (step === 2) {
    return (
      <div className={eventPageStyles.pageContainer}>
        <div className={eventPageStyles.eventCard}>
          <h1 className={eventPageStyles.title}>Complete Payment</h1>
          
          <div className={styles.paymentInstructions}>
             {/* UPDATED: Text in this block is now dynamic */}
            <p>Please pay <strong>₹{finalTotal}</strong> for <strong>{getTicketDescription()}</strong></p>
            {calculatedDiscount > 0 && (
              <p className={styles.couponSuccess}> (Total ₹{baseTotal} - ₹{calculatedDiscount} discount applied)</p>
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

            <button className={eventPageStyles.bookButton} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  // RENDER STEP 3: SUCCESS PAGE
  if (step === 3) {
     return (
      <div className={eventPageStyles.pageContainer}>
        <div className={eventPageStyles.eventCard}>
          <div className={styles.successContainer}>
            <h1 className={eventPageStyles.title}>Booking Received!</h1>
            <p className={styles.successText}>
              {/* UPDATED: Text in this block is now dynamic */}
              Your submission for <strong>{getTicketDescription()}</strong>
              &nbsp;is confirmed and is now under review.
              Passes will be generated upon approval (typically within 20-30min).
            </p>
            <p className={styles.successText}>
              You can check the status of your booking at any time using your phone number.
            </p>
            <p>For any Query Contact +918210463197</p>
            
            <div className={styles.successActions}>
              <Link to="/status" className={eventPageStyles.bookButton}>
                Check Your Status
              </Link>
              <button onClick={resetForm} className={styles.bookAnotherButton}>
                Book Another Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BookingForm;
