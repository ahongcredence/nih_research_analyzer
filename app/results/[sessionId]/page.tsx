"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import StatusTracker from "@/app/components/StatusTracker";
import ReportViewer from "@/app/components/ReportViewer";
import { exportReportToPDF, exportHTMLToPDF } from "@/app/lib/pdfExport";
import { ArrowLeft, Download, ExternalLink, FileText, BarChart3 } from "lucide-react";

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

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [finalResults, setFinalResults] = useState<AnalysisStatus | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleAnalysisComplete = (results: AnalysisStatus) => {
    setAnalysisComplete(true);
    setFinalResults(results);
    
    // Set report data if available
    if (results.additionalResults?.finalReport) {
      setReportData(results.additionalResults.finalReport);
    }
  };

  const handleAnalysisError = (error: string) => {
    setAnalysisError(error);
  };

  const handleDownloadReport = () => {
    if (finalResults?.additionalResults?.finalReport) {
      // Create a blob and download the report
      const reportData = JSON.stringify(finalResults.additionalResults.finalReport, null, 2);
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bias-analysis-report-${sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData) return;
    
    setIsExportingPDF(true);
    try {
      // Try the main PDF export first
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
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
                    onClick={handleDownloadReport}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Status Tracker */}
          <div className="mb-8">
            <StatusTracker
              sessionId={sessionId}
              onComplete={handleAnalysisComplete}
              onError={handleAnalysisError}
            />
          </div>

          {/* Analysis Complete - Show Results Summary */}
          {analysisComplete && finalResults && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Documents Processed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">
                      {finalResults.input?.fileCount || 0}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      PDF files analyzed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Studies Classified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">
                      {Array.isArray(finalResults.additionalResults?.classifications) 
                        ? finalResults.additionalResults.classifications.length
                        : 'N/A'
                      }
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Research studies identified
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Analysis Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">
                      {finalResults.startTime && finalResults.endTime 
                        ? Math.round((new Date(finalResults.endTime).getTime() - new Date(finalResults.startTime).getTime()) / 1000 / 60)
                        : 'N/A'
                      }m
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Total processing time
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Report Viewer */}
              {reportData && (
                <div id="report-container">
                  <ReportViewer 
                    reportData={reportData} 
                    onExportPDF={handleExportPDF}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <Button
                  size="lg"
                  onClick={handleDownloadReport}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
                {reportData && (
                  <Button
                    size="lg"
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
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/upload')}
                >
                  Start New Analysis
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {analysisError && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Analysis Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 mb-4">{analysisError}</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/upload')}
                  >
                    Start New Analysis
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
