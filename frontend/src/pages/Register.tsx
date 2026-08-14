import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Building, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password,
        organization
      });
      
      if (response.data && response.data.token) {
        login(response.data, response.data.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F7F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-[#11133A] rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Shield className="w-8 h-8 text-white fill-white" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-[#11133A] tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium tracking-wide">
            PII Redaction Tool
          </p>
        </div>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-10 px-6 shadow-sm rounded-2xl border border-gray-100 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#11133A]">Full Name</label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="focus:ring-[#5B2BE0] focus:border-[#5B2BE0] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-3 bg-[#F7F7FA] transition-colors hover:bg-gray-50/50 outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-[#11133A]">Email</label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-[#5B2BE0] focus:border-[#5B2BE0] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-3 bg-[#F7F7FA] transition-colors hover:bg-gray-50/50 outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-[#11133A]">Organization <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="focus:ring-[#5B2BE0] focus:border-[#5B2BE0] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-3 bg-[#F7F7FA] transition-colors hover:bg-gray-50/50 outline-none"
                    placeholder="Company Inc."
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-[#11133A]">Password</label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-[#5B2BE0] focus:border-[#5B2BE0] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-3 bg-[#F7F7FA] transition-colors hover:bg-gray-50/50 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-[#11133A]">Confirm Password</label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="focus:ring-[#5B2BE0] focus:border-[#5B2BE0] block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-3 bg-[#F7F7FA] transition-colors hover:bg-gray-50/50 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all disabled:opacity-70 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #5B2BE0 0%, #6D3FE8 100%)' }}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3.5 px-4 border-2 border-gray-100 rounded-xl shadow-sm text-sm font-bold text-[#11133A] bg-white hover:bg-gray-50 transition-colors"
              >
                Login
              </Link>
            </div>

            <div className="mt-6">
              <button
                onClick={handleContinueWithoutLogin}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-gray-500 hover:text-[#11133A] bg-transparent hover:bg-gray-50 transition-colors"
              >
                Continue Without Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
