"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  Users,
  Shield,
  TrendingUp,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Target,
  Brain,
  BookOpen,
  Zap,
  HelpCircle,
  Info
} from "lucide-react";

interface JBIQuestion {
  number: number;
  question: string;
  answer: string;
  reasoning: string;
  evidence: string[];
  biasImplication: string;
  confidence?: number;
}

interface StudyAnalysis {
  status: string;
  overallAssessment: {
    biasRating: string;
    recommendation: string;
    strengths: string[];
    weaknesses: string[];
    summaryReasoning: string;
  };
  fileName: string;
  studyType: string;
  recommendation: string;
  sessionId: string;
  jbiQuestions: JBIQuestion[];
  biasRating: string;
}

interface ReportData {
  reportMetadata: {
    sessionId: string;
    s3Bucket: string;
    generatedAt: string;
    reportType: string;
    lambdaRequestId: string;
    bedrockModel: string;
  };
  executiveSummary: {
    overallFindings: string;
    inclusionRate: string;
    majorConcerns: string[];
    keyStrengths: string[];
    assessmentConfidence: string;
    nextSteps: string[];
  };
  summaryStatistics: {
    totalStudies: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    studyTypeBreakdown: Record<string, number>;
    biasRatingDistribution: Record<string, number>;
    recommendationDistribution: Record<string, number>;
    inclusionRate: string;
  };
  detailedStudyAssessments: Array<{
    fileName: string;
    studyType: string;
    criteriaType: string;
    overallAssessment: {
      biasRating: string;
      recommendation: string;
      summaryReasoning: string;
      strengths: string[];
      weaknesses: string[];
    };
    jbiQuestions: JBIQuestion[];
    assessmentMetadata: any;
    errorDetails?: string;
  }>;
  recommendationsByCategory: {
    highPriorityInclusions: any[];
    conditionalInclusions: any[];
    needsFurtherReview: any[];
    clearExclusions: any[];
  };
  originalClassifications: any[];
}

interface ReportViewerProps {
  reportData: ReportData | string;
  onExportPDF?: () => void;
}

