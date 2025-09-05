import { NextRequest, NextResponse } from 'next/server';
import { SFNClient, DescribeExecutionCommand } from '@aws-sdk/client-sfn';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize AWS clients
const sfnClient = new SFNClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const executionArn = searchParams.get('executionArn');

    if (!sessionId && !executionArn) {
      return NextResponse.json(
        { error: 'Either sessionId or executionArn is required' },
        { status: 400 }
      );
    }

    // If we have sessionId but no executionArn, we need to find the execution
    let executionArnToCheck = executionArn;
    if (sessionId && !executionArn) {
      // For now, we'll construct the execution ARN based on the sessionId
      // This assumes the execution name matches the sessionId
      const stateMachineArn = process.env.STEP_FUNCTION_ARN;
      if (!stateMachineArn) {
        return NextResponse.json(
          { error: 'Step Function ARN not configured' },
          { status: 500 }
        );
      }
      
      // Extract account ID and region from state machine ARN
      const arnParts = stateMachineArn.split(':');
      const accountId = arnParts[4];
      const region = arnParts[3];
      const stateMachineName = arnParts[6];
      
      executionArnToCheck = `arn:aws:states:${region}:${accountId}:execution:${stateMachineName}:${sessionId}`;
    }

    // Get execution status
    const describeCommand = new DescribeExecutionCommand({
      executionArn: executionArnToCheck!,
    });

    const execution = await sfnClient.send(describeCommand);
    
    // Parse the execution status and determine our analysis phase
    const status = execution.status;
    const input = execution.input ? JSON.parse(execution.input) : {};
    const output = execution.output ? JSON.parse(execution.output) : null;

    // Determine the current phase based on execution status and state
    let currentPhase = 'unknown';
    let phaseProgress = 0;
    let phaseDescription = '';
    let isComplete = false;
    let hasError = false;
    let errorMessage = '';

    if (status === 'RUNNING') {
      // Try to determine current phase from execution history or state
      // For now, we'll use a simple heuristic based on execution time
      const startTime = execution.startDate?.getTime() || 0;
      const currentTime = Date.now();
      const elapsedMinutes = (currentTime - startTime) / (1000 * 60);

      if (elapsedMinutes < 2) {
        currentPhase = 'pdf_processing';
        phaseProgress = Math.min(90, (elapsedMinutes / 2) * 100);
        phaseDescription = 'Processing PDF documents and extracting text...';
      } else if (elapsedMinutes < 5) {
        currentPhase = 'study_classification';
        phaseProgress = Math.min(90, ((elapsedMinutes - 2) / 3) * 100);
        phaseDescription = 'Classifying study types using AI...';
      } else {
        currentPhase = 'bias_analysis';
        phaseProgress = Math.min(90, ((elapsedMinutes - 5) / 10) * 100);
        phaseDescription = 'Performing JBI bias analysis...';
      }
    } else if (status === 'SUCCEEDED') {
      isComplete = true;
      currentPhase = 'completed';
      phaseProgress = 100;
      phaseDescription = 'Analysis completed successfully!';
    } else if (status === 'FAILED') {
      hasError = true;
      currentPhase = 'failed';
      phaseProgress = 0;
      phaseDescription = 'Analysis failed';
      errorMessage = execution.error || 'Unknown error occurred';
    } else if (status === 'TIMED_OUT') {
      hasError = true;
      currentPhase = 'timeout';
      phaseProgress = 0;
      phaseDescription = 'Analysis timed out';
      errorMessage = 'The analysis took too long to complete';
    } else if (status === 'ABORTED') {
      hasError = true;
      currentPhase = 'aborted';
      phaseProgress = 0;
      phaseDescription = 'Analysis was aborted';
      errorMessage = 'The analysis was manually aborted';
    }

    // Try to get additional results from S3 if available
    let additionalResults = null;
    if (isComplete && sessionId) {
      try {
        const s3BucketName = process.env.S3_BUCKET_NAME;
        if (s3BucketName) {
          // Try to get the final report
          try {
            const reportKey = `${sessionId}/analysis/jbi_bias_assessment_report.json`;
            const reportCommand = new GetObjectCommand({
              Bucket: s3BucketName,
              Key: reportKey,
            });
            const reportResponse = await s3Client.send(reportCommand);
            const reportData = await reportResponse.Body?.transformToString();
            if (reportData) {
              additionalResults = {
                finalReport: JSON.parse(reportData),
                reportLocation: `s3://${s3BucketName}/${reportKey}`,
              };
            }
          } catch {
            // Report not ready yet, that's okay
            console.log('Final report not yet available');
          }

          // Try to get classification results
          try {
            const classificationKey = `${sessionId}/analysis/study_classifications.json`;
            const classificationCommand = new GetObjectCommand({
              Bucket: s3BucketName,
              Key: classificationKey,
            });
            const classificationResponse = await s3Client.send(classificationCommand);
            const classificationData = await classificationResponse.Body?.transformToString();
            if (classificationData) {
              additionalResults = {
                ...additionalResults,
                classifications: JSON.parse(classificationData),
                classificationLocation: `s3://${s3BucketName}/${classificationKey}`,
              };
            }
          } catch {
            // Classifications not ready yet, that's okay
            console.log('Classification results not yet available');
          }
        }
      } catch (s3Error) {
        console.log('Could not fetch additional results from S3:', s3Error);
      }
    }

    return NextResponse.json({
      sessionId: sessionId || input.sessionId,
      executionArn: executionArnToCheck,
      status,
      currentPhase,
      phaseProgress: Math.round(phaseProgress),
      phaseDescription,
      isComplete,
      hasError,
      errorMessage,
      startTime: execution.startDate?.toISOString(),
      endTime: execution.stopDate?.toISOString(),
      input: {
        fileCount: input.files?.length || 0,
        files: input.files || [],
      },
      output: output,
      additionalResults,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: unknown) {
    console.error('Status check error:', error);
    
    let errorMessage = 'Failed to check analysis status';
    
    if (error instanceof Error) {
      if (error.name === 'ExecutionDoesNotExist') {
        errorMessage = 'Analysis session not found';
      } else if (error.name === 'AccessDeniedException') {
        errorMessage = 'Access denied. Please check your AWS credentials.';
      } else if (error.name === 'InvalidParameterValueException') {
        errorMessage = 'Invalid execution ARN provided';
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        hasError: true,
        currentPhase: 'error',
        phaseProgress: 0,
        phaseDescription: errorMessage,
      },
      { status: 500 }
    );
  }
}
