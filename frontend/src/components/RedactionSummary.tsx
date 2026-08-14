import { Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RedactionSummaryProps {
  documents?: any[];
}

export default function RedactionSummary({ documents = [] }: RedactionSummaryProps) {
  const aggregatedStats: Record<string, number> = {
    'PERSON': 0,
    'EMAIL_ADDRESS': 0,
    'PHONE_NUMBER': 0,
    'OTHER': 0
  };

  let totalPII = 0;

  documents.forEach(doc => {
    totalPII += (doc.totalPII || 0);
    if (doc.piiBreakdown) {
      Object.keys(doc.piiBreakdown).forEach(key => {
        if (key === 'PERSON' || key === 'EMAIL_ADDRESS' || key === 'PHONE_NUMBER') {
          aggregatedStats[key] += doc.piiBreakdown[key];
        } else {
          aggregatedStats['OTHER'] += doc.piiBreakdown[key];
        }
      });
    }
  });

  const chartData = [
    { name: 'Names', value: aggregatedStats['PERSON'], color: '#5B2BE0' },
    { name: 'Emails', value: aggregatedStats['EMAIL_ADDRESS'], color: '#F59E0B' },
    { name: 'Phones', value: aggregatedStats['PHONE_NUMBER'], color: '#10B981' },
    { name: 'Other', value: aggregatedStats['OTHER'], color: '#6B7280' }
  ].filter(item => item.value > 0);

  const downloadLatest = async () => {
    if (documents.length === 0) return;
    const latest = documents.reduce((prev, current) => (prev.createdAt > current.createdAt) ? prev : current);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/documents/${latest._id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'latest_redacted_document.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 flex flex-col h-full min-h-[450px]">
      <h3 className="text-lg font-bold text-[#11133A] mb-6 shrink-0">Redaction Summary</h3>
      
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <div className="relative h-[220px] w-full mb-6 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.length > 0 ? chartData : [{ name: 'None', value: 1, color: '#e5e7eb' }]}
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {(chartData.length > 0 ? chartData : [{ name: 'None', value: 1, color: '#e5e7eb' }]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {chartData.length > 0 && (
                <Tooltip 
                  formatter={(value: any, name: any) => [`${value} items`, name]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-[#11133A] leading-none">{totalPII}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1 text-center w-20 leading-tight">Total PII Found</span>
          </div>
        </div>

        <div className="space-y-3 mb-8 shrink-0">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="font-medium text-gray-600">{item.name}</span>
              </div>
              <span className="font-semibold text-[#11133A]">
                {item.value} <span className="text-gray-400 font-medium ml-1">({Math.round((item.value / totalPII) * 100)}%)</span>
              </span>
            </div>
          ))}
          {chartData.length === 0 && (
            <p className="text-center text-sm text-gray-400">No data available to summarize.</p>
          )}
        </div>
      </div>
      
      <button 
        onClick={downloadLatest}
        disabled={documents.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#5B2BE0] text-white rounded-xl font-bold hover:bg-[#4f24c7] transition-all shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-5 h-5" />
        Download Latest Redacted
      </button>
    </div>
  );
}
