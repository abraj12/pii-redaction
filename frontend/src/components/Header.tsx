import { HelpCircle, User, LogOut, Settings, FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <header 
      className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-8 py-5 mb-8"
      style={{
        background: 'rgba(247, 247, 250, 0.96)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(20, 20, 60, 0.08)'
      }}
    >
      <div>
        <h2 className="text-3xl font-bold text-[#11133A] tracking-tight">PII Redaction Tool</h2>
        <p className="text-slate-500 mt-2 text-sm">Upload a document and detect & redact Personally Identifiable Information (PII)</p>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/help')}
          title="Help & Documentation"
          className="p-2 text-gray-400 hover:text-[#11133A] transition-colors rounded-full hover:bg-white shadow-sm border border-transparent hover:border-gray-200"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        
        {!user ? (
          <div className="flex items-center gap-3 ml-2 relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#11133A] leading-tight">Guest</p>
                <p className="text-xs text-gray-500 font-medium">Anonymous</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-500 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-bold text-gray-900">Guest User</p>
                  <p className="text-xs text-gray-500">Not logged in</p>
                </div>
                <Link to="/login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Create Account
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 ml-2 relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#11133A] leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500 font-medium capitalize">{user.role}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#11133A] text-white shadow-md font-bold">
                {getInitials(user.name)}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 mb-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4 text-gray-400" />
                  View Profile
                </Link>
                <Link to="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </Link>
                <Link to="/results" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <FileText className="w-4 h-4 text-gray-400" />
                  My Documents
                </Link>
                <div className="h-px bg-gray-100 my-2"></div>
                <button 
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
