import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import pageStyles from './EventPage.module.css'; // Reusing page container styles
import formStyles from './LoginPage.module.css'; // Using our new login form styles

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      // LOGIN SUCCESS!
      // 1. Save the token to the browser's local storage
      localStorage.setItem('authToken', result.token);

      // 2. Show success toast and redirect
      toast.success('Login Successful!');
      navigate('/admin'); // Redirect admin to the dashboard

    } catch (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
    // No finally block, we only want loading to stop on error. On success, we navigate away.
  };

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.eventCard}>
        <h1 className={pageStyles.title}>Admin & Scanner Login</h1>
        <form className={formStyles.loginContainer} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className={pageStyles.bookButton} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;