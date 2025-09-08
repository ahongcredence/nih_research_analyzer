// Shared type definitions for the NIH Research Analyzer

export interface JBIQuestion {
  number: number;
  question: string;
  answer: string;
  reasoning: string;
  evidence: string[];
  biasImplication: string;
}

export interface Classification {
  fileName: string;
  studyType: string;
  confidence: number;
  reasoning: string;
}

export interface StudyRecommendation {
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
  assessmentMetadata: {
    confidence: number;
    processingTime: string;
    modelVersion: string;
  };
  errorDetails?: string;
}

export interface StudyAnalysis {
  fileName?: string;
  studyType?: string;
  criteriaType?: string;
  overallAssessment?: {
    biasRating?: string;
    recommendation?: string;
    summaryReasoning?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
  jbiQuestions?: JBIQuestion[];
  assessmentMetadata?: {
    confidence: number;
    processingTime: string;
    modelVersion: string;
  };
  errorDetails?: string;
}

export interface ReportData {
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
  detailedStudyAssessments: StudyAnalysis[];
  recommendationsByCategory: {
    highPriorityInclusions: StudyRecommendation[];
    conditionalInclusions: StudyRecommendation[];
    needsFurtherReview: StudyRecommendation[];
    clearExclusions: StudyRecommendation[];
  };
  originalClassifications: Classification[];
}

// Flexible version for data normalization
export interface FlexibleReportData {
  reportMetadata?: {
    sessionId?: string;
    s3Bucket?: string;
    generatedAt?: string;
    reportType?: string;
    lambdaRequestId?: string;
    bedrockModel?: string;
  };
  executiveSummary?: {
    overallFindings?: string;
    inclusionRate?: string;
    majorConcerns?: string[];
    keyStrengths?: string[];
    assessmentConfidence?: string;
    nextSteps?: string[];
  };
  summaryStatistics?: {
    totalStudies?: number;
    successfulAnalyses?: number;
    failedAnalyses?: number;
    studyTypeBreakdown?: Record<string, number>;
    biasRatingDistribution?: Record<string, number>;
    recommendationDistribution?: Record<string, number>;
    inclusionRate?: string;
  };
  detailedStudyAssessments?: StudyAnalysis[];
  recommendationsByCategory?: {
    highPriorityInclusions?: StudyRecommendation[];
    conditionalInclusions?: StudyRecommendation[];
    needsFurtherReview?: StudyRecommendation[];
    clearExclusions?: StudyRecommendation[];
  };
  originalClassifications?: Classification[];
}

export interface AnalysisStatus {
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

// Type guards for runtime validation
export function isJBIQuestion(obj: unknown): obj is JBIQuestion {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).number === 'number' &&
    typeof (obj as Record<string, unknown>).question === 'string' &&
    typeof (obj as Record<string, unknown>).answer === 'string' &&
    typeof (obj as Record<string, unknown>).reasoning === 'string' &&
    Array.isArray((obj as Record<string, unknown>).evidence) &&
    typeof (obj as Record<string, unknown>).biasImplication === 'string'
  );
}

export function isClassification(obj: unknown): obj is Classification {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).fileName === 'string' &&
    typeof (obj as Record<string, unknown>).studyType === 'string' &&
    typeof (obj as Record<string, unknown>).confidence === 'number' &&
    typeof (obj as Record<string, unknown>).reasoning === 'string'
  );
}

export function isStudyRecommendation(obj: unknown): obj is StudyRecommendation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).fileName === 'string' &&
    typeof (obj as Record<string, unknown>).studyType === 'string' &&
    typeof (obj as Record<string, unknown>).criteriaType === 'string' &&
    typeof (obj as Record<string, unknown>).overallAssessment === 'object' &&
    Array.isArray((obj as Record<string, unknown>).jbiQuestions) &&
    typeof (obj as Record<string, unknown>).assessmentMetadata === 'object'
  );
}

export function isReportData(obj: unknown): obj is ReportData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ((obj as Record<string, unknown>).reportMetadata !== undefined ||
    (obj as Record<string, unknown>).executiveSummary !== undefined ||
    (obj as Record<string, unknown>).summaryStatistics !== undefined ||
    (obj as Record<string, unknown>).detailedStudyAssessments !== undefined)
  );
}

// Runtime validation functions for API responses
export function validateApiResponse(data: unknown): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Response data is not an object' };
  }

  const obj = data as Record<string, unknown>;
  
  // Check for basic structure
  if (!obj.sessionId && !obj.reportMetadata && !obj.executiveSummary) {
    return { isValid: false, error: 'Response data missing required fields' };
  }

  return { isValid: true };
}

export function validateReportStructure(data: unknown): { isValid: boolean; error?: string } {
  if (!isReportData(data)) {
    return { isValid: false, error: 'Data does not match ReportData structure' };
  }

  const report = data as ReportData;
  
  // Validate required fields
  if (!report.reportMetadata?.sessionId) {
    return { isValid: false, error: 'Missing sessionId in reportMetadata' };
  }

  if (!report.executiveSummary?.overallFindings) {
    return { isValid: false, error: 'Missing overallFindings in executiveSummary' };
  }

  if (!report.summaryStatistics?.totalStudies && report.summaryStatistics?.totalStudies !== 0) {
    return { isValid: false, error: 'Missing totalStudies in summaryStatistics' };
  }

  return { isValid: true };
}

