import { Shield, Server, Globe, User } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-[800px] mx-auto py-6 space-y-8">
      <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-200">
        <Shield className="w-16 h-16 text-[#11133A] mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-[#11133A] tracking-tight mb-4">About PII Redaction Tool</h1>
        <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
          An enterprise-grade document processing pipeline designed to automatically detect and safely redact Personally Identifiable Information from PDFs, DOCX, and Text files.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Frontend Stack</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• React 18 & TypeScript</li>
            <li>• Vite & Tailwind CSS</li>
            <li>• Recharts (Data Visualization)</li>
            <li>• Lucide React (Iconography)</li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
            <Server className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Backend Architecture</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Node.js & Express API</li>
            <li>• Python / FastAPI Engine</li>
            <li>• Microsoft Presidio NLP</li>
            <li>• Multi-Strategy Extraction (Mammoth, XML)</li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900 text-lg mb-2">Designed & Developed By</h3>
        <p className="text-[#5B2BE0] font-bold text-xl mb-2">Abhishek Kumar Raj</p>
        <p className="text-sm text-gray-500">Full-Stack Engineer & AI Enthusiast</p>
      </div>
    </div>
  );
}
