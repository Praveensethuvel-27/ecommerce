import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);

    try {
      const { user } = await login(email, password);
      const from = location.state?.from;
      if (user.role === 'admin') {
        navigate(from || '/admin');
      } else {
        navigate(from || '/');
      }
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <h1 className="text-2xl font-bold text-[#6B4423] mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[#8B7355]">
          <Link to="/register" className="text-[#2D5A27] hover:underline">
            New customer? Register
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[#8B7355]">
          <a href="#" className="text-[#2D5A27] hover:underline">Forgot Password?</a>
        </p>
      </Card>
    </div>
  );
}

export default Login;
