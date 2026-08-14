import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, XCircle, ShieldAlert, Activity } from 'lucide-react';
import api from '../services/api';

export default function Admin() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch admin stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-4 border-[#5B2BE0] border-t-transparent rounded-full"></div></div>;

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System-wide analytics and performance metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.totalDocuments || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Successful Redactions</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.redactedDocuments || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg"><XCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Failed Jobs</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.failedDocuments || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gray-400" /> System PII Totals
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-600 font-medium">Total PII Detected (All Time)</span>
              <span className="text-2xl font-bold text-[#11133A]">{stats?.totalPIIDetected || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-600 font-medium">Anonymous Jobs</span>
              <span className="text-2xl font-bold text-green-600">{stats?.totalAnonymousJobs || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Avg PII per Document</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats?.totalDocuments ? Math.round(stats.totalPIIDetected / stats.totalDocuments) : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" /> Recent Activity
          </h3>
          {stats?.recentUploads?.length === 0 ? (
            <p className="text-gray-500">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {stats?.recentUploads?.map((doc: any) => (
                <div key={doc._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{doc.originalFilename}</p>
                    <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${doc.status === 'completed' || doc.status === 'redacted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
