import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken');
  console.log('ProtectedRoute Token:', token); // Add for debugging
  if (!token) {
    console.log('No token, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