export default function ReportViewer({ reportData, onExportPDF }: ReportViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['question-analysis']));
  const [expandedStudies, setExpandedStudies] = useState<Set<string>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  // Parse reportData if it's a string
  let parsedReportData: ReportData | null = null;
  
  try {
    if (typeof reportData === 'string') {
      parsedReportData = JSON.parse(reportData);
    } else {
      parsedReportData = reportData;
    }
  } catch (error) {
    console.error('ReportViewer: Failed to parse report data:', error);
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error: Invalid report data format</div>
        <p className="text-slate-600">The report data could not be parsed. Please try refreshing the page.</p>
      </div>
    );
  }

  // Debug logging
  console.log('ReportViewer received data type:', typeof reportData);
  console.log('ReportViewer received data:', reportData);
  console.log('ReportViewer parsed data:', parsedReportData);

  // Add error handling for missing or malformed data
  if (!parsedReportData) {
    console.error('ReportViewer: No report data provided');
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error: No report data available</div>
        <p className="text-slate-600">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  if (!parsedReportData.reportMetadata) {
    console.error('ReportViewer: Missing reportMetadata in data:', parsedReportData);
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error: Invalid report data structure</div>
        <p className="text-slate-600">The report data is missing required metadata.</p>
      </div>
    );
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleStudy = (studyId: string) => {
    const newExpanded = new Set(expandedStudies);
    if (newExpanded.has(studyId)) {
      newExpanded.delete(studyId);
    } else {
      newExpanded.add(studyId);
    }
    setExpandedStudies(newExpanded);
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getBiasRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'include': return 'text-green-600 bg-green-100 border-green-200';
      case 'exclude': return 'text-red-600 bg-red-100 border-red-200';
      case 'seek further info': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getAnswerColor = (answer: string) => {
    switch (answer.toLowerCase()) {
      case 'yes': return 'text-green-600 bg-green-50 border-green-200';
      case 'no': return 'text-red-600 bg-red-50 border-red-200';
      case 'unclear': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getBiasRatingIcon = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getConfidenceScore = (confidence: number) => {
    return Math.round(confidence * 100);
  };

  const getStudyConfidence = (fileName: string) => {
    if (!parsedReportData?.originalClassifications) return 0.5; // Default fallback
    const classification = parsedReportData.originalClassifications.find(
      (c: any) => c.fileName === fileName
    );
    return classification?.confidence || 0.5;
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { level: 'High', color: 'text-green-600' };
    if (confidence >= 0.6) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-red-600' };
  };

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-slate-600" />
              <div>
                <CardTitle className="text-lg text-slate-900">JBI Bias Assessment Report</CardTitle>
                <CardDescription className="text-slate-600">
                  Question-by-Question Analysis
                </CardDescription>
              </div>
            </div>
            <Button onClick={onExportPDF} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>Generated: {parsedReportData.reportMetadata.generatedAt ? 
                new Date(parsedReportData.reportMetadata.generatedAt).toLocaleDateString() : 
                'Unknown date'
              }</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-3 w-3" />
              <span>Studies: {parsedReportData.summaryStatistics?.totalStudies || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-3 w-3" />
              <span>Session: {parsedReportData.reportMetadata.sessionId || 'Unknown'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary - Compact */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-slate-50 py-3"
          onClick={() => toggleSection('executive-summary')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Executive Summary
            </CardTitle>
            {expandedSections.has('executive-summary') ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
            }
          </div>
        </CardHeader>
        {expandedSections.has('executive-summary') && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded">
                <h4 className="font-medium mb-1 text-sm text-slate-900">Overall Findings</h4>
                <p className="text-slate-700 text-sm">
                  {parsedReportData.executiveSummary?.overallFindings || 'No findings available'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-slate-600" />
                    <span className="font-medium text-sm text-slate-700">Key Strengths</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    {(parsedReportData.executiveSummary?.keyStrengths || []).map((strength, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-slate-500">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <AlertTriangle className="h-3 w-3 text-slate-600" />
                    <span className="font-medium text-sm text-slate-700">Major Concerns</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    {(parsedReportData.executiveSummary?.majorConcerns || []).map((concern, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-slate-500">•</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
                <div className="flex items-center space-x-1">
                  <Brain className="h-3 w-3 text-slate-600" />
                  <span className="font-medium text-slate-700">Confidence:</span>
                  <span className="text-slate-600">{parsedReportData.executiveSummary?.assessmentConfidence || 'Unknown'}</span>
                </div>
                <div className="text-slate-600">
                  <strong>Inclusion Rate:</strong> {parsedReportData.executiveSummary?.inclusionRate || 'Unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Question-by-Question Analysis */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              JBI Question-by-Question Analysis
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllQuestions(!showAllQuestions)}
                className="text-xs"
              >
                {showAllQuestions ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showAllQuestions ? 'Hide' : 'Show'} All
              </Button>
            </div>
          </div>
          <CardDescription className="text-sm text-slate-600">
            Detailed bias assessment with confidence scores and evidence
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {(parsedReportData.detailedStudyAssessments || []).map((analysis, index) => {
              const studyConfidence = getStudyConfidence(analysis.fileName);
              const confidenceInfo = getConfidenceLevel(studyConfidence);
              
              return (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                {/* Study Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{analysis.fileName}</h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {analysis.studyType}
                        </span>
                        <span className="flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          {analysis.criteriaType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex items-center space-x-4">
                      <span><strong>Bias Rating:</strong> {analysis.overallAssessment.biasRating}</span>
                      <span><strong>Recommendation:</strong> {analysis.overallAssessment.recommendation}</span>
                      <span><strong>Confidence:</strong> {getConfidenceScore(studyConfidence)}% ({confidenceInfo.level})</span>
                    </div>
                  </div>
                </div>

                {/* Overall Assessment Summary */}
                <div className="mb-3 p-3 bg-slate-50 rounded border-l-2 border-slate-300">
                  <h4 className="font-medium text-slate-900 mb-1 text-xs flex items-center">
                    <Brain className="h-3 w-3 mr-1" />
                    Overall Assessment
                  </h4>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {analysis.overallAssessment.summaryReasoning}
                  </p>
                </div>

                {/* JBI Questions Section */}
                {analysis.jbiQuestions && analysis.jbiQuestions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        JBI Questions
                        <span className="ml-2 px-1 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                          {analysis.jbiQuestions.length}
                        </span>
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStudy(`study-${index}`)}
                        className="text-xs h-6 px-2"
                      >
                        {expandedStudies.has(`study-${index}`) ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {analysis.jbiQuestions.map((question, qIndex) => {
                        const questionId = `study-${index}-question-${qIndex}`;
                        const isExpanded = expandedStudies.has(`study-${index}`) || expandedQuestions.has(questionId);
                        
                        return (
                          <div key={qIndex} className="border rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                            {/* Question Header */}
                            <div 
                              className="p-3 cursor-pointer"
                              onClick={() => toggleQuestion(questionId)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className="flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-700 rounded text-xs font-semibold">
                                      {question.number}
                                    </div>
                                    <h5 className="font-medium text-slate-900 text-xs leading-tight">
                                      {question.question}
                                    </h5>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                  <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getAnswerColor(question.answer)}`}>
                                    {question.answer}
                                  </div>
                                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </div>
                              </div>
                            </div>

                            {/* Question Details */}
                            {isExpanded && (
                              <div className="px-3 pb-3 border-t bg-white">
                                <div className="space-y-2 pt-2">
                                  {/* Reasoning */}
                                  <div>
                                    <div className="flex items-center space-x-1 mb-1">
                                      <Brain className="h-3 w-3 text-slate-600" />
                                      <span className="text-xs font-medium text-slate-700">Reasoning</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed pl-4">
                                      {question.reasoning}
                                    </p>
                                  </div>

                                  {/* Evidence */}
                                  {question.evidence && question.evidence.length > 0 && (
                                    <div>
                                      <div className="flex items-center space-x-1 mb-1">
                                        <BookOpen className="h-3 w-3 text-slate-600" />
                                        <span className="text-xs font-medium text-slate-700">Evidence</span>
                                      </div>
                                      <ul className="space-y-1 pl-4">
                                        {question.evidence.map((evidence, eIndex) => (
                                          <li key={eIndex} className="text-xs text-slate-600 flex items-start">
                                            <span className="text-slate-500 mr-1 mt-0.5">•</span>
                                            <span className="leading-relaxed">{evidence}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Bias Implication */}
                                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                                    <div className="flex items-center space-x-1 mb-1">
                                      <AlertTriangle className="h-3 w-3 text-slate-600" />
                                      <span className="text-xs font-medium text-slate-700">Bias Implication</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                      {question.biasImplication}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {analysis.errorDetails && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Assessment Error</span>
                    </div>
                    <p className="text-sm text-red-700">{analysis.errorDetails}</p>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics - Compact */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-slate-50 py-3"
          onClick={() => toggleSection('summary-stats')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Summary Statistics
            </CardTitle>
            {expandedSections.has('summary-stats') ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
            }
          </div>
        </CardHeader>
        {expandedSections.has('summary-stats') && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-slate-50 rounded">
                <div className="text-lg font-bold text-slate-700">
                  {parsedReportData.summaryStatistics?.totalStudies || 0}
                </div>
                <div className="text-xs text-slate-600">Total Studies</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded">
                <div className="text-lg font-bold text-slate-700">
                  {parsedReportData.summaryStatistics?.successfulAnalyses || 0}
                </div>
                <div className="text-xs text-slate-600">Successful</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded">
                <div className="text-lg font-bold text-slate-700">
                  {parsedReportData.summaryStatistics?.biasRatingDistribution?.Moderate || 0}
                </div>
                <div className="text-xs text-slate-600">Moderate Risk</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded">
                <div className="text-lg font-bold text-slate-700">
                  {parsedReportData.summaryStatistics?.biasRatingDistribution?.High || 0}
                </div>
                <div className="text-xs text-slate-600">High Risk</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}