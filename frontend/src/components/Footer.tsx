import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto pt-8 pb-6 border-t border-gray-200/60 text-sm text-gray-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <p>© 2026 PII Redaction Tool.</p>
          <p className="text-xs mt-1 text-gray-400">Designed & Developed by Abhishek Kumar Raj</p>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/about" className="hover:text-[#11133A] font-medium transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-[#11133A] font-medium transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-[#11133A] font-medium transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
