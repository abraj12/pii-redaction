import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Lock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';

interface DocStatus {
  status: string;
  statusMessage: string;
  progress: number;
  totalPII: number;
  extractedCharacters: number;
}

export default function Processing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docStatus, setDocStatus] = useState<DocStatus | null>(null);
  const [filename, setFilename] = useState<string>('Document');
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const pollingInterval = useRef<any>(null);

  // We enforce a minimum CSS transition logic by artificially pacing the UI
  // if the backend finishes too quickly.
  const [uiStage, setUiStage] = useState(0);

  const STAGES = [
    { key: 'uploaded', label: 'Uploading document' },
    { key: 'extracting', label: 'Extracting document text' },
    { key: 'ocr_processing', label: 'OCR processing' },
    { key: 'detecting_pii', label: 'Detecting personally identifiable information' },
    { key: 'classifying', label: 'Classifying detected information' },
    { key: 'completed', label: 'Analysis Complete' }
  ];

  const getStageIndex = (status: string) => {
    switch(status) {
      case 'uploaded': return 0;
      case 'validating': return 0;
      case 'extracting': return 1;
      case 'ocr_processing': return 2;
      case 'detecting_pii': return 3;
      case 'classifying': return 4;
      case 'completed': 
      case 'completed_no_pii': return 5;
      default: return 0;
    }
  };

  useEffect(() => {
    const fetchDocInfo = async () => {
      try {
        const res = await api.get(`/documents/${id}`);
        setFilename(res.data.originalFilename);
        setFileInfo({
          size: (res.data.fileSize / (1024 * 1024)).toFixed(2) + ' MB',
          ext: res.data.fileType.replace('.', '').toUpperCase()
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocInfo();
  }, [id]);

  useEffect(() => {
    if (isCancelled) {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      return;
    }

    const pollStatus = async () => {
      try {
        const res = await api.get(`/documents/${id}/status`);
        setDocStatus(res.data);
        
        const backendIndex = getStageIndex(res.data.status);
        setUiStage(backendIndex);
        
        if (['completed', 'completed_no_pii'].includes(res.data.status)) {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
          navigate(`/review/${id}`);
        } else if (['failed', 'extraction_failed', 'cancelled', 'redaction_verification_failed'].includes(res.data.status)) {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
      } catch (err) {
        console.error(err);
        if (pollingInterval.current) clearInterval(pollingInterval.current);
      }
    };

    pollStatus();
    pollingInterval.current = setInterval(pollStatus, 1500);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [id, isCancelled, navigate]);


  const handleCancel = () => {
    setIsCancelled(true);
    navigate('/');
  };

  if (docStatus && ['failed', 'extraction_failed', 'cancelled', 'redaction_verification_failed'].includes(docStatus.status)) {
    return (
      <div className="max-w-[750px] mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-[#11133A] mb-3">
          {docStatus.status === 'redaction_verification_failed' ? 'Redaction verification failed' : 'Something went wrong'}
        </h2>
        <p className="text-gray-500 mb-8">
          {docStatus.status === 'redaction_verification_failed' ? 'The generated document still contains potentially sensitive values.' : 'We couldn\'t analyze this document.'}
        </p>
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 mb-8 inline-block text-left">
          {docStatus.statusMessage || 'An error occurred.'}
        </div>
        <div className="flex justify-center gap-4">
          {docStatus.status === 'redaction_verification_failed' ? (
            <button onClick={() => navigate(`/review/${id}`)} className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Back to Review
            </button>
          ) : (
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Try Again
            </button>
          )}
          <button onClick={() => navigate('/upload')} className="px-6 py-2.5 bg-[#5B2BE0] text-white font-medium rounded-xl hover:bg-[#4f24c7] transition-colors">
            Upload Another Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[750px] mx-auto mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 relative overflow-hidden">
      
      {/* Cancel Confirm Overlay */}
      {showCancelConfirm && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center max-w-sm">
            <h3 className="text-xl font-bold text-[#11133A] mb-2">Cancel processing?</h3>
            <p className="text-gray-500 mb-6">Your document analysis will be aborted.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2.5 bg-[#5B2BE0] text-white font-medium rounded-xl hover:bg-[#4f24c7] transition-colors">
                Continue Processing
              </button>
              <button onClick={handleCancel} className="px-4 py-2.5 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors">
                Cancel Processing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header section with scanner */}
      <div className="text-center mb-10">
        <div className="relative w-24 h-24 mx-auto mb-6 bg-purple-50 rounded-2xl flex items-center justify-center overflow-hidden">
          <FileText className="w-10 h-10 text-[#5B2BE0]" />
          <div className="absolute top-0 left-0 w-full h-1 bg-[#5B2BE0] shadow-[0_0_15px_rgba(91,43,224,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
        </div>
        
        <h2 className="text-2xl font-bold text-[#11133A] mb-2">Analyzing Your Document</h2>
        <p className="text-gray-500 text-sm">
          {docStatus?.statusMessage || "We're scanning your document for personally identifiable information."}
        </p>
      </div>

      {/* File Info */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 mb-10 border border-gray-100">
        <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#11133A]">{filename}</p>
          {fileInfo && (
            <p className="text-xs text-gray-500">{fileInfo.size} • {fileInfo.ext}</p>
          )}
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="space-y-6 mb-12 pl-4">
        {STAGES.map((stage, idx) => {
          const isCompleted = uiStage > idx;
          const isCurrent = uiStage === idx;
          const isPending = uiStage < idx;

          return (
            <div key={stage.key} className="flex gap-4 items-start relative">
              {idx !== STAGES.length - 1 && (
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
              
              <div>
                <p className={`font-medium ${isCurrent || isCompleted ? 'text-[#11133A]' : 'text-gray-400'}`}>
                  {stage.label}
                </p>
                {isCurrent && stage.key === 'detecting_pii' && (
                  <p className="text-sm text-gray-500 mt-1">Scanning document content...</p>
                )}
                {isCompleted && stage.key === 'extracting' && docStatus?.extractedCharacters && (
                  <p className="text-sm text-green-600 mt-1">{docStatus.extractedCharacters.toLocaleString()} characters extracted</p>
                )}
                {isPending && (
                  <p className="text-sm text-gray-400 mt-1">Waiting...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="w-3.5 h-3.5" />
          <span>
            🔒 Your document is processed securely.<br/>
            Documents are processed according to the application's configured retention policy.
          </span>
        </div>
        <button 
          onClick={() => setShowCancelConfirm(true)}
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(96px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
