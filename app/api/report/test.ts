// Test file for the report API endpoint
// This is a simple test to verify the report fetching functionality

// Mock test data
const mockReportData = {
  reportMetadata: {
    sessionId: 'test-session-123',
    s3Bucket: 'test-bucket',
    generatedAt: new Date().toISOString(),
    reportType: 'jbi_bias_assessment_detailed',
    lambdaRequestId: 'test-lambda-123',
    bedrockModel: 'anthropic.claude-3-sonnet-20240229-v1:0'
  },
  executiveSummary: {
    overallFindings: 'Test findings for JBI bias assessment',
    inclusionRate: '75% of studies recommended for inclusion',
    majorConcerns: ['Sample size limitations', 'Potential selection bias'],
    keyStrengths: ['Systematic methodology', 'Comprehensive assessment'],
    assessmentConfidence: 'High',
    nextSteps: ['Review detailed assessments', 'Validate key findings']
  },
  summaryStatistics: {
    totalStudies: 5,
    successfulAnalyses: 4,
    failedAnalyses: 1,
    studyTypeBreakdown: { 'cohort': 3, 'case-control': 2 },
    biasRatingDistribution: { 'Low': 2, 'Moderate': 2, 'High': 1 },
    recommendationDistribution: { 'Include': 3, 'Exclude': 1, 'Seek further info': 1 },
    inclusionRate: '75%'
  },
  detailedStudyAssessments: [
    {
      fileName: 'test-study-1.pdf',
      studyType: 'cohort',
      criteriaType: 'cohort',
      overallAssessment: {
        biasRating: 'Low',
        recommendation: 'Include',
        summaryReasoning: 'Well-designed cohort study with minimal bias',
        strengths: ['Large sample size', 'Long follow-up period'],
        weaknesses: ['Potential selection bias']
      },
      jbiQuestions: [
        {
          number: 1,
          question: 'Were the two groups similar and recruited from the same population?',
          answer: 'Yes',
          reasoning: 'Both groups were recruited from the same hospital system',
          evidence: ['Same recruitment period', 'Similar demographic characteristics'],
          biasImplication: 'Minimal selection bias'
        }
      ],
      assessmentMetadata: {
        confidence: 0.85,
        processingTime: '2.3s',
        modelVersion: 'claude-3-sonnet'
      }
    }
  ],
  recommendationsByCategory: {
    highPriorityInclusions: [],
    conditionalInclusions: [],
    needsFurtherReview: [],
    clearExclusions: []
  },
  originalClassifications: [
    {
      fileName: 'test-study-1.pdf',
      studyType: 'cohort',
      confidence: 0.92,
      reasoning: 'Clear cohort study design with exposed and unexposed groups'
    }
  ]
};

// Test function to validate report structure
export function validateReportStructure(reportData: Record<string, unknown>): boolean {
  try {
    // Check required top-level properties
    const requiredProps = ['reportMetadata', 'executiveSummary', 'summaryStatistics', 'detailedStudyAssessments'];
    for (const prop of requiredProps) {
      if (!reportData[prop]) {
        console.error(`Missing required property: ${prop}`);
        return false;
      }
    }

    // Check reportMetadata structure
    const metadata = reportData.reportMetadata as Record<string, unknown>;
    if (!metadata.sessionId || !metadata.reportType) {
      console.error('Invalid reportMetadata structure');
      return false;
    }

    // Check executiveSummary structure
    const summary = reportData.executiveSummary as Record<string, unknown>;
    if (!summary.overallFindings || !summary.inclusionRate) {
      console.error('Invalid executiveSummary structure');
      return false;
    }

    // Check summaryStatistics structure
    const stats = reportData.summaryStatistics as Record<string, unknown>;
    if (typeof stats.totalStudies !== 'number' || typeof stats.successfulAnalyses !== 'number') {
      console.error('Invalid summaryStatistics structure');
      return false;
    }

    // Check detailedStudyAssessments structure
    const assessments = reportData.detailedStudyAssessments;
    if (!Array.isArray(assessments)) {
      console.error('detailedStudyAssessments must be an array');
      return false;
    }

    // Validate each assessment
    for (const assessment of assessments) {
      if (!assessment.fileName || !assessment.studyType || !assessment.overallAssessment) {
        console.error('Invalid assessment structure');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating report structure:', error);
    return false;
  }
}

// Test the validation function
console.log('Testing report structure validation...');
const isValid = validateReportStructure(mockReportData);
console.log('Report structure is valid:', isValid);

export { mockReportData };
