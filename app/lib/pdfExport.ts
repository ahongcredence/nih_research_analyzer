import jsPDF from 'jspdf';

interface JBIQuestion {
  number: number;
  question: string;
  answer: string;
  reasoning: string;
  evidence: string[];
  biasImplication: string;
}

interface StudyAnalysis {
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
}

interface ReportData {
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
    highPriorityInclusions?: StudyAnalysis[];
    conditionalInclusions?: StudyAnalysis[];
    needsFurtherReview?: StudyAnalysis[];
    clearExclusions?: StudyAnalysis[];
  };
  originalClassifications?: Array<{
    fileName?: string;
    studyType?: string;
    confidence?: number;
    reasoning?: string;
  }>;
}

class PDFReportGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 280; // A4 page height in mm
  private margin: number = 20;
  private contentWidth: number = 170; // A4 width minus margins

  constructor() {
    this.doc = new jsPDF();
    this.doc.setFont('helvetica');
  }

  private addHeader(title: string, fontSize: number = 16, isBold: boolean = true) {
    if (this.currentY > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += fontSize / 2 + 5;
  }

  private addSubHeader(title: string, fontSize: number = 12) {
    if (this.currentY > this.pageHeight - 15) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  private addText(text: string, fontSize: number = 10, isBold: boolean = false, color: string = '#000000') {
    if (this.currentY > this.pageHeight - 10) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    this.doc.setTextColor(color);
    
    // Split text into lines that fit within content width
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * (fontSize / 2 + 1);
  }

  private addBulletList(items: string[], fontSize: number = 10) {
    items.forEach(item => {
      if (this.currentY > this.pageHeight - 10) {
        this.doc.addPage();
        this.currentY = 20;
      }
      
      this.doc.setFontSize(fontSize);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('• ' + item, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
  }

  private addTable(headers: string[], rows: string[][], fontSize: number = 9) {
    if (this.currentY > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = 20;
    }

    const colWidths = [40, 30, 30, 30, 30]; // Adjust based on number of columns
    const rowHeight = 8;
    
    // Headers
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    let x = this.margin;
    headers.forEach((header, i) => {
      this.doc.text(header, x, this.currentY);
      x += colWidths[i] || 30;
    });
    this.currentY += rowHeight;

    // Rows
    this.doc.setFont('helvetica', 'normal');
    rows.forEach(row => {
      if (this.currentY > this.pageHeight - 15) {
        this.doc.addPage();
        this.currentY = 20;
      }
      
      x = this.margin;
      row.forEach((cell, i) => {
        this.doc.text(cell, x, this.currentY);
        x += colWidths[i] || 30;
      });
      this.currentY += rowHeight;
    });
    this.currentY += 5;
  }

  private addPageBreak() {
    this.doc.addPage();
    this.currentY = 20;
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
    this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Page ${i} of ${pageCount}`, this.margin, this.pageHeight + 10);
      this.doc.text('Generated by NIH Research Analyzer', this.contentWidth - 50, this.pageHeight + 10);
    }
  }

  public generateReport(reportData: ReportData): void {
    try {
      // Validate report data structure
      if (!reportData) {
        throw new Error('Report data is null or undefined');
      }

      console.log('PDF Export - Report data keys:', Object.keys(reportData));
      console.log('PDF Export - Report metadata:', reportData.reportMetadata);
      console.log('PDF Export - Executive summary:', reportData.executiveSummary);
      console.log('PDF Export - Summary statistics:', reportData.summaryStatistics);
      console.log('PDF Export - Detailed study assessments count:', reportData.detailedStudyAssessments?.length || 0);
      console.log('PDF Export - Original classifications count:', reportData.originalClassifications?.length || 0);

      // Title Page
      this.addHeader('NIH Research Analyzer', 20, true);
      this.addHeader('JBI Bias Assessment Report', 16, true);
      this.currentY += 10;
      
      // Safe access to reportMetadata with fallbacks
      const metadata = reportData.reportMetadata || {};
      this.addText(`Session ID: ${metadata.sessionId || 'Unknown'}`, 10, true);
      this.addText(`Generated: ${metadata.generatedAt ? new Date(metadata.generatedAt).toLocaleString() : new Date().toLocaleString()}`, 10);
      this.addText(`Report Type: ${metadata.reportType || 'JBI Bias Assessment'}`, 10);
      this.addText(`AI Model: ${metadata.bedrockModel || 'Unknown'}`, 10);
      
      this.addPageBreak();

      // Executive Summary
      this.addHeader('Executive Summary', 16, true);
      const executiveSummary = reportData.executiveSummary || {};
      this.addText(executiveSummary.overallFindings || 'No findings available', 11);
      this.currentY += 5;
      
      this.addSubHeader('Key Findings');
      this.addText(`Inclusion Rate: ${executiveSummary.inclusionRate || 'Unknown'}`, 10, true);
      this.addText(`Assessment Confidence: ${executiveSummary.assessmentConfidence || 'Unknown'}`, 10, true);
      
      this.addSubHeader('Major Concerns');
      this.addBulletList(executiveSummary.majorConcerns || []);
      
      this.addSubHeader('Key Strengths');
      this.addBulletList(executiveSummary.keyStrengths || []);
      
      this.addSubHeader('Recommended Next Steps');
      this.addBulletList(executiveSummary.nextSteps || []);

      this.addPageBreak();

      // Summary Statistics
      this.addHeader('Summary Statistics', 16, true);
      
      const stats = reportData.summaryStatistics || {};
      this.addSubHeader('Study Overview');
      this.addText(`Total Studies Analyzed: ${stats.totalStudies || 0}`, 11, true);
      this.addText(`Successful Analyses: ${stats.successfulAnalyses || 0}`, 10);
      this.addText(`Failed Analyses: ${stats.failedAnalyses || 0}`, 10);
      this.addText(`Overall Inclusion Rate: ${stats.inclusionRate || 'Unknown'}`, 10, true);

      this.addSubHeader('Study Type Distribution');
      const studyTypeRows = Object.entries(stats.studyTypeBreakdown || {}).map(([type, count]) => 
        [type.charAt(0).toUpperCase() + type.slice(1), count.toString()]
      );
      if (studyTypeRows.length > 0) {
        this.addTable(['Study Type', 'Count'], studyTypeRows);
      }

      this.addSubHeader('Bias Rating Distribution');
      const biasRows = Object.entries(stats.biasRatingDistribution || {}).map(([rating, count]) => 
        [rating, count.toString()]
      );
      if (biasRows.length > 0) {
        this.addTable(['Bias Rating', 'Count'], biasRows);
      }

      this.addSubHeader('Recommendation Distribution');
      const recRows = Object.entries(stats.recommendationDistribution || {}).map(([rec, count]) => 
        [rec, count.toString()]
      );
      if (recRows.length > 0) {
        this.addTable(['Recommendation', 'Count'], recRows);
      }

      this.addPageBreak();

      // Detailed Study Assessments
      this.addHeader('Detailed Study Assessments', 16, true);
      
      const studies = reportData.detailedStudyAssessments || [];
      console.log('PDF Export - Processing studies:', studies.length);
      
      if (studies.length === 0) {
        this.addText('No detailed study assessments available.', 10);
      } else {
        studies.forEach((study, index) => {
          console.log(`PDF Export - Processing study ${index + 1}:`, study);
          
          this.addSubHeader(`Study ${index + 1}: ${study.fileName || 'Unknown File'}`, 12);
          
          this.addText(`Study Type: ${study.studyType || 'Unknown'}`, 10, true);
          
          const assessment = study.overallAssessment || {};
          this.addText(`Bias Rating: ${assessment.biasRating || 'Unknown'}`, 10, true);
          this.addText(`Recommendation: ${assessment.recommendation || 'Unknown'}`, 10, true);
          
          // Get confidence from original classifications
          const classification = reportData.originalClassifications?.find(c => c.fileName === study.fileName);
          if (classification && classification.confidence) {
            this.addText(`Confidence: ${Math.round(classification.confidence * 100)}%`, 10, true);
          }
          
          this.currentY += 3;
          
          this.addSubHeader('Overall Assessment');
          this.addText(assessment.summaryReasoning || 'No assessment available', 10);
          
          this.addSubHeader('Strengths');
          this.addBulletList(assessment.strengths || [], 9);
          
          this.addSubHeader('Weaknesses');
          this.addBulletList(assessment.weaknesses || [], 9);
          
          this.addSubHeader('JBI Question Analysis');
          const questions = study.jbiQuestions || [];
          console.log(`PDF Export - Processing ${questions.length} questions for study ${index + 1}`);
          
          if (questions.length === 0) {
            this.addText('No JBI questions available for this study.', 9);
          } else {
            questions.forEach((question) => {
              this.addText(`Q${question.number}: ${question.question}`, 9, true);
              this.addText(`Answer: ${question.answer}`, 9, true);
              this.addText(`Reasoning: ${question.reasoning}`, 9);
              
              if (question.evidence && question.evidence.length > 0) {
                this.addText('Evidence:', 9, true);
                question.evidence.forEach(evidence => {
                  this.addText(`• ${evidence}`, 8);
                });
              }
              
              if (question.biasImplication) {
                this.addText(`Bias Implication: ${question.biasImplication}`, 9);
              }
              
              this.currentY += 3;
            });
          }
          
          if (index < studies.length - 1) {
            this.addPageBreak();
          }
        });
      }

      this.addPageBreak();

      // Recommendations by Category
      this.addHeader('Recommendations by Category', 16, true);
      
      const recs = reportData.recommendationsByCategory || {};
      
      if (recs.highPriorityInclusions && recs.highPriorityInclusions.length > 0) {
        this.addSubHeader('High Priority Inclusions');
        recs.highPriorityInclusions.forEach(study => {
          const assessment = study.overallAssessment || {};
          this.addText(`• ${study.fileName || 'Unknown'} (${assessment.biasRating || 'Unknown'} bias)`, 10);
        });
      }
      
      if (recs.conditionalInclusions && recs.conditionalInclusions.length > 0) {
        this.addSubHeader('Conditional Inclusions');
        recs.conditionalInclusions.forEach(study => {
          const assessment = study.overallAssessment || {};
          this.addText(`• ${study.fileName || 'Unknown'} (${assessment.biasRating || 'Unknown'} bias)`, 10);
        });
      }
      
      if (recs.needsFurtherReview && recs.needsFurtherReview.length > 0) {
        this.addSubHeader('Needs Further Review');
        recs.needsFurtherReview.forEach(study => {
          const assessment = study.overallAssessment || {};
          this.addText(`• ${study.fileName || 'Unknown'} (${assessment.biasRating || 'Unknown'} bias)`, 10);
        });
      }
      
      if (recs.clearExclusions && recs.clearExclusions.length > 0) {
        this.addSubHeader('Clear Exclusions');
        recs.clearExclusions.forEach(study => {
          const assessment = study.overallAssessment || {};
          this.addText(`• ${study.fileName || 'Unknown'} (${assessment.biasRating || 'Unknown'} bias)`, 10);
        });
      }

      // Add footer to all pages
      this.addFooter();
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public save(filename: string): void {
    this.doc.save(filename);
  }
}

export async function exportReportToPDF(reportData: ReportData | string | Record<string, unknown>): Promise<void> {
  try {
    if (!reportData) {
      throw new Error('No report data provided');
    }

    console.log('PDF Export - Input data type:', typeof reportData);
    console.log('PDF Export - Input data keys:', typeof reportData === 'object' ? Object.keys(reportData) : 'N/A');
    console.log('PDF Export - Input data:', reportData);
    
    // Handle case where reportData might be a string
    let parsedData: ReportData;
    if (typeof reportData === 'string') {
      try {
        const rawData = JSON.parse(reportData);
        parsedData = normalizeReportData(rawData);
        console.log('PDF Export - Parsed and normalized string data:', parsedData);
      } catch (parseError) {
        console.error('PDF Export - JSON parse error:', parseError);
        throw new Error('Report data is a string but cannot be parsed as JSON');
      }
    } else if (typeof reportData === 'object') {
      parsedData = normalizeReportData(reportData as Record<string, unknown>);
      console.log('PDF Export - Normalized object data:', parsedData);
    } else {
      throw new Error('Invalid report data type');
    }

    const generator = new PDFReportGenerator();
    generator.generateReport(parsedData);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `jbi-bias-assessment-${timestamp}.pdf`;
    generator.save(filename);
    
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
}

// Helper function to normalize data structure
function normalizeReportData(data: Record<string, unknown>): ReportData {
  console.log('PDF Export - Normalizing data structure:', data);
  
  // Check if this is a JBI bias analysis report
  const isJBIReport = data.reportMetadata?.reportType?.includes('jbi') || 
                     data.reportType?.includes('jbi') ||
                     data.detailedStudyAssessments?.length > 0;
  
  console.log('PDF Export - Is JBI report:', isJBIReport);
  
  // Ensure we have the basic structure
  const normalized: ReportData = {
    reportMetadata: {
      sessionId: (data.reportMetadata as Record<string, unknown>)?.sessionId as string || (data.sessionId as string) || 'Unknown',
      s3Bucket: (data.reportMetadata as Record<string, unknown>)?.s3Bucket as string || (data.s3Bucket as string) || 'Unknown',
      generatedAt: (data.reportMetadata as Record<string, unknown>)?.generatedAt as string || (data.generatedAt as string) || new Date().toISOString(),
      reportType: (data.reportMetadata as Record<string, unknown>)?.reportType as string || (data.reportType as string) || 'JBI Bias Assessment',
      lambdaRequestId: (data.reportMetadata as Record<string, unknown>)?.lambdaRequestId as string || (data.lambdaRequestId as string) || 'Unknown',
      bedrockModel: (data.reportMetadata as Record<string, unknown>)?.bedrockModel as string || (data.bedrockModel as string) || 'Unknown'
    },
    executiveSummary: {
      overallFindings: (data.executiveSummary as Record<string, unknown>)?.overallFindings as string || (data.overallFindings as string) || 'No findings available',
      inclusionRate: (data.executiveSummary as Record<string, unknown>)?.inclusionRate as string || (data.inclusionRate as string) || 'Unknown',
      majorConcerns: (data.executiveSummary as Record<string, unknown>)?.majorConcerns as string[] || (data.majorConcerns as string[]) || [],
      keyStrengths: (data.executiveSummary as Record<string, unknown>)?.keyStrengths as string[] || (data.keyStrengths as string[]) || [],
      assessmentConfidence: (data.executiveSummary as Record<string, unknown>)?.assessmentConfidence as string || (data.assessmentConfidence as string) || 'Unknown',
      nextSteps: (data.executiveSummary as Record<string, unknown>)?.nextSteps as string[] || (data.nextSteps as string[]) || []
    },
    summaryStatistics: {
      totalStudies: (data.summaryStatistics as Record<string, unknown>)?.totalStudies as number || (data.totalStudies as number) || 0,
      successfulAnalyses: (data.summaryStatistics as Record<string, unknown>)?.successfulAnalyses as number || (data.successfulAnalyses as number) || 0,
      failedAnalyses: (data.summaryStatistics as Record<string, unknown>)?.failedAnalyses as number || (data.failedAnalyses as number) || 0,
      studyTypeBreakdown: (data.summaryStatistics as Record<string, unknown>)?.studyTypeBreakdown as Record<string, number> || (data.studyTypeBreakdown as Record<string, number>) || {},
      biasRatingDistribution: (data.summaryStatistics as Record<string, unknown>)?.biasRatingDistribution as Record<string, number> || (data.biasRatingDistribution as Record<string, number>) || {},
      recommendationDistribution: (data.summaryStatistics as Record<string, unknown>)?.recommendationDistribution as Record<string, number> || (data.recommendationDistribution as Record<string, number>) || {},
      inclusionRate: (data.summaryStatistics as Record<string, unknown>)?.inclusionRate as string || (data.inclusionRate as string) || 'Unknown'
    },
    detailedStudyAssessments: ((data.detailedStudyAssessments as unknown[]) || (data.studyAssessments as unknown[]) || []) as ReportData['detailedStudyAssessments'],
    recommendationsByCategory: {
      highPriorityInclusions: (data.recommendationsByCategory as Record<string, unknown>)?.highPriorityInclusions as unknown[] || [],
      conditionalInclusions: (data.recommendationsByCategory as Record<string, unknown>)?.conditionalInclusions as unknown[] || [],
      needsFurtherReview: (data.recommendationsByCategory as Record<string, unknown>)?.needsFurtherReview as unknown[] || [],
      clearExclusions: (data.recommendationsByCategory as Record<string, unknown>)?.clearExclusions as unknown[] || []
    } as ReportData['recommendationsByCategory'],
    originalClassifications: ((data.originalClassifications as unknown[]) || (data.classifications as unknown[]) || []) as ReportData['originalClassifications']
  };

  console.log('PDF Export - Normalized data keys:', Object.keys(normalized));
  console.log('PDF Export - Has reportMetadata:', !!normalized.reportMetadata);
  console.log('PDF Export - Has executiveSummary:', !!normalized.executiveSummary);
  console.log('PDF Export - Has detailedStudyAssessments:', !!normalized.detailedStudyAssessments);
  console.log('PDF Export - Study assessments count:', normalized.detailedStudyAssessments?.length || 0);

  return normalized;
}

// Keep the HTML fallback for compatibility
export async function exportHTMLToPDF(elementId: string, filename: string): Promise<void> {
  try {
    const { default: html2canvas } = await import('html2canvas');
      const element = document.getElementById(elementId);
    
      if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

    pdf.save(filename);
    } catch (error) {
    console.error('HTML to PDF export error:', error);
    throw error;
  }
}