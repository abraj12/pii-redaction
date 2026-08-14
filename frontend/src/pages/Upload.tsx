import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import UploadDocumentCard from '../components/UploadDocumentCard';
import HowItWorks from '../components/HowItWorks';

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    validateAndUploadFile(selectedFile);
  };

  const validateAndUploadFile = async (selectedFile: File) => {
    setError('');
    const validTypes = ['.pdf', '.docx', '.txt'];
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(extension)) {
      setError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50MB.');
      return;
    }
    
    setUploading(false);
    setProcessing(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    await processUpload(selectedFile, abortControllerRef.current);
  };

  const processUpload = async (fileToUpload: File, controller: AbortController) => {
    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', fileToUpload);
      
      const uploadRes = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal
      });
      
      const docId = uploadRes.data._id;
      
      if (controller.signal.aborted) return;
      
      setUploading(false);
      setProcessing(true);
      
      try {
        await api.post(`/documents/${docId}/process`, {}, {
          signal: controller.signal
        });
      } catch (e) {
        console.error("Failed to start processing", e);
      }
      
      if (controller.signal.aborted) return;
      
      navigate(`/processing/${docId}`);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        console.log("Upload aborted");
        return;
      }
      setError(err.response?.data?.error || 'An error occurred during processing.');
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col min-h-full py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#11133A]">Upload Document</h1>
        <p className="text-gray-500 text-sm mt-1">Upload a document to detect and redact sensitive information.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-7">
          <UploadDocumentCard 
            onFileSelect={handleFileSelect}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            error={error}
            uploading={uploading}
            processing={processing}
          />
        </div>
        <div className="lg:col-span-3">
          <HowItWorks />
        </div>
      </div>
    </div>
  );
}
