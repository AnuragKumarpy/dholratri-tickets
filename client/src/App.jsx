import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // 1. Import
import EventPage from './components/EventPage';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import StatusPage from './components/StatusPage';
import ScannerPage from './components/ScannerPage';

function App() {
  return (
    <div>
      <Toaster position="top-center" /> {/* 2. Add Toaster component */}
      <Routes>
        <Route path="/" element={<EventPage />} />
        <Route path="/book" element={<BookingForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
      </Routes>
    </div>
  );
}

export default App;