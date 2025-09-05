"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { FileUpload } from "@/app/components";
import { FileText, Upload, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface UploadResponse {
  success: boolean;
  sessionId: string;
  executionArn: string;
  files: Array<{
    name: string;
    size: number;
    type: string;
  }>;
  message: string;
  s3Location: string;
}

interface UploadError {
  error: string;
  details?: string;
  sessionId?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);

  const validateFiles = (files: File[]): string | null => {
    const maxFiles = parseInt(process.env.NEXT_PUBLIC_MAX_FILES || '5');
    const maxFileSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'); // 10MB
    
    if (files.length === 0) {
      return "Please select at least one file";
    }
    
    if (files.length > maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }
    
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return `File "${file.name}" is not a PDF`;
      }
      
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        return `File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB`;
      }
    }
    
    return null;
  };

  const uploadFiles = async (files: File[]): Promise<UploadResponse> => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  };

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setError("");
    setSessionId("");
    setUploadResponse(null);
  };

  const handleStartAnalysis = async () => {
    if (uploadedFiles.length === 0) return;
    
    // Validate files before upload
    const validationError = validateFiles(uploadedFiles);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsAnalyzing(true);
    setError("");
    
    try {
      const response = await uploadFiles(uploadedFiles);
      setSessionId(response.sessionId);
      setUploadResponse(response);
      console.log("Upload successful:", response);
      
      // Navigate to results page to show progress
      router.push(`/results/${response.sessionId}`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-70">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Upload Research Documents
            </h1>
            <p className="text-lg text-slate-600">
              Upload multiple research papers for AI agent analysis against our comprehensive rubric.
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-8 bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Document Upload</CardTitle>
              <CardDescription className="text-slate-600">
                Supported format: PDF only. Maximum {process.env.NEXT_PUBLIC_MAX_FILES || '5'} files, {Math.round(parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760') / (1024 * 1024))}MB per file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            </CardContent>
          </Card>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <Card className="mb-8 bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900 flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Uploaded Documents ({uploadedFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-slate-900">{file.name}</p>
                          <p className="text-sm text-slate-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="mb-8 bg-red-50 border-red-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                  <p className="text-red-600">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {uploadResponse && (
            <Card className="mb-8 bg-green-50 border-green-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-green-600 font-medium">{uploadResponse.message}</p>
                      <p className="text-green-600 text-sm">Session ID: {uploadResponse.sessionId}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <h4 className="font-medium text-slate-900 mb-2">Processing Details:</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>• Files processed: {uploadResponse.files.length}</p>
                      <p>• Step Functions execution started</p>
                      <p>• Results will be stored at: <code className="text-xs bg-slate-100 px-1 rounded">{uploadResponse.s3Location}</code></p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-green-600">
                      Redirecting to analysis progress page...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Button */}
          {uploadedFiles.length > 0 && !uploadResponse && (
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="px-8"
              >
                {isAnalyzing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Start New Analysis Button */}
          {uploadResponse && (
            <div className="text-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setUploadedFiles([]);
                  setUploadResponse(null);
                  setSessionId("");
                  setError("");
                }}
                className="px-8"
              >
                Start New Analysis
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}