import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import EventPage from './components/EventPage';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import StatusPage from './components/StatusPage';
import ScannerPage from './components/ScannerPage';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import TermsPage from './components/TermsPage'; // 1. IMPORT THE NEW PAGE

function App() {
  return (
    <>
      <main>
        <Toaster position="top-center" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<EventPage />} />
          <Route path="/book" element={<BookingForm />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} /> {/* 2. ADD THE NEW ROUTE */}

          {/* Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <ScannerPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      
      <Footer /> 
    </>
  );
}

export default App;