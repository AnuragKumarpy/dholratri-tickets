import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // Adjust based on your auth logic
  return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
