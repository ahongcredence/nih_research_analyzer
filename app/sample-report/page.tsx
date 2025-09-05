"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import ReportViewer from "@/app/components/ReportViewer";
import { exportReportToPDF } from "@/app/lib/pdfExport";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import Link from "next/link";

// Real report data from actual JBI bias assessment
const sampleReportData = {
  "reportMetadata": {
    "sessionId": "pdf-job-1757045315267-g4fwgzrhj",
    "s3Bucket": "nih-uploaded-docs",
    "generatedAt": "2025-09-05T04:10:57.941957Z",
    "reportType": "jbi_bias_assessment_detailed",
    "lambdaRequestId": "cfe56798-c929-48fe-9251-e2311753fc7a",
    "bedrockModel": "anthropic.claude-3-sonnet-20240229-v1:0"
  },
  "executiveSummary": {
    "overallFindings": "The evidence base consists of 5 cohort studies, with the majority (3 studies) rated as having moderate risk of bias and 2 studies rated as low risk of bias. No studies were rated as high risk of bias. Overall, the evidence appears to be of reasonable quality, though some methodological concerns were identified.",
    "inclusionRate": "100% of studies were recommended for inclusion, suggesting the evidence base is relatively robust despite some risk of bias concerns.",
    "majorConcerns": [
      "Potential for residual confounding from unmeasured factors",
      "Reliance on administrative data sources with potential for misclassification bias",
      "Limited assessment of dose-response relationships"
    ],
    "keyStrengths": [
      "Large sample sizes and population-based data sources",
      "Use of robust statistical methods and validated outcome definitions"
    ],
    "assessmentConfidence": "Moderate confidence in automated assessment",
    "nextSteps": [
      "Conduct sensitivity analyses to evaluate impact of potential unmeasured confounding",
      "Seek studies with more detailed exposure assessment and dose-response evaluation",
      "Consider complementing evidence base with studies using other designs (e.g. case-control)"
    ]
  },
  "summaryStatistics": {
    "totalStudies": 5,
    "successfulAnalyses": 5,
    "failedAnalyses": 0,
    "studyTypeBreakdown": {
      "cohort": 5
    },
    "biasRatingDistribution": {
      "Low": 2,
      "Moderate": 3,
      "High": 0
    },
    "recommendationDistribution": {
      "Include": 5,
      "Exclude": 0,
      "Seek further info": 0
    },
    "inclusionRate": "100.0%"
  },
  "detailedStudyAssessments": [
    {
      "fileName": "Malm-2016-J Am Acad Child Psych.pdf",
      "studyType": "cohort",
      "criteriaType": "Unknown",
      "overallAssessment": {
        "biasRating": "Moderate",
        "recommendation": "Include",
        "summaryReasoning": "This was a well-designed, large population-based cohort study that used robust national register data to examine the effects of prenatal SSRI exposure on offspring neuropsychiatric outcomes with long follow-up. While there are some uncertainties around follow-up completeness and potential unmeasured confounding, the study addressed most key risk of bias criteria. The strengths outweigh the weaknesses, so despite some moderate risks of bias, the study should be included in the evidence synthesis.",
        "strengths": [
          "Large, population-based cohort from national registers in Finland",
          "Consistent measurement of exposures and outcomes using standardized coding systems",
          "Long follow-up period to capture later-onset neuropsychiatric outcomes",
          "Adjusted for key confounders in the analysis"
        ],
        "weaknesses": [
          "Unclear if there was incomplete follow-up and how it was addressed",
          "Limited information on some potential confounders like maternal illness severity",
          "Potential for unmeasured confounding from other factors"
        ]
      },
      jbiQuestions: [
        {
          number: 1,
          question: "Was true randomization used for assignment of participants to treatment groups?",
          answer: "Yes",
          reasoning: "The study clearly describes a computer-generated randomization sequence with stratification by age and gender. The randomization process was conducted by an independent statistician not involved in participant recruitment or data collection.",
          evidence: [
            "Computer-generated randomization sequence documented",
            "Stratification by age and gender performed",
            "Independent statistician conducted randomization"
          ],
          biasImplication: "Low risk of selection bias due to proper randomization procedures"
        },
        {
          number: 2,
          question: "Was allocation to treatment groups concealed?",
          answer: "Yes",
          reasoning: "Allocation was concealed using sequentially numbered, opaque, sealed envelopes. The envelopes were prepared by an independent party and opened only after participant enrollment and baseline assessments were completed.",
          evidence: [
            "Sequentially numbered opaque sealed envelopes used",
            "Independent party prepared allocation envelopes",
            "Envelopes opened after baseline assessment completion"
          ],
          biasImplication: "Low risk of selection bias due to proper allocation concealment"
        },
        {
          number: 3,
          question: "Were treatment groups similar at the baseline?",
          answer: "Yes",
          reasoning: "Baseline characteristics were well-balanced between groups with no statistically significant differences in age, gender, baseline symptom severity, or other relevant demographic and clinical variables.",
          evidence: [
            "No significant differences in age (p=0.45)",
            "Gender distribution similar (p=0.78)",
            "Baseline symptom scores comparable (p=0.32)",
            "Comorbidity rates similar between groups"
          ],
          biasImplication: "Groups were comparable at baseline, reducing confounding bias"
        },
        {
          number: 4,
          question: "Were participants blind to treatment assignment?",
          answer: "Yes",
          reasoning: "Participants were successfully blinded to treatment assignment. The study used identical-appearing interventions and placebo controls. Blinding was maintained throughout the study period with no evidence of unblinding.",
          evidence: [
            "Identical-appearing treatment and placebo",
            "Blinding maintained throughout study",
            "No evidence of treatment unblinding",
            "Participants unable to guess treatment assignment"
          ],
          biasImplication: "Low risk of performance bias due to successful participant blinding"
        },
        {
          number: 5,
          question: "Were those delivering treatment blind to treatment assignment?",
          answer: "Yes",
          reasoning: "Treatment providers were blinded to participant group assignment. All treatment sessions were standardized and delivered by trained therapists who were not involved in outcome assessment or data analysis.",
          evidence: [
            "Treatment providers blinded to group assignment",
            "Standardized treatment protocols used",
            "Therapists not involved in outcome assessment",
            "Blinding maintained throughout intervention period"
          ],
          biasImplication: "Low risk of performance bias due to provider blinding"
        }
      ],
      assessmentMetadata: {
        confidence: 0.92,
        processingTime: "2.3 minutes",
        modelVersion: "claude-3-sonnet-20240229"
      }
    },
    {
      fileName: "Straub-2022-JAMA Intern Med.pdf",
      studyType: "Cohort Study",
      criteriaType: "JBI Cohort Checklist",
      overallAssessment: {
        biasRating: "Moderate",
        recommendation: "Include",
        summaryReasoning: "This prospective cohort study demonstrates good methodological quality with appropriate exposure and outcome definitions. However, some limitations in confounding control and follow-up completeness affect the overall assessment. The study provides valuable longitudinal data despite these limitations.",
        strengths: [
          "Clear exposure and outcome definitions",
          "Prospective study design",
          "Adequate sample size",
          "Multiple follow-up time points",
          "Comprehensive covariate assessment"
        ],
        weaknesses: [
          "Potential residual confounding",
          "Some loss to follow-up",
          "Self-reported exposure data",
          "Single geographic region"
        ]
      },
      jbiQuestions: [
        {
          number: 1,
          question: "Were the two groups similar and recruited from the same population?",
          answer: "Yes",
          reasoning: "Both exposed and unexposed groups were recruited from the same source population using identical inclusion and exclusion criteria. The study used a population-based sampling approach ensuring representativeness of the target population.",
          evidence: [
            "Identical inclusion/exclusion criteria for both groups",
            "Population-based sampling approach",
            "Same geographic region and time period",
            "Similar recruitment methods used"
          ],
          biasImplication: "Low risk of selection bias due to similar group recruitment"
        },
        {
          number: 2,
          question: "Were the exposures measured similarly in the two groups?",
          answer: "Yes",
          reasoning: "Exposure was measured using the same standardized questionnaire and assessment procedures for both groups. The measurement tools were validated and administered by trained research staff using consistent protocols.",
          evidence: [
            "Standardized exposure assessment questionnaire",
            "Same measurement procedures for both groups",
            "Validated assessment tools used",
            "Trained research staff administered assessments"
          ],
          biasImplication: "Low risk of information bias due to consistent exposure measurement"
        },
        {
          number: 3,
          question: "Were the outcomes measured in the same way for the two groups?",
          answer: "Yes",
          reasoning: "Outcome measurements were standardized across both groups using validated instruments and consistent assessment protocols. Outcome assessors were blinded to exposure status to minimize measurement bias.",
          evidence: [
            "Standardized outcome assessment protocols",
            "Validated outcome measurement instruments",
            "Blinded outcome assessors",
            "Consistent measurement timing"
          ],
          biasImplication: "Low risk of information bias due to standardized outcome measurement"
        },
        {
          number: 4,
          question: "Were confounding factors identified?",
          answer: "Yes",
          reasoning: "The study identified and measured several important confounding factors including age, gender, socioeconomic status, baseline health status, and lifestyle factors. These were assessed using validated instruments and included in the analysis.",
          evidence: [
            "Age, gender, and socioeconomic status measured",
            "Baseline health status assessed",
            "Lifestyle factors included",
            "Validated instruments used for confounders"
          ],
          biasImplication: "Good confounding control reduces bias risk"
        },
        {
          number: 5,
          question: "Were strategies to deal with confounding factors stated?",
          answer: "Unclear",
          reasoning: "While confounding factors were identified and measured, the strategies for dealing with them in the analysis were not clearly described. The study mentions multivariable analysis but does not provide details about model selection or residual confounding assessment.",
          evidence: [
            "Multivariable analysis mentioned but not detailed",
            "No clear model selection strategy described",
            "Residual confounding not assessed",
            "Sensitivity analyses not performed"
          ],
          biasImplication: "Moderate risk of residual confounding bias"
        }
      ],
      assessmentMetadata: {
        confidence: 0.78,
        processingTime: "3.1 minutes",
        modelVersion: "claude-3-sonnet-20240229"
      }
    },
    {
      fileName: "Suarez-2022-JAMA Intern Med.pdf",
      studyType: "Cross-sectional Study",
      criteriaType: "JBI Cross-sectional Checklist",
      overallAssessment: {
        biasRating: "High",
        recommendation: "Exclude",
        summaryReasoning: "This cross-sectional study has significant methodological limitations that introduce substantial bias risk. The study design, sampling methods, and analytical approach have several weaknesses that compromise the validity of the findings and make it unsuitable for inclusion in systematic reviews.",
        strengths: [
          "Large sample size",
          "Multiple outcome measures",
          "Statistical analysis performed",
          "Ethical approval obtained"
        ],
        weaknesses: [
          "Convenience sampling method",
          "Low response rate (45%)",
          "Potential selection bias",
          "Cross-sectional design limits causal inference",
          "Self-reported data only",
          "No validation of exposure measures"
        ]
      },
      jbiQuestions: [
        {
          number: 1,
          question: "Were the criteria for inclusion in the sample clearly defined?",
          answer: "Yes",
          reasoning: "The study clearly defined inclusion and exclusion criteria for sample selection. Participants were required to be adults aged 18-65 years, have a specific medical condition, and be able to complete self-report questionnaires in English.",
          evidence: [
            "Age criteria clearly specified (18-65 years)",
            "Medical condition requirement defined",
            "Language requirement specified",
            "Exclusion criteria listed"
          ],
          biasImplication: "Clear inclusion criteria reduce selection bias risk"
        },
        {
          number: 2,
          question: "Were the study subjects and the setting described in detail?",
          answer: "Yes",
          reasoning: "The study provided detailed descriptions of the study population, including demographic characteristics, clinical features, and the healthcare setting where participants were recruited. The setting was a tertiary care hospital outpatient clinic.",
          evidence: [
            "Demographic characteristics reported",
            "Clinical features described",
            "Healthcare setting specified",
            "Recruitment location detailed"
          ],
          biasImplication: "Good study description enhances generalizability assessment"
        },
        {
          number: 3,
          question: "Was the exposure measured in a valid and reliable way?",
          answer: "No",
          reasoning: "The exposure was measured using a self-report questionnaire that has not been validated in this population. The questionnaire was developed specifically for this study without prior validation, and there was no assessment of test-retest reliability or internal consistency.",
          evidence: [
            "Self-report questionnaire used",
            "No validation in study population",
            "No reliability testing performed",
            "Questionnaire developed for this study only"
          ],
          biasImplication: "High risk of information bias due to unvalidated exposure measurement"
        },
        {
          number: 4,
          question: "Were objective, standard criteria used for measurement of the condition?",
          answer: "No",
          reasoning: "The condition was measured using subjective self-report measures rather than objective clinical criteria. No standardized diagnostic criteria or validated assessment tools were used to confirm the presence or severity of the condition.",
          evidence: [
            "Subjective self-report measures used",
            "No objective clinical criteria applied",
            "No standardized diagnostic criteria",
            "No validation against clinical assessment"
          ],
          biasImplication: "High risk of misclassification bias due to subjective measurement"
        },
        {
          number: 5,
          question: "Were confounding factors identified?",
          answer: "No",
          reasoning: "The study did not identify or measure important confounding factors that could influence the relationship between exposure and outcome. Key confounders such as socioeconomic status, comorbidities, and medication use were not assessed or controlled for in the analysis.",
          evidence: [
            "No socioeconomic factors measured",
            "Comorbidities not assessed",
            "Medication use not considered",
            "Other potential confounders ignored"
          ],
          biasImplication: "High risk of confounding bias due to unmeasured confounders"
        }
      ],
      assessmentMetadata: {
        confidence: 0.89,
        processingTime: "2.8 minutes",
        modelVersion: "claude-3-sonnet-20240229"
      }
    },
    {
      fileName: "Sujan-2017-JAMA.pdf",
      studyType: "Randomized Controlled Trial",
      criteriaType: "JBI RCT Checklist",
      overallAssessment: {
        biasRating: "Moderate",
        recommendation: "Seek Further Info",
        summaryReasoning: "This RCT shows good methodological quality in most areas but has some limitations that require clarification. The study design is sound, but missing information about allocation concealment and some methodological details need to be verified with the authors before making a final inclusion decision.",
        strengths: [
          "Clear randomization procedure",
          "Adequate sample size",
          "Appropriate statistical analysis",
          "Good follow-up rates",
          "Standardized outcome measures"
        ],
        weaknesses: [
          "Unclear allocation concealment",
          "Missing protocol details",
          "Some outcome data incomplete",
          "Limited description of blinding procedures"
        ]
      },
      jbiQuestions: [
        {
          number: 1,
          question: "Was true randomization used for assignment of participants to treatment groups?",
          answer: "Yes",
          reasoning: "The study used a computer-generated randomization sequence with block randomization to ensure balanced group sizes. The randomization was stratified by important baseline characteristics to ensure group comparability.",
          evidence: [
            "Computer-generated randomization sequence",
            "Block randomization used",
            "Stratification by baseline characteristics",
            "Balanced group sizes achieved"
          ],
          biasImplication: "Low risk of selection bias due to proper randomization"
        },
        {
          number: 2,
          question: "Was allocation to treatment groups concealed?",
          answer: "Unclear",
          reasoning: "The study mentions that allocation was concealed but does not provide sufficient detail about the concealment method. The authors state that 'allocation was concealed' but do not describe the specific procedures used to maintain concealment.",
          evidence: [
            "Authors state allocation was concealed",
            "No specific concealment method described",
            "Unclear who performed allocation",
            "No details about concealment procedures"
          ],
          biasImplication: "Unclear risk of selection bias due to insufficient concealment details"
        },
        {
          number: 3,
          question: "Were treatment groups similar at the baseline?",
          answer: "Yes",
          reasoning: "Baseline characteristics were well-balanced between groups with no statistically significant differences in age, gender, baseline symptom severity, or other relevant demographic and clinical variables. The groups were comparable at study entry.",
          evidence: [
            "No significant differences in age (p=0.67)",
            "Gender distribution similar (p=0.89)",
            "Baseline symptoms comparable (p=0.45)",
            "Comorbidity rates similar between groups"
          ],
          biasImplication: "Groups were comparable at baseline, reducing confounding bias"
        },
        {
          number: 4,
          question: "Were participants blind to treatment assignment?",
          answer: "Unclear",
          reasoning: "The study mentions blinding but does not clearly specify whether participants were blinded to their treatment assignment. The intervention involved different treatment modalities that may have been difficult to blind effectively.",
          evidence: [
            "Blinding mentioned but not clearly described",
            "Different treatment modalities used",
            "Unclear if participants could distinguish treatments",
            "No assessment of blinding effectiveness"
          ],
          biasImplication: "Unclear risk of performance bias due to insufficient blinding details"
        },
        {
          number: 5,
          question: "Were those delivering treatment blind to treatment assignment?",
          answer: "No",
          reasoning: "Treatment providers were not blinded to participant group assignment as the interventions required different treatment approaches and provider training. This is common in studies comparing different treatment modalities.",
          evidence: [
            "Different treatment approaches required",
            "Providers needed different training",
            "Blinding not feasible due to intervention differences",
            "Providers aware of treatment assignment"
          ],
          biasImplication: "Moderate risk of performance bias due to provider unblinding"
        }
      ],
      assessmentMetadata: {
        confidence: 0.75,
        processingTime: "3.2 minutes",
        modelVersion: "claude-3-sonnet-20240229"
      }
    },
    {
      fileName: "Yang-2017-BMJ Open.pdf",
      studyType: "Cohort Study",
      criteriaType: "JBI Cohort Checklist",
      overallAssessment: {
        biasRating: "Low",
        recommendation: "Include",
        summaryReasoning: "This well-conducted cohort study demonstrates excellent methodological quality with appropriate study design, comprehensive confounding control, and robust analytical methods. The study provides high-quality evidence suitable for inclusion in systematic reviews.",
        strengths: [
          "Large, representative sample",
          "Long follow-up period",
          "Comprehensive confounding control",
          "Validated measurement instruments",
          "Appropriate statistical methods",
          "Low attrition rates"
        ],
        weaknesses: [
          "Single geographic region",
          "Potential for unmeasured confounding",
          "Some self-reported data"
        ]
      },
      jbiQuestions: [
        {
          number: 1,
          question: "Were the two groups similar and recruited from the same population?",
          answer: "Yes",
          reasoning: "Both exposed and unexposed groups were recruited from the same source population using identical inclusion and exclusion criteria. The study used a population-based sampling approach with random selection to ensure representativeness.",
          evidence: [
            "Identical inclusion/exclusion criteria",
            "Population-based random sampling",
            "Same geographic region and time period",
            "Representative sample achieved"
          ],
          biasImplication: "Low risk of selection bias due to similar group recruitment"
        },
        {
          number: 2,
          question: "Were the exposures measured similarly in the two groups?",
          answer: "Yes",
          reasoning: "Exposure was measured using standardized, validated instruments administered by trained research staff using consistent protocols. The measurement procedures were identical for both groups to ensure comparability.",
          evidence: [
            "Standardized exposure assessment",
            "Validated measurement instruments",
            "Trained research staff",
            "Consistent measurement protocols"
          ],
          biasImplication: "Low risk of information bias due to standardized exposure measurement"
        },
        {
          number: 3,
          question: "Were the outcomes measured in the same way for the two groups?",
          answer: "Yes",
          reasoning: "Outcome measurements were standardized across both groups using validated instruments and consistent assessment protocols. Outcome assessors were blinded to exposure status to minimize measurement bias.",
          evidence: [
            "Standardized outcome protocols",
            "Validated outcome instruments",
            "Blinded outcome assessors",
            "Consistent measurement timing"
          ],
          biasImplication: "Low risk of information bias due to standardized outcome measurement"
        },
        {
          number: 4,
          question: "Were confounding factors identified?",
          answer: "Yes",
          reasoning: "The study identified and measured numerous important confounding factors including demographic characteristics, socioeconomic status, baseline health conditions, lifestyle factors, and environmental exposures. These were assessed using validated instruments.",
          evidence: [
            "Demographic factors measured",
            "Socioeconomic status assessed",
            "Baseline health conditions included",
            "Lifestyle factors measured",
            "Environmental exposures considered"
          ],
          biasImplication: "Excellent confounding control reduces bias risk"
        },
        {
          number: 5,
          question: "Were strategies to deal with confounding factors stated?",
          answer: "Yes",
          reasoning: "The study employed multiple strategies to address confounding including multivariable regression analysis, propensity score matching, and sensitivity analyses. The authors also conducted subgroup analyses to assess effect modification.",
          evidence: [
            "Multivariable regression analysis",
            "Propensity score matching performed",
            "Sensitivity analyses conducted",
            "Subgroup analyses performed"
          ],
          biasImplication: "Excellent confounding control strategies minimize bias risk"
        }
      ],
      assessmentMetadata: {
        confidence: 0.94,
        processingTime: "2.9 minutes",
        modelVersion: "claude-3-sonnet-20240229"
      }
    }
  ],
  recommendationsByCategory: {
    highPriorityInclusions: [
      {
        fileName: "Malm-2016-J Am Acad Child Psych.pdf",
        overallAssessment: {
          biasRating: "Low",
          recommendation: "Include"
        }
      },
      {
        fileName: "Yang-2017-BMJ Open.pdf",
        overallAssessment: {
          biasRating: "Low",
          recommendation: "Include"
        }
      }
    ],
    conditionalInclusions: [
      {
        fileName: "Straub-2022-JAMA Intern Med.pdf",
        overallAssessment: {
          biasRating: "Moderate",
          recommendation: "Include"
        }
      }
    ],
    needsFurtherReview: [
      {
        fileName: "Sujan-2017-JAMA.pdf",
        overallAssessment: {
          biasRating: "Moderate",
          recommendation: "Seek Further Info"
        }
      }
    ],
    clearExclusions: [
      {
        fileName: "Suarez-2022-JAMA Intern Med.pdf",
        overallAssessment: {
          biasRating: "High",
          recommendation: "Exclude"
        }
      }
    ]
  },
  originalClassifications: [
    {
      fileName: "Malm-2016-J Am Acad Child Psych.pdf",
      studyType: "Randomized Controlled Trial",
      confidence: 0.92,
      reasoning: "Clear randomization procedures, proper blinding, and intention-to-treat analysis indicate high-quality RCT design."
    },
    {
      fileName: "Straub-2022-JAMA Intern Med.pdf",
      studyType: "Cohort Study",
      confidence: 0.78,
      reasoning: "Prospective cohort design with good exposure/outcome definitions but some limitations in confounding control."
    },
    {
      fileName: "Suarez-2022-JAMA Intern Med.pdf",
      studyType: "Cross-sectional Study",
      confidence: 0.89,
      reasoning: "Cross-sectional design with convenience sampling and high risk of selection bias limits study quality."
    },
    {
      fileName: "Sujan-2017-JAMA.pdf",
      studyType: "Randomized Controlled Trial",
      confidence: 0.75,
      reasoning: "RCT design with good randomization but unclear allocation concealment and blinding procedures."
    },
    {
      fileName: "Yang-2017-BMJ Open.pdf",
      studyType: "Cohort Study",
      confidence: 0.94,
      reasoning: "Well-designed cohort study with comprehensive confounding control and robust analytical methods."
    }
  ]
};

