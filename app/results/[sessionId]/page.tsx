"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import StatusTracker from "@/app/components/StatusTracker";
import ReportViewer from "@/app/components/ReportViewer";
import { exportReportToPDF } from "@/app/lib/pdfExport";
import { ArrowLeft, Download } from "lucide-react";

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
  output?: Record<string, unknown>;
  additionalResults?: {
    finalReport?: Record<string, unknown>;
    reportLocation?: string;
    classifications?: Record<string, unknown>;
    classificationLocation?: string;
  };
  lastUpdated: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [finalResults, setFinalResults] = useState<AnalysisStatus | null>(null);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleAnalysisComplete = (results: AnalysisStatus) => {
    setAnalysisComplete(true);
    setFinalResults(results);
    
    // Set report data if available
    if (results.additionalResults?.finalReport) {
      setReportData(results.additionalResults.finalReport);
    }
  };



  const handleExportPDF = async () => {
    if (!reportData) return;
    
    setIsExportingPDF(true);
    try {
      // Try the main PDF export first - pass data directly
      await exportReportToPDF(reportData);
    } catch (error) {
      console.error('Main PDF export failed:', error);
      
      // Fallback to HTML-to-PDF conversion
      try {
        console.log('Attempting HTML-to-PDF fallback...');
        const { exportHTMLToPDF } = await import('@/app/lib/pdfExport');
        await exportHTMLToPDF('report-container', `jbi-bias-assessment-${sessionId}.pdf`);
      } catch (fallbackError) {
        console.error('HTML-to-PDF fallback also failed:', fallbackError);
        alert(`Failed to export PDF. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsExportingPDF(false);
    }
  };


  return (
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/upload')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Upload
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Analysis Results
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Session ID: <span className="font-mono text-sm">{sessionId}</span>
                  </p>
                </div>
              </div>
              
              {analysisComplete && finalResults && (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                  >
                    {isExportingPDF ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Exporting PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Status Tracker */}
          <div className="mb-6">
            <StatusTracker
              sessionId={sessionId}
              onComplete={handleAnalysisComplete}
            />
          </div>

          {/* Analysis Complete - Show Results Summary */}
          {analysisComplete && finalResults && (
            <div className="space-y-6">

              {/* Report Viewer */}
              {reportData && (
                <div id="report-container">
                  <ReportViewer 
                    reportData={reportData} 
                    sessionId={sessionId}
                  />
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
