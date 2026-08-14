import { useRef } from 'react';
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

interface UploadDocumentCardProps {
  onFileSelect: (file: File) => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  error?: string;
  uploading: boolean;
  processing: boolean;
}

export default function UploadDocumentCard({
  onFileSelect,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  error,
  uploading,
  processing
}: UploadDocumentCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
    // Reset the input value so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-8 h-full flex flex-col">
      <div 
        className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all p-12 ${
          isDragging 
            ? 'border-[#5B2BE0] bg-[#5B2BE0]/5' 
            : 'border-purple-200/60 bg-[#fafafa]'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="w-16 h-16 bg-[#5B2BE0]/10 rounded-full flex items-center justify-center mb-6">
          <UploadCloud className="w-8 h-8 text-[#5B2BE0]" />
        </div>
        
        <h3 className="text-xl font-bold text-[#11133A] mb-2">Upload Document</h3>
        <p className="text-gray-500 mb-8 text-sm">Drag & drop your file here or click to browse</p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={uploading || processing}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || processing}
          className="px-8 py-3 bg-[#5B2BE0] text-white rounded-lg text-sm font-semibold hover:bg-[#4f24c7] transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
        >
          {(uploading || processing) && <Loader2 className="w-4 h-4 animate-spin" />}
          Choose File
        </button>
        
        <div className="mt-8 text-xs font-medium text-gray-400">
          Supported formats: PDF, DOCX, TXT (Max 50MB)
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