// Safe data extraction with validation
export function safeExtractReportData(data: unknown): { success: boolean; data?: ReportData; error?: string } {
  try {
    const validation = validateApiResponse(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Attempt to normalize the data
    const normalized = normalizeFlexibleReportData(data as Record<string, unknown>);
    const structureValidation = validateReportStructure(normalized);
    
    if (!structureValidation.isValid) {
      return { success: false, error: structureValidation.error };
    }

    return { success: true, data: normalized };
  } catch (error) {
    return { 
      success: false, 
      error: `Data extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Helper function to normalize flexible data to strict ReportData
function normalizeFlexibleReportData(data: Record<string, unknown>): ReportData {
  const safeString = (value: unknown, fallback: string = 'Unknown'): string => {
    return typeof value === 'string' ? value : fallback;
  };

  const safeArray = <T>(value: unknown, fallback: T[] = []): T[] => {
    return Array.isArray(value) ? value as T[] : fallback;
  };

  const safeNumber = (value: unknown, fallback: number = 0): number => {
    return typeof value === 'number' && !isNaN(value) ? value : fallback;
  };

  const safeRecord = (value: unknown, fallback: Record<string, number> = {}): Record<string, number> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, number> : fallback;
  };

  return {
    reportMetadata: {
      sessionId: safeString((data.reportMetadata as Record<string, unknown>)?.sessionId || data.sessionId, 'Unknown'),
      s3Bucket: safeString((data.reportMetadata as Record<string, unknown>)?.s3Bucket || data.s3Bucket, 'Unknown'),
      generatedAt: safeString((data.reportMetadata as Record<string, unknown>)?.generatedAt || data.generatedAt, new Date().toISOString()),
      reportType: safeString((data.reportMetadata as Record<string, unknown>)?.reportType || data.reportType, 'JBI Bias Assessment'),
      lambdaRequestId: safeString((data.reportMetadata as Record<string, unknown>)?.lambdaRequestId || data.lambdaRequestId, 'Unknown'),
      bedrockModel: safeString((data.reportMetadata as Record<string, unknown>)?.bedrockModel || data.bedrockModel, 'Unknown')
    },
    executiveSummary: {
      overallFindings: safeString((data.executiveSummary as Record<string, unknown>)?.overallFindings || data.overallFindings, 'No findings available'),
      inclusionRate: safeString((data.executiveSummary as Record<string, unknown>)?.inclusionRate || data.inclusionRate, 'Unknown'),
      majorConcerns: safeArray<string>((data.executiveSummary as Record<string, unknown>)?.majorConcerns || data.majorConcerns),
      keyStrengths: safeArray<string>((data.executiveSummary as Record<string, unknown>)?.keyStrengths || data.keyStrengths),
      assessmentConfidence: safeString((data.executiveSummary as Record<string, unknown>)?.assessmentConfidence || data.assessmentConfidence, 'Unknown'),
      nextSteps: safeArray<string>((data.executiveSummary as Record<string, unknown>)?.nextSteps || data.nextSteps)
    },
    summaryStatistics: {
      totalStudies: safeNumber((data.summaryStatistics as Record<string, unknown>)?.totalStudies || data.totalStudies),
      successfulAnalyses: safeNumber((data.summaryStatistics as Record<string, unknown>)?.successfulAnalyses || data.successfulAnalyses),
      failedAnalyses: safeNumber((data.summaryStatistics as Record<string, unknown>)?.failedAnalyses || data.failedAnalyses),
      studyTypeBreakdown: safeRecord((data.summaryStatistics as Record<string, unknown>)?.studyTypeBreakdown || data.studyTypeBreakdown),
      biasRatingDistribution: safeRecord((data.summaryStatistics as Record<string, unknown>)?.biasRatingDistribution || data.biasRatingDistribution),
      recommendationDistribution: safeRecord((data.summaryStatistics as Record<string, unknown>)?.recommendationDistribution || data.recommendationDistribution),
      inclusionRate: safeString((data.summaryStatistics as Record<string, unknown>)?.inclusionRate || data.inclusionRate, 'Unknown')
    },
    detailedStudyAssessments: safeArray<StudyAnalysis>((data.detailedStudyAssessments || data.studyAssessments)),
    recommendationsByCategory: {
      highPriorityInclusions: safeArray<StudyRecommendation>((data.recommendationsByCategory as Record<string, unknown>)?.highPriorityInclusions),
      conditionalInclusions: safeArray<StudyRecommendation>((data.recommendationsByCategory as Record<string, unknown>)?.conditionalInclusions),
      needsFurtherReview: safeArray<StudyRecommendation>((data.recommendationsByCategory as Record<string, unknown>)?.needsFurtherReview),
      clearExclusions: safeArray<StudyRecommendation>((data.recommendationsByCategory as Record<string, unknown>)?.clearExclusions)
    },
    originalClassifications: safeArray<Classification>((data.originalClassifications || data.classifications))
  };
}
