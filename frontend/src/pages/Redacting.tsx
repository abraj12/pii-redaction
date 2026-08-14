import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Download, XCircle } from 'lucide-react';
import api from '../services/api';

export default function Redacting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docStatus, setDocStatus] = useState<any>(null);
  const pollingInterval = useRef<any>(null);
  
  // Artificial UI pacing
  const [uiStage, setUiStage] = useState(0);

  const STAGES = [
    { key: 'completed', label: 'PII detected' },
    { key: 'redacting', label: 'Replacing sensitive information' },
    { key: 'verifying', label: 'Verifying protected document' },
    { key: 'redacted', label: 'Document Successfully Redacted' }
  ];

  const getStageIndex = (status: string) => {
    switch(status) {
      case 'completed':
      case 'completed_no_pii': return 0;
      case 'redacting': return 1;
      case 'verifying': return 2;
      case 'redacted': return 3;
      default: return 0;
    }
  };

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await api.get(`/documents/${id}/status`);
        setDocStatus(res.data);
        
        const backendIndex = getStageIndex(res.data.status);
        setUiStage(backendIndex);
        
        if (res.data.status === 'redacted') {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
        } else if (['failed', 'redaction_verification_failed'].includes(res.data.status)) {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
      } catch (err) {
        console.error(err);
      }
    };

    pollStatus();
    pollingInterval.current = setInterval(pollStatus, 1500);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [id, navigate]);

  const handleDownload = async () => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Get filename from content-disposition if possible, or fallback
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'redacted_document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const isDone = uiStage >= STAGES.length - 1 && docStatus?.status === 'redacted';

  if (docStatus && ['failed', 'redaction_verification_failed'].includes(docStatus.status)) {
    return (
      <div className="max-w-[750px] mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-[#11133A] mb-3">
          {docStatus.status === 'redaction_verification_failed' ? 'Redaction verification failed' : 'Redaction failed'}
        </h2>
        <p className="text-gray-500 mb-8">
          {docStatus.statusMessage || 'An error occurred during redaction.'}
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate(`/review/${id}`)} className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Back to Review
          </button>
          <button onClick={() => navigate('/upload')} className="px-6 py-2.5 bg-[#5B2BE0] text-white font-medium rounded-xl hover:bg-[#4f24c7] transition-colors">
            Upload Another Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[750px] mx-auto mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
      
      {!isDone ? (
        <>
          <div className="text-center mb-10">
            <div className="relative w-24 h-24 mx-auto mb-6 bg-purple-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-[#5B2BE0]" />
              <div className="absolute inset-0 border-4 border-[#5B2BE0] border-t-transparent rounded-2xl animate-spin opacity-20" />
            </div>
            
            <h2 className="text-2xl font-bold text-[#11133A] mb-2">Protecting Your Document</h2>
            <p className="text-gray-500 text-sm">
              {docStatus?.statusMessage || "Preparing secure redacted copy..."}
            </p>
          </div>

          <div className="space-y-6 pl-4 max-w-sm mx-auto">
            {STAGES.slice(0, STAGES.length - 1).map((stage, idx) => {
              const isCompleted = uiStage > idx;
              const isCurrent = uiStage === idx;

              return (
                <div key={stage.key} className="flex gap-4 items-start relative">
                  {idx !== STAGES.length - 2 && (
                    <div className={`absolute left-3 top-8 bottom-[-24px] w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`} />
                  )}
                  
                  <div className="relative z-10 bg-white mt-0.5">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full border-2 border-[#5B2BE0] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#5B2BE0] animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                  
                  <p className={`font-medium mt-0.5 ${isCurrent || isCompleted ? 'text-[#11133A]' : 'text-gray-400'}`}>
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          
          <h2 className="text-3xl font-bold text-[#11133A] mb-2">Document Successfully Redacted</h2>
          <p className="text-gray-500 mb-10">Your protected document is ready.</p>
          
          <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-around mb-10 border border-gray-100 max-w-lg mx-auto">
             <div className="text-center">
               <div className="flex items-center justify-center text-gray-400 mb-2">
                 <ShieldCheck className="w-5 h-5 mr-1.5" />
                 <span className="text-xs font-bold uppercase tracking-wider">PII Detected</span>
               </div>
               <p className="text-2xl font-bold text-[#11133A]">{docStatus?.totalPII || 0}</p>
             </div>
             <div className="w-px h-12 bg-gray-200" />
             <div className="text-center">
               <div className="flex items-center justify-center text-green-500 mb-2">
                 <CheckCircle2 className="w-5 h-5 mr-1.5" />
                 <span className="text-xs font-bold uppercase tracking-wider text-green-600">Redacted</span>
               </div>
               <p className="text-2xl font-bold text-[#11133A]">Yes</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={handleDownload}
              className="px-8 py-3.5 bg-gradient-to-r from-[#5B2BE0] to-[#7B46F6] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Redacted Document
            </button>
            <button 
              onClick={() => navigate('/upload')}
              className="px-8 py-3.5 border-2 border-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Process Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
