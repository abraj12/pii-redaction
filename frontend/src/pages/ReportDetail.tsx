import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/documents/${id}/report`);
        setReport(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch report');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id]);

  const handleDownloadFormat = async (format: string) => {
    if (!report) return;
    try {
      const response = await api.get(`/documents/${id}/report/download?format=${format}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${report.originalFilename}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to download ${format.toUpperCase()} report`);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-4 border-[#5B2BE0] border-t-transparent rounded-full"></div></div>;

  if (error || !report) return (
    <div className="max-w-4xl mx-auto py-12 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <Link to="/reports" className="text-[#5B2BE0] hover:underline">Back to Reports</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/reports" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        <div className="flex gap-2">
          <button onClick={() => handleDownloadFormat('pdf')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm text-gray-700">
            <Download className="w-4 h-4" /> PDF Report
          </button>
          <button onClick={() => handleDownloadFormat('docx')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm text-gray-700">
            <Download className="w-4 h-4" /> DOCX Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#11133A] p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Document Report</h2>
              <p className="text-gray-300 mt-1">{report.originalFilename}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className="font-semibold text-gray-900 capitalize">{report.status.replace(/_/g, ' ')}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total PII Detected</p>
              <p className="font-semibold text-gray-900">{report.totalPII}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Verification</p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                {report.status === 'redaction_verification_failed' ? (
                  <><span className="w-2 h-2 rounded-full bg-red-500"></span> Failed</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-green-500"></span> Passed</>
                )}
              </p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">PII Breakdown</h3>
          {Object.keys(report.piiBreakdown || {}).length === 0 ? (
            <p className="text-gray-500 italic">No PII categories were detected in this document.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(report.piiBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{type.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-[#5B2BE0] bg-purple-50 px-2 py-1 rounded-md">{count as number}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
