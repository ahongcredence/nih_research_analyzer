"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import StatusTracker from "@/app/components/StatusTracker";
import ReportViewer from "@/app/components/ReportViewer";
import { exportReportToPDF } from "@/app/lib/pdfExport";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { AnalysisStatus, ReportData, safeExtractReportData } from "@/app/lib/types";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [finalResults, setFinalResults] = useState<AnalysisStatus | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleAnalysisComplete = async (results: AnalysisStatus) => {
    setAnalysisComplete(true);
    setFinalResults(results);
    
    // Set report data if available
    if (results.additionalResults?.finalReport) {
      const extraction = safeExtractReportData(results.additionalResults.finalReport);
      if (extraction.success && extraction.data) {
        setReportData(extraction.data);
      } else {
        console.error('Failed to validate report data:', extraction.error);
        setReportError(`Invalid report data: ${extraction.error}`);
      }
    } else if (results.additionalResults?.reportLocation) {
      // Try to fetch the report if it's not in additionalResults
      try {
        const response = await fetch(`/api/report?sessionId=${sessionId}`);
        if (response.ok) {
          const reportResponse = await response.json();
          if (reportResponse.success && reportResponse.report) {
            const extraction = safeExtractReportData(reportResponse.report);
            if (extraction.success && extraction.data) {
              setReportData(extraction.data);
            } else {
              console.error('Failed to validate fetched report data:', extraction.error);
              setReportError(`Invalid fetched report data: ${extraction.error}`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch report:', error);
        setReportError(`Failed to fetch report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };



  const handleFetchReport = async () => {
    if (!sessionId) return;
    
    setIsLoadingReport(true);
    setReportError(null);
    try {
      const response = await fetch(`/api/report?sessionId=${sessionId}`);
      if (response.ok) {
        const reportResponse = await response.json();
        if (reportResponse.success && reportResponse.report) {
          const extraction = safeExtractReportData(reportResponse.report);
          if (extraction.success && extraction.data) {
            setReportData(extraction.data);
            setReportError(null);
          } else {
            console.error('Failed to validate fetched report data:', extraction.error);
            setReportError(`Invalid report data: ${extraction.error}`);
          }
        } else {
          setReportError('Report not found or not ready yet');
        }
      } else {
        const errorData = await response.json();
        setReportError(`Failed to fetch report: ${errorData.error || 'Unknown error'}`);
        if (errorData.details) {
          setReportError(prev => `${prev}\nDetails: ${errorData.details}`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setReportError(`Failed to fetch report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData) {
      console.error('No report data available for PDF export');
      setReportError('No report data available for export');
      return;
    }
    
    setIsExportingPDF(true);
    setReportError(null);
    
    try {
      // Try the main PDF export first - pass data directly
      await exportReportToPDF(reportData);
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('Main PDF export failed:', error);
      
      // Fallback to HTML-to-PDF conversion
      try {
        console.log('Attempting HTML-to-PDF fallback...');
        const { exportHTMLToPDF } = await import('@/app/lib/pdfExport');
        await exportHTMLToPDF('report-container', `jbi-bias-assessment-${sessionId}.pdf`);
        console.log('HTML-to-PDF fallback completed successfully');
      } catch (fallbackError) {
        console.error('HTML-to-PDF fallback also failed:', fallbackError);
        const errorMessage = `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`;
        setReportError(errorMessage);
        alert(errorMessage);
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
                  {!reportData && (
                    <Button
                      onClick={handleFetchReport}
                      disabled={isLoadingReport}
                      variant="outline"
                    >
                      {isLoadingReport ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                          Loading Report...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Load Report
                        </>
                      )}
                    </Button>
                  )}
                  {reportData && (
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
                  )}
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
              {/* Error Display */}
              {reportError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-red-600">⚠️</div>
                    <h3 className="text-red-800 font-medium">Report Loading Error</h3>
                  </div>
                  <p className="text-red-700 text-sm whitespace-pre-line">{reportError}</p>
                  <div className="mt-3">
                    <Button
                      onClick={handleFetchReport}
                      disabled={isLoadingReport}
                      variant="outline"
                      size="sm"
                    >
                      {isLoadingReport ? 'Retrying...' : 'Try Again'}
                    </Button>
                  </div>
                </div>
              )}

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
