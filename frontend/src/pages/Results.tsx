import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, CheckCircle, ArrowLeft, ShieldCheck, FileText, PieChart as PieChartIcon, Trash2, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { downloadRedactedDocument } from '../utils/download';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DocumentDetails {
  _id: string;
  originalFilename: string;
  status: string;
  totalPII: number;
  piiBreakdown: Record<string, number>;
  processingTime: number;
  createdAt: string;
}

function DocumentsList() {
  const [documents, setDocuments] = useState<DocumentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/documents')
      .then(res => setDocuments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(docs => docs.filter(d => d._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-500">Loading documents...</div>;

  return (
    <div className="max-w-[1200px] mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#11133A]">My Documents</h1>
        <p className="text-gray-500 text-sm mt-1">View and manage your redacted documents.</p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#11133A] mb-4">No Documents Found</h2>
          <p className="text-gray-500 mb-6">Upload a document to see your redaction results here.</p>
          <button onClick={() => navigate('/upload')} className="px-6 py-3 bg-[#11133A] text-white rounded-lg font-medium hover:bg-[#1f2261] transition-colors">
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(doc => (
            <Link key={doc._id} to={`/results/${doc._id}`} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col">
              <button 
                onClick={(e) => handleDelete(doc._id, e)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4 mb-4 pr-8">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate" title={doc.originalFilename}>{doc.originalFilename}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 ${doc.totalPII > 0 ? 'text-red-500' : 'text-gray-300'}`} />
                  <span className="text-sm font-medium text-gray-700">{doc.totalPII || 0} PII</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  doc.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {doc.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDoc = async () => {
    try {
      const res = await api.get(`/documents/${id}/results`);
      setDoc(res.data);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch results');
      return null;
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const init = async () => {
      setLoading(true);
      await fetchDoc();
      setLoading(false);
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!doc || !['redacting', 'verifying'].includes(doc.status)) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      await fetchDoc();
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [doc?.status, id]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!id) {
    return <DocumentsList />;
  }

  if (error || !doc) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate('/upload')} className="text-[#5B2BE0] font-medium">Go back to upload</button>
      </div>
    );
  }

  const handleRedact = async () => {
    try {
      setActionError('');
      // We pass an empty entities array so the backend uses all detected entities by default
      await api.post(`/documents/${doc._id}/redact`, { entities: [] });
      await fetchDoc(); // Update status immediately
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to start redaction');
    }
  };

  const handleDownload = async () => {
    try {
      setActionError('');
      await downloadRedactedDocument(doc!._id, doc!.originalFilename);
    } catch (err: any) {
      setActionError(err.message || 'The redacted document could not be downloaded.');
    }
  };

  const aggregatedStats: Record<string, number> = {
    'PERSON': 0,
    'EMAIL_ADDRESS': 0,
    'PHONE_NUMBER': 0,
    'OTHER': 0
  };

  if (doc.piiBreakdown) {
    Object.keys(doc.piiBreakdown).forEach(key => {
      if (key === 'PERSON' || key === 'EMAIL_ADDRESS' || key === 'PHONE_NUMBER') {
        aggregatedStats[key] += doc.piiBreakdown[key];
      } else {
        aggregatedStats['OTHER'] += doc.piiBreakdown[key];
      }
    });
  }

  const data = [
    { name: 'Names', value: aggregatedStats['PERSON'], color: '#5B2BE0' },
    { name: 'Emails', value: aggregatedStats['EMAIL_ADDRESS'], color: '#F59E0B' },
    { name: 'Phones', value: aggregatedStats['PHONE_NUMBER'], color: '#10B981' },
    { name: 'Other', value: aggregatedStats['OTHER'], color: '#6B7280' }
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/results')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Documents
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#11133A] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Redaction Complete</h2>
              <p className="text-gray-300 text-sm">{doc.originalFilename}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300 mb-1">Status</p>
            <div className="flex justify-end">
              {doc.status === 'redacted' && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Successfully Redacted</span>}
              {doc.status === 'completed' && <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Analysis Complete</span>}
              {doc.status === 'completed_no_pii' && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> No PII Detected</span>}
              {['failed', 'extraction_failed', 'redaction_verification_failed'].includes(doc.status) && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Processing Failed</span>}
              {['uploaded', 'validating', 'extracting', 'ocr_processing', 'detecting_pii', 'classifying', 'redacting', 'verifying'].includes(doc.status) && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">Processing...</span>}
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total PII Found</h3>
              <p className="text-4xl font-bold text-gray-900">{doc.totalPII}</p>
            </div>

            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Actions</h3>
            {actionError && <p className="text-red-500 text-sm mb-3">{actionError}</p>}
            <div className="space-y-3">
              {doc.status === 'completed' && (
                <button 
                  onClick={handleRedact}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#5B2BE0] text-white rounded-lg font-medium hover:bg-[#4f24c7] transition-colors"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Redact Document
                </button>
              )}
              
              {['redacting', 'verifying'].includes(doc.status) && (
                <button 
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#5B2BE0]/70 text-white rounded-lg font-medium cursor-not-allowed"
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Redaction...
                </button>
              )}
              
              {doc.status === 'redacted' && (
                <button 
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#5B2BE0] text-white rounded-lg font-medium hover:bg-[#4f24c7] transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Redacted Document
                </button>
              )}
              
              <button 
                onClick={() => navigate(`/reports/${doc._id}`)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-[#11133A] rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FileText className="w-5 h-5 text-gray-400" />
                View Full Report
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">PII Breakdown</h3>
            </div>
            
            {doc.totalPII > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-10">No PII was detected in this document.</p>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
