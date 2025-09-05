"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  FileText, 
  Brain, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Download,
  ExternalLink
} from "lucide-react";

interface AnalysisStatus {
  sessionId: string;
  executionArn: string;
  status: string;
  currentPhase: string;
  phaseProgress: number;
  phaseDescription: string;
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string;
  startTime?: string;
  endTime?: string;
  input?: {
    fileCount: number;
    files: Array<{
      name: string;
      size: number;
      s3Key: string;
      index: number;
    }>;
  };
  output?: any;
  additionalResults?: {
    finalReport?: any;
    reportLocation?: string;
    classifications?: any;
    classificationLocation?: string;
  };
  lastUpdated: string;
}

interface StatusTrackerProps {
  sessionId: string;
  executionArn?: string;
  onComplete?: (results: AnalysisStatus) => void;
  onError?: (error: string) => void;
}

const phaseConfig = {
  pdf_processing: {
    title: "PDF Processing",
    description: "Extracting text from uploaded documents",
    icon: FileText,
    color: "blue",
    estimatedTime: "2-3 minutes"
  },
  study_classification: {
    title: "Study Classification", 
    description: "AI agents analyzing study types and methodologies",
    icon: Brain,
    color: "purple",
    estimatedTime: "3-5 minutes"
  },
  bias_analysis: {
    title: "Bias Analysis",
    description: "Applying JBI criteria for systematic bias assessment",
    icon: Shield,
    color: "green",
    estimatedTime: "5-10 minutes"
  },
  completed: {
    title: "Analysis Complete",
    description: "All processing steps finished successfully",
    icon: CheckCircle,
    color: "green",
    estimatedTime: "Complete"
  },
  failed: {
    title: "Analysis Failed",
    description: "An error occurred during processing",
    icon: AlertCircle,
    color: "red",
    estimatedTime: "Failed"
  },
  error: {
    title: "Error",
    description: "Unable to check analysis status",
    icon: AlertCircle,
    color: "red",
    estimatedTime: "Error"
  }
};

