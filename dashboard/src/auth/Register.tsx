import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, checkEmailExists } from './AuthService'; // Re-import register

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  // Removed: const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setError('Email already registered');
        return;
      }
      await register(username, email, password); // Use imported register function
      navigate('/dashboard');
    } catch { // Removed (err)
      setError('Registration failed');
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <div className="flex justify-center mb-8">
            <img
              alt="VoiceAIAgent"
              className="h-8 w-auto"
              src="/logo.png"
            />
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Create your account</h1>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="johndoe"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordStrength(calculatePasswordStrength(e.target.value));
                }}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
              <div className="mt-1">
                <div
                  className="password-strength"
                  style={{
                    height: '4px',
                    transition: 'width 0.3s ease',
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#22c55e'][passwordStrength],
                    width: ['20%', '40%', '60%', '80%', '100%'][passwordStrength]
                  }}
                ></div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-red-600">Password must be at least 8 characters</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 ml-1">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}