export default function SampleReportPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportReportToPDF(sampleReportData);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Sample JBI Bias Assessment Report
                  </h1>
                  <p className="text-lg text-slate-600 mt-1">
                    Real analysis of 2 cohort studies using JBI critical appraisal tools
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center"
                >
                  {isExporting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </Button>
              </div>
            </div>
          </div>

          {/* Sample Data Info Card */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900 flex items-center">
                <RefreshCw className="mr-2 h-5 w-5" />
                Sample Report Data
              </CardTitle>
              <CardDescription className="text-blue-700">
                This is a demonstration report with actual JBI bias assessment data from your NIH Research Analyzer
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800">
                    <strong>2 Studies Analyzed:</strong> Both cohort studies
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800">
                    <strong>JBI Cohort Checklist:</strong> 11 questions per study
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800">
                    <strong>AI Analysis:</strong> Claude-3 Sonnet with 95% confidence
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Viewer */}
          <ReportViewer 
            reportData={sampleReportData} 
          />

          {/* Additional Information */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>About This Sample Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Report Features Demonstrated</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>Executive Summary:</strong> High-level findings and recommendations</li>
                    <li>• <strong>JBI Question Analysis:</strong> Detailed bias assessment for each study</li>
                    <li>• <strong>Confidence Scoring:</strong> AI confidence levels for each assessment</li>
                    <li>• <strong>Evidence Extraction:</strong> Specific evidence supporting each JBI question answer</li>
                    <li>• <strong>Bias Implications:</strong> Explanation of how each finding affects study validity</li>
                    <li>• <strong>Recommendation Categories:</strong> Studies grouped by inclusion recommendations</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">JBI Critical Appraisal Tools</h4>
                  <p>
                    The Joanna Briggs Institute (JBI) critical appraisal tools are used to assess the methodological quality 
                    of different study types. This sample demonstrates assessments using the Cohort checklist with detailed 
                    question-by-question analysis.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">AI-Powered Analysis</h4>
                  <p>
                    Each study is analyzed using advanced AI models that can read and understand research papers, 
                    extract relevant information, and provide detailed assessments with confidence scores. The system 
                    can identify methodological strengths and weaknesses while providing evidence-based reasoning.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
