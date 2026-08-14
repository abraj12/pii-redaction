import { useState } from 'react';
import { Shield, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Guest users cannot access settings properly
  if (!user) {
    return (
      <div className="max-w-[800px] mx-auto py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#11133A] mb-2">Settings Unavailable</h2>
          <p className="text-gray-500 mb-6">You must be logged in to access account settings.</p>
          <a href="/login" className="px-6 py-3 bg-[#11133A] text-white rounded-lg font-medium hover:bg-[#1f2261]">
            Log In
          </a>
        </div>
      </div>
    );
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: '', message: '' });
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setStatus({ type: 'success', message: 'Password updated successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#11133A]">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your security preferences and account settings.</p>
      </div>

      <div className="space-y-6">
        
        {/* SECURITY SETTINGS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-3">
            <Key className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-900">Change Password</h2>
          </div>
          
          <div className="p-6">
            {status.message && (
              <div className={`p-4 rounded-lg mb-6 text-sm font-medium flex items-center gap-2 ${
                status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {status.message}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#11133A] focus:border-[#11133A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#11133A] focus:border-[#11133A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#11133A] focus:border-[#11133A]"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#11133A] text-white font-medium rounded-lg hover:bg-[#1f2261] transition-colors text-sm"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* DATA RETENTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-900">Data & Privacy</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              As a registered user, your uploaded documents and redaction reports are securely stored for <span className="font-bold">30 days</span> before being automatically deleted. 
              You can manually delete any document at any time from the "My Documents" page.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
