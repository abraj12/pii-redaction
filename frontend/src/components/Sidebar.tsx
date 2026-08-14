import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Upload, History, FileText, Settings, Info, ExternalLink } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Document', path: '/upload', icon: Upload },
    { name: 'Redaction Results', path: '/results', icon: History },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About', path: '/about', icon: Info },
  ];

  return (
    <aside 
      className="fixed left-0 top-0 h-screen hidden md:flex flex-col w-[270px] text-white shrink-0 z-40 shadow-xl"
      style={{ background: 'linear-gradient(180deg, #11133A 0%, #19164A 45%, #24135C 100%)' }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-white fill-white" />
          <h1 className="text-xl font-bold tracking-tight text-white">PII Redaction Tool</h1>
        </div>
        <p className="text-xs text-[#C8C9E8] font-medium tracking-wide">Protect. Redact. Preserve.</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          // Simple active check. In reality, you'd match the exact path or use NavLink.
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'text-white' 
                  : 'text-[#C8C9E8] hover:bg-white/[0.08] hover:text-white rounded-[10px]'
              }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, #5B2BE0 0%, #6D3FE8 100%)',
                boxShadow: '0 6px 18px rgba(91, 43, 224, 0.25)',
                borderRadius: '10px'
              } : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#E6E5FF]'}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto mb-4">
        <div 
          className="rounded-xl p-4"
          style={{ background: 'rgba(93, 67, 180, 0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h4 className="text-sm font-semibold text-white mb-2">Need Help?</h4>
          <p className="text-xs text-[#C8C9E8] mb-4 leading-relaxed">
            Check documentation or contact support.
          </p>
          <Link
            to="/help"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-white rounded-lg text-xs font-medium transition-colors hover:bg-white/[0.18]"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            View Docs <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