export default function StatusTracker({ 
  sessionId, 
  executionArn, 
  onComplete, 
  onError 
}: StatusTrackerProps) {
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(2000); // Start with 2 seconds for faster initial response
  const [maxPollingInterval] = useState(15000); // Max 15 seconds (reduced from 30)
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [maxPollingAttempts] = useState(180); // Max 3 minutes of polling (increased attempts but shorter intervals)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [maxConsecutiveErrors] = useState(3); // Stop after 3 consecutive errors

  const fetchStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sessionId });
      if (executionArn) {
        params.append('executionArn', executionArn);
      }

      const response = await fetch(`/api/status?${params}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setStatus(data);
      setPollingAttempts(prev => prev + 1);
      setConsecutiveErrors(0); // Reset error count on successful fetch

      // Handle completion
      if (data.isComplete) {
        setIsPolling(false);
        onComplete?.(data);
        return;
      }

      // Handle errors
      if (data.hasError) {
        setIsPolling(false);
        onError?.(data.errorMessage || 'Analysis failed');
        return;
      }

      // Stop polling after max attempts
      if (pollingAttempts >= maxPollingAttempts) {
        setIsPolling(false);
        onError?.('Analysis is taking longer than expected. Please check back later.');
        return;
      }

      // Adaptive polling based on phase progress
      if (data.phaseProgress < 30) {
        // Early phases: poll more frequently
        setPollingInterval(2000);
      } else if (data.phaseProgress < 70) {
        // Middle phases: moderate polling
        setPollingInterval(4000);
      } else {
        // Late phases: less frequent polling
        setPollingInterval(Math.min(pollingInterval * 1.1, maxPollingInterval));
      }

    } catch (error: any) {
      console.error('Status fetch error:', error);
      setPollingAttempts(prev => prev + 1);
      setConsecutiveErrors(prev => prev + 1);
      
      // Stop polling after consecutive errors
      if (consecutiveErrors >= maxConsecutiveErrors) {
        setIsPolling(false);
        onError?.('Unable to check analysis status. Please refresh the page.');
        return;
      }
      
      if (pollingAttempts >= maxPollingAttempts) {
        setIsPolling(false);
        onError?.(error.message || 'Failed to check analysis status');
      }
    }
  }, [sessionId, executionArn, pollingInterval, pollingAttempts, maxPollingAttempts, consecutiveErrors, maxConsecutiveErrors, onComplete, onError]);

  // Start polling on mount
  useEffect(() => {
    if (isPolling) {
      const interval = setInterval(fetchStatus, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [isPolling, pollingInterval, fetchStatus]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = () => {
    setPollingAttempts(0);
    setConsecutiveErrors(0);
    setPollingInterval(2000);
    setIsPolling(true);
    fetchStatus();
  };

  const getPhaseConfig = (phase: string) => {
    return phaseConfig[phase as keyof typeof phaseConfig] || phaseConfig.error;
  };

  const getProgressColor = (phase: string, progress: number) => {
    if (phase === 'failed' || phase === 'error') return 'bg-red-500';
    if (phase === 'completed') return 'bg-green-500';
    if (progress < 30) return 'bg-blue-500';
    if (progress < 70) return 'bg-purple-500';
    return 'bg-green-500';
  };

  if (!status) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading analysis status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPhaseConfig = getPhaseConfig(status.currentPhase);
  const PhaseIcon = currentPhaseConfig.icon;

  // Show compact version when analysis is complete
  if (status.isComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Analysis Complete</h3>
                <p className="text-sm text-green-700">
                  Completed in {status.startTime && status.endTime 
                    ? Math.round((new Date(status.endTime).getTime() - new Date(status.startTime).getTime()) / 1000 / 60)
                    : 'N/A'}m • {status.input?.fileCount || 0} files processed
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isPolling}
            >
              <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                status.hasError ? 'bg-red-100' : 
                status.isComplete ? 'bg-green-100' : 
                'bg-blue-100'
              }`}>
                <PhaseIcon className={`h-5 w-5 ${
                  status.hasError ? 'text-red-600' : 
                  status.isComplete ? 'text-green-600' : 
                  'text-blue-600'
                }`} />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {currentPhaseConfig.title}
                </CardTitle>
                <CardDescription>
                  {status.phaseDescription}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">
                {status.isComplete ? 'Completed' : 
                 status.hasError ? 'Failed' : 
                 'In Progress'}
              </div>
              <div className="text-xs text-slate-500">
                {currentPhaseConfig.estimatedTime}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium">{status.phaseProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(status.currentPhase, status.phaseProgress)}`}
                style={{ width: `${status.phaseProgress}%` }}
              />
            </div>
          </div>

          {/* Status Details */}
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Session ID:</span>
              <span className="font-mono text-xs">{status.sessionId}</span>
            </div>
            {status.startTime && (
              <div className="flex justify-between">
                <span>Started:</span>
                <span>{new Date(status.startTime).toLocaleString()}</span>
              </div>
            )}
            {status.endTime && (
              <div className="flex justify-between">
                <span>Completed:</span>
                <span>{new Date(status.endTime).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span>{new Date(status.lastUpdated).toLocaleString()}</span>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isPolling}
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${isPolling ? 'animate-spin' : ''}`} />
              {isPolling ? 'Polling...' : 'Refresh'}
            </Button>
            
            {status.isComplete && status.additionalResults?.finalReport && (
              <Button
                size="sm"
                onClick={() => {
                  // TODO: Implement download functionality
                  console.log('Download report');
                }}
              >
                <Download className="mr-1 h-3 w-3" />
                Download Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Information */}
      {status.input && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Processing Files ({status.input.fileCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.input.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {status.hasError && status.errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Analysis Error</p>
                <p className="text-red-600 text-sm">{status.errorMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Preview */}
      {status.isComplete && status.additionalResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-green-800">
              <CheckCircle className="mr-2 h-5 w-5" />
              Analysis Results Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.additionalResults.finalReport && (
                <div className="p-3 bg-white rounded border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Final Report</h4>
                  <p className="text-sm text-green-700 mb-2">
                    Comprehensive JBI bias analysis report generated
                  </p>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View Report
                  </Button>
                </div>
              )}
              
              {status.additionalResults.classifications && (
                <div className="p-3 bg-white rounded border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Study Classifications</h4>
                  <p className="text-sm text-green-700">
                    {Array.isArray(status.additionalResults.classifications) 
                      ? `${status.additionalResults.classifications.length} studies classified`
                      : 'Study classifications available'
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
