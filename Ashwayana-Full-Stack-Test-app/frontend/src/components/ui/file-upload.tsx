'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  value?: string;
  onUpload: (url: string) => void;
  accept?: string;
}

export function FileUpload({
  value,
  onUpload,
  accept = 'image/*',
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Selected file must be an image.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      setShowSuccess(false);

      // Create a local FileReader preview immediately for feedback
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Perform upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.data;
      onUpload(imageUrl);
      setPreview(imageUrl);
      setShowSuccess(true);
      
      // Clear success badge after 2.5 seconds
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (err) {
      console.error('File upload failure:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setErrorMsg(axiosError.response?.data?.message || 'File upload failed. Please try again.');
      setPreview(value || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative h-56 rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-300
          ${isDragOver 
            ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 scale-[0.99]' 
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080d1a]/40 hover:border-slate-300 dark:hover:border-slate-700'
          }
        `}
      >
        {/* Render Preview overlay */}
        {preview ? (
          <div className="relative h-full w-full group">
            <img
              src={preview}
              alt="Uploaded file preview"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-101"
            />
            
            {/* Dark tint overlay while uploading */}
            {isUploading && (
              <div className="absolute inset-0 bg-slate-950/50 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <span className="text-xs text-white font-bold tracking-wider uppercase">Syncing...</span>
              </div>
            )}

            {/* Success notification overlay */}
            {showSuccess && (
              <div className="absolute inset-0 bg-emerald-950/65 flex flex-col items-center justify-center gap-1.5 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                <span className="text-xs text-emerald-250 font-bold uppercase tracking-wider">Upload Successful</span>
              </div>
            )}

            {/* Remove button */}
            {!isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-900/80 hover:bg-rose-600 border-none transition-colors shadow-lg shadow-black/20"
                onClick={() => {
                  setPreview(null);
                  onUpload('');
                  setErrorMsg(null);
                  setShowSuccess(false);
                }}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            )}
          </div>
        ) : (
          /* Empty/Upload trigger area */
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-center p-4">
            {isUploading ? (
              <div className="space-y-2 animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500 mx-auto" />
                <p className="text-slate-800 dark:text-white text-sm font-bold">Uploading Assets...</p>
                <p className="text-[10px] text-slate-400">Verifying payload with cloud server</p>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="h-10 w-10 text-amber-500 dark:text-amber-400 mx-auto transition-transform group-hover:-translate-y-0.5" />
                <h4 className="text-slate-900 dark:text-white text-sm font-bold">Select File or Drop Here</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">Supports PNG, JPG, JPEG (Max size: 5MB)</p>
              </div>
            )}

            <input
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {/* Error notification display block */}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-455 p-2.5 rounded-xl animate-in slide-in-from-top-1 duration-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto hover:opacity-80"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}