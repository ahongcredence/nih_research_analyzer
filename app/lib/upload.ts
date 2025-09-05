export interface UploadResponse {
  success: boolean;
  sessionId: string;
  executionArn: string;
  files: Array<{
    name: string;
    key: string;
    size: number;
  }>;
  message: string;
}

export interface UploadError {
  error: string;
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: UploadError = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateFiles(files: File[]): string | null {
  if (files.length === 0) {
    return 'No files selected';
  }

  if (files.length > 5) {
    return 'Maximum 5 files allowed';
  }

  for (const file of files) {
    if (file.type !== 'application/pdf') {
      return `File ${file.name} is not a PDF`;
    }

    if (file.size > 10 * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is 10MB`;
    }
  }

  return null;
}

