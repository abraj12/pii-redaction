import { Download, Trash2, ArrowRight, Info, CheckCircle2, XCircle, Clock, Eye, RefreshCw, BarChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface DocumentRecord {
  _id: string;
  originalFilename: string;
  createdAt: string;
  status: string;
  totalPII: number;
}

interface RecentUploadsProps {
  documents: DocumentRecord[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentRecord[]>>;
}

export default function RecentUploads({ documents, setDocuments }: RecentUploadsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStatusConfig = (status: string) => {
    if (['uploaded', 'validating', 'extracting', 'ocr_processing', 'detecting_pii', 'classifying', 'redacting', 'verifying'].includes(status)) {
      return { color: 'bg-purple-100 text-[#5B2BE0]', icon: Clock, text: 'Analyzing' };
    }
    if (status === 'completed' || status === 'completed_no_pii') {
      return { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, text: 'Analysis Complete' };
    }
    if (status === 'redacted') {
      return { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, text: 'Redacted' };
    }
    if (status === 'failed' || status === 'extraction_failed' || status === 'redaction_verification_failed') {
      return { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Failed' };
    }
    return { color: 'bg-gray-100 text-gray-700', icon: Clock, text: status };
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(docs => docs.filter(d => d._id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'redacted_document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const renderAction = (doc: DocumentRecord) => {
    const s = doc.status;
    if (['uploaded', 'validating', 'extracting', 'ocr_processing', 'detecting_pii', 'classifying'].includes(s)) {
      return (
        <button onClick={() => navigate(`/processing/${doc._id}`)} className="text-gray-400 hover:text-[#5B2BE0] transition-colors" title="View Progress">
          <Eye className="w-4 h-4" />
        </button>
      );
    }
    if (['redacting', 'verifying'].includes(s)) {
      return (
        <button onClick={() => navigate(`/redacting/${doc._id}`)} className="text-gray-400 hover:text-[#5B2BE0] transition-colors" title="View Progress">
          <Eye className="w-4 h-4" />
        </button>
      );
    }
    if (['completed_no_pii', 'completed'].includes(s)) {
      return (
        <button onClick={() => navigate(`/review/${doc._id}`)} className="text-gray-400 hover:text-[#5B2BE0] transition-colors" title="View Results">
          <BarChart className="w-4 h-4" />
        </button>
      );
    }
    if (s === 'redacted') {
      return (
        <button onClick={() => handleDownload(doc._id)} className="text-gray-400 hover:text-green-600 transition-colors" title="Download">
          <Download className="w-4 h-4" />
        </button>
      );
    }
    if (['failed', 'extraction_failed', 'redaction_verification_failed'].includes(s)) {
      return (
        <button onClick={() => navigate(`/processing/${doc._id}`)} className="text-gray-400 hover:text-red-500 transition-colors" title="Retry">
          <RefreshCw className="w-4 h-4" />
        </button>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#11133A]">Recent Uploads</h3>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        {!user ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50/50">
            <Info className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-4">
              Your temporary uploads are processed without being saved to a history log.
            </p>
            <a href="/register" className="text-sm font-bold text-[#5B2BE0] hover:text-[#4f24c7] transition-colors">
              Create an account to save history
            </a>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8 text-sm text-gray-500">
            No documents processed yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((doc) => {
                const config = getStatusConfig(doc.status);
                return (
                  <tr key={doc._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#11133A] truncate max-w-[200px]">{doc.originalFilename}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                        <config.icon className="w-3 h-3" />
                        {config.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {renderAction(doc)}
                        <button onClick={() => handleDelete(doc._id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {user && documents.length > 0 && (
        <div className="p-4 border-t border-gray-100 text-center">
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B2BE0] hover:text-[#4f24c7] transition-colors">
            View All Files <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
