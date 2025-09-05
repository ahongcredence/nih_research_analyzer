"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/app/lib/utils";

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = [".pdf"]
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxSize}MB.`;
    }

    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File "${file.name}" is not supported. Accepted types: ${acceptedTypes.join(", ")}`;
    }

    return null;
  }, [maxSize, acceptedTypes]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    setError("");
    const fileArray = Array.from(newFiles);
    
    // Check if adding these files would exceed maxFiles
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(" "));
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesUploaded(updatedFiles);
    }
  }, [files, maxFiles, onFilesUploaded, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  }, [files, onFilesUploaded]);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors relative",
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 hover:border-slate-400",
          error && "border-red-300 bg-red-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-slate-900">
            {isDragOver ? "Drop files here" : "Drag and drop files here"}
          </p>
          <p className="text-sm text-slate-600">
            or click to browse files
          </p>
          <p className="text-xs text-slate-500">
            Supported: {acceptedTypes.join(", ")} • Max {maxSize}MB per file
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900">Selected Files:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                <div className="flex items-center flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-slate-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-slate-900 truncate">{file.name}</span>
                  <span className="text-xs text-slate-500 ml-2">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0 text-slate-500 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Browse Button */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          <Upload className="mr-2 h-4 w-4" />
          Browse Files
        </Button>
      </div>
    </div>
  );
}
