import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, CheckCircle, Clock, Download, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { downloadRedactedDocument } from '../utils/download';
import { useAuth } from '../context/AuthContext';
import RecentUploads from '../components/RecentUploads';
import PIICategories from '../components/PIICategories';
import RedactionSummary from '../components/RedactionSummary';

export default function Dashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [latestDoc, setLatestDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, latestRes] = await Promise.all([
        api.get('/documents'),
        api.get('/documents/latest-redacted').catch(() => ({ data: null }))
      ]);
      setDocuments(docsRes.data);
      setLatestDoc(latestRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLatest = async () => {
    if (!latestDoc) return;
    try {
      await downloadRedactedDocument(latestDoc._id, latestDoc.originalFilename);
    } catch (err: any) {
      alert(err.message || 'Failed to download document. It may have expired or been deleted.');
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-gray-500">Loading dashboard...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-[#11133A]/10 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-[#11133A]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No documents processed yet</h2>
        <p className="text-gray-500 mb-8">Upload your first document to detect and redact Personally Identifiable Information securely.</p>
        <Link 
          to="/upload" 
          className="px-6 py-3 bg-[#11133A] text-white font-medium rounded-xl hover:bg-[#1f2261] transition-all shadow-md flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Upload Document
        </Link>
      </div>
    );
  }

  // Calculate stats
  const totalProcessed = documents.length;
  const totalPII = documents.reduce((sum, doc) => sum + (doc.totalPII || 0), 0);
  const totalRedacted = documents.filter(d => d.status === 'completed').length;
  const totalVerified = documents.filter(d => d.verificationMetadata?.verificationPassed).length;

  return (
    <div className="flex flex-col min-h-full py-4 space-y-8">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#11133A]">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor your document processing and PII redaction activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/upload" 
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Upload New
          </Link>
          <button 
            onClick={handleDownloadLatest}
            disabled={!latestDoc}
            className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg text-sm transition-colors shadow-sm ${
              latestDoc 
                ? 'bg-[#11133A] text-white hover:bg-[#1f2261]' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            Download Latest Redacted
          </button>
        </div>
      </div>

      {/* STATS WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Documents Processed</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalProcessed}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total PII Detected</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalPII}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Documents Redacted</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalRedacted}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Successful Verifications</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalVerified}</h3>
          </div>
        </div>
      </div>

      {/* PII CATEGORIES */}
      <PIICategories documents={documents} />

      {/* BOTTOM ROW: Recent Uploads (65%) and Redaction Summary (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 pb-8 mt-2">
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <h3 className="text-lg font-bold text-gray-900">Recent Uploads</h3>
            <Link to="/results" className="text-sm text-[#5B2BE0] font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <RecentUploads documents={documents.slice(0, 5)} setDocuments={setDocuments} />
        </div>
        <div className="lg:col-span-4 xl:col-span-3">
          <RedactionSummary documents={documents} />
        </div>
      </div>

    </div>
  );
}
