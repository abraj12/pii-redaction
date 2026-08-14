import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

interface Entity {
  type: string;
  text: string;
  fakeValue: string;
  score: number;
  redact: boolean;
}

export default function Review() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docInfo, setDocInfo] = useState<any>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchDocInfo = async () => {
      try {
        const res = await api.get(`/documents/${id}`);
        setDocInfo(res.data);
        if (res.data.detectedEntities) {
          setEntities(res.data.detectedEntities.map((e: any) => ({...e, redact: true})));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocInfo();
  }, [id]);

  const toggleReveal = (index: number) => {
    setRevealed(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleRedact = (index: number) => {
    setEntities(prev => {
      const copy = [...prev];
      copy[index].redact = !copy[index].redact;
      return copy;
    });
  };

  const handleRedact = async () => {
    try {
      // For large documents, only send the indices of entities the user chose NOT to redact
      const rejectedIndices = entities
        .map((e, index) => (e.redact === false ? index : -1))
        .filter(index => index !== -1);

      await api.post(`/documents/${id}/redact`, { rejectedIndices });
      navigate(`/redacting/${id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to start redaction.");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setEntities(prev => prev.map(entity => ({ ...entity, redact: isChecked })));
  };

  const isAllSelected = entities.length > 0 && entities.every(e => e.redact);
  const isIndeterminate = entities.some(e => e.redact) && !isAllSelected;

  if (!docInfo) return <div className="p-8 text-center text-gray-500">Loading review...</div>;

  const totalSelected = entities.filter(e => e.redact).length;

  const getMaskedText = (text: string, isEmail: boolean) => {
    if (text.length <= 4) return '••••';
    if (isEmail) {
      const [name, domain] = text.split('@');
      if (!domain) return text.substring(0, 3) + '••••';
      return name.substring(0, 3) + '••••@' + domain;
    }
    // Mask middle
    return text.substring(0, 3) + '••••' + text.substring(text.length - 3);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#11133A] mb-2">PII Detection Results</h1>
          <p className="text-gray-500">Review the information found in {docInfo.originalFilename}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/upload')}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Upload Another
          </button>
          <button 
            onClick={handleRedact}
            disabled={totalSelected === 0}
            className="px-6 py-2.5 bg-[#5B2BE0] text-white font-bold rounded-xl hover:bg-[#4f24c7] transition-all shadow-sm disabled:opacity-50"
          >
            Redact Selected PII
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-[14px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Found</p>
            <p className="text-3xl font-bold text-[#11133A]">{entities.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#5B2BE0]" />
          </div>
        </div>
        
        {Object.entries(docInfo.piiBreakdown || {}).slice(0,3).map(([key, count]: any) => (
          <div key={key} className="bg-white rounded-[14px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{key.replace('_', ' ')}</p>
              <p className="text-3xl font-bold text-[#11133A]">{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Entity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-[#11133A]">Detected Entities ({totalSelected} selected)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-[#5B2BE0] rounded border-gray-300 focus:ring-[#5B2BE0]"
                    />
                    <span>Redact</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Detected Information</th>
                <th className="px-6 py-4 text-left">Confidence</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entities.map((entity, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={entity.redact} 
                      onChange={() => toggleRedact(idx)}
                      className="w-4 h-4 text-[#5B2BE0] rounded border-gray-300 focus:ring-[#5B2BE0]"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-purple-50 text-[#5B2BE0] text-xs font-bold rounded-md">
                      {entity.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-700">
                    {revealed[idx] ? entity.text : getMaskedText(entity.text, entity.type === 'EMAIL_ADDRESS')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">
                    {Math.round(entity.score * 100)}%
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleReveal(idx)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#5B2BE0] transition-colors"
                    >
                      {revealed[idx] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      {revealed[idx] ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
              {entities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No PII entities detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
