# JBI Bias Analysis Report System

This document explains how the JBI (Joanna Briggs Institute) bias analysis report system works in the NIH Research Analyzer application.

## Overview

The system processes uploaded PDF documents through a multi-stage analysis pipeline that includes:
1. PDF text extraction and processing
2. Study type classification using AI
3. JBI bias assessment based on study type
4. Comprehensive report generation
5. PDF export functionality

## Architecture

### Step Functions Workflow

The analysis is orchestrated by AWS Step Functions with the following states:

1. **PrepareClassifications** - Prepares data for study classification
2. **CheckClassificationsFound** - Validates that studies were classified
3. **AnalyzeStudiesByType** - Applies JBI criteria based on study type:
   - Cohort studies → `nih_cohort_assessment` Lambda
   - Case-control studies → `nih_case_control_assessment` Lambda
   - Other studies → `nih_general_assessment` Lambda
4. **GenerateComprehensiveReport** - Creates the final report using `nih_generate_final_report` Lambda
5. **JBIAnalysisCompleted** - Final success state

### Lambda Functions

- **nih_cohort_assessment**: Applies JBI criteria for cohort studies
- **nih_case_control_assessment**: Applies JBI criteria for case-control studies
- **nih_general_assessment**: Applies general JBI criteria
- **nih_generate_final_report**: Generates the comprehensive final report

### Report Structure

The final report includes:

```json
{
  "reportMetadata": {
    "sessionId": "string",
    "s3Bucket": "string",
    "generatedAt": "ISO timestamp",
    "reportType": "jbi_bias_assessment_detailed",
    "lambdaRequestId": "string",
    "bedrockModel": "string"
  },
  "executiveSummary": {
    "overallFindings": "string",
    "inclusionRate": "string",
    "majorConcerns": ["string"],
    "keyStrengths": ["string"],
    "assessmentConfidence": "string",
    "nextSteps": ["string"]
  },
  "summaryStatistics": {
    "totalStudies": "number",
    "successfulAnalyses": "number",
    "failedAnalyses": "number",
    "studyTypeBreakdown": "object",
    "biasRatingDistribution": "object",
    "recommendationDistribution": "object",
    "inclusionRate": "string"
  },
  "detailedStudyAssessments": [
    {
      "fileName": "string",
      "studyType": "string",
      "criteriaType": "string",
      "overallAssessment": {
        "biasRating": "Low|Moderate|High",
        "recommendation": "Include|Exclude|Seek further info",
        "summaryReasoning": "string",
        "strengths": ["string"],
        "weaknesses": ["string"]
      },
      "jbiQuestions": [
        {
          "number": "number",
          "question": "string",
          "answer": "Yes|No|Unclear",
          "reasoning": "string",
          "evidence": ["string"],
          "biasImplication": "string"
        }
      ],
      "assessmentMetadata": {
        "confidence": "number",
        "processingTime": "string",
        "modelVersion": "string"
      }
    }
  ],
  "recommendationsByCategory": {
    "highPriorityInclusions": ["study objects"],
    "conditionalInclusions": ["study objects"],
    "needsFurtherReview": ["study objects"],
    "clearExclusions": ["study objects"]
  },
  "originalClassifications": [
    {
      "fileName": "string",
      "studyType": "string",
      "confidence": "number",
      "reasoning": "string"
    }
  ]
}
```

## API Endpoints

### Status Check
- **GET** `/api/status?sessionId={sessionId}`
- Returns analysis progress and results
- Includes report location and summary data

### Report Fetch
- **GET** `/api/report?sessionId={sessionId}`
- Fetches the complete report from S3
- Validates report format and structure

### Report Generation
- **POST** `/api/report`
- Triggers report generation (if needed)

## Frontend Components

### StatusTracker
- Monitors analysis progress
- Displays current phase and progress percentage
- Handles completion and error states

### ReportViewer
- Displays the comprehensive JBI report
- Shows executive summary, statistics, and detailed assessments
- Includes expandable sections for JBI questions
- Provides CSV export functionality

### PDF Export
- Generates professional PDF reports
- Includes all report sections with proper formatting
- Handles both direct data export and HTML-to-PDF conversion

## Data Flow

1. **Upload**: User uploads PDF documents
2. **Processing**: Step Functions orchestrates the analysis pipeline
3. **Classification**: AI classifies study types
4. **Bias Assessment**: JBI criteria applied based on study type
5. **Report Generation**: Comprehensive report created and stored in S3
6. **Display**: Frontend fetches and displays the report
7. **Export**: User can export to PDF or CSV

## Error Handling

- Failed analyses are included in the report with error details
- Graceful fallbacks for missing data
- Comprehensive error logging and user feedback
- Retry mechanisms for transient failures

## Configuration

### Environment Variables
- `REGION`: AWS region (default: us-east-1)
- `S3_BUCKET_NAME`: S3 bucket for report storage
- `STEP_FUNCTION_ARN`: Step Functions state machine ARN

### S3 Storage
Reports are stored in S3 with the following structure:
```
s3://bucket-name/
  reports/
    {sessionId}/
      final_jbi_report_{timestamp}.json
```

## Usage

1. Upload PDF documents through the upload interface
2. Monitor progress using the StatusTracker component
3. Once complete, the report is automatically fetched and displayed
4. Use the "Load Report" button if the report doesn't load automatically
5. Export to PDF or CSV using the respective buttons

## Troubleshooting

### Report Not Loading
- Check if the analysis is complete
- Verify S3 permissions
- Use the "Load Report" button to manually fetch
- Check browser console for error messages

### PDF Export Issues
- Ensure report data is loaded
- Check for JavaScript errors
- Try the HTML-to-PDF fallback if direct export fails

### Missing Data
- Verify the report structure matches expected format
- Check if all analysis steps completed successfully
- Review error logs for failed analyses

## Future Enhancements

- Real-time progress updates via WebSocket
- Batch processing capabilities
- Custom report templates
- Advanced filtering and search
- Integration with external review systems
