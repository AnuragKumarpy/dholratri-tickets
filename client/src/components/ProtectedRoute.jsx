import { Navigate } from 'react-router-dom';

// This component is a wrapper.
// It checks if a user is logged in. If they are, it renders the page (its "children").
// If not, it redirects them to the /login page.

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken');

  if (!token) {
    // No token found, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // Token exists, render the component they were trying to access
  return children;
}

export default ProtectedRoute;