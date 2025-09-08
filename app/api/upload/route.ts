import { NextRequest, NextResponse } from 'next/server';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Initialize AWS clients - use IAM role automatically (no explicit credentials)
const region = process.env.AWS_REGION || process.env.REGION || 'us-east-1';

const sfnClient = new SFNClient({
  region: region,
});

const s3Client = new S3Client({
  region: region,
});

export async function POST(request: NextRequest) {
  try {
    // Debug environment configuration
    console.log('Environment Configuration:', {
      region: region,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'nih-uploaded-docs' ? 'SET' : 'MISSING',
      STEP_FUNCTION_ARN: process.env.STEP_FUNCTION_ARN || 'arn:aws:states:us-east-1:153717966029:stateMachine:nih_pdf_intake' ? 'SET' : 'MISSING',
      AWS_REGION: process.env.AWS_REGION || 'us-east-1' || 'NOT_SET',
      REGION: process.env.REGION || 'us-east-1' || 'NOT_SET',
      usingIAMRole: true,
    });

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Use environment variable for max files
    const maxFiles = parseInt(process.env.NEXT_PUBLIC_MAX_FILES || '50');
    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files allowed` },
        { status: 400 }
      );
    }

    // Get S3 bucket name
    const s3BucketName = process.env.S3_BUCKET_NAME || 'nih-uploaded-docs';
    if (!s3BucketName) {
      return NextResponse.json(
        { error: 'S3 bucket not configured. Please set S3_BUCKET_NAME environment variable.' },
        { status: 500 }
      );
    }

    console.log(`Using S3 bucket: ${s3BucketName}`);

    // Generate session ID
    const sessionId = `pdf-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Generated session ID: ${sessionId}`);
    
    // Upload files to S3 first
    const uploadedFiles = [];
    const uploadErrors = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      console.log(`Processing file ${i}: ${file.name} (${file.size} bytes)`);
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: `File ${file.name} is not a PDF` },
          { status: 400 }
        );
      }

      // Use environment variable for max file size
      const maxFileSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'); // 10MB default
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is ${maxSizeMB}MB` },
          { status: 400 }
        );
      }

      // Upload to S3 with organized structure
      const buffer = await file.arrayBuffer();
      const s3Key = `${sessionId}/input/document_${i}_${file.name}`;
      
      console.log(`Uploading to S3: ${s3Key}`);
      
      const uploadCommand = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: s3Key,
        Body: new Uint8Array(buffer),
        ContentType: file.type,
        Metadata: {
          sessionId,
          originalFilename: file.name,
          fileIndex: i.toString(),
          uploadTimestamp: new Date().toISOString(),
        },
      });

      try {
        const uploadResult = await s3Client.send(uploadCommand);
        console.log(`✓ Successfully uploaded ${file.name} to S3: ${s3Key}`);
        console.log(`Upload result:`, uploadResult);
        
        // Verify the upload by checking if the object exists
        try {
          const headCommand = new HeadObjectCommand({
            Bucket: s3BucketName,
            Key: s3Key,
          });
          const headResult = await s3Client.send(headCommand);
          console.log(`✓ Verified upload: ${s3Key} (${headResult.ContentLength} bytes)`);
        } catch (verifyError) {
          console.error(`✗ Failed to verify upload: ${s3Key}`, verifyError);
          uploadErrors.push(`Failed to verify upload of ${file.name}`);
          continue;
        }
        
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          s3Key: s3Key,
          index: i,
        });
        
      } catch (s3Error: unknown) {
        console.error(`✗ Failed to upload ${file.name} to S3:`, s3Error);
        console.error('S3 Error details:', {
          name: s3Error instanceof Error ? s3Error.name : 'Unknown',
          message: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error',
          stack: s3Error instanceof Error ? s3Error.stack : undefined,
          code: (s3Error as { code?: string })?.code,
          statusCode: (s3Error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode,
          requestId: (s3Error as { $metadata?: { requestId?: string } })?.$metadata?.requestId,
        });
        
        const errorMessage = s3Error instanceof Error ? s3Error.message : 'Unknown S3 error';
        uploadErrors.push(`Failed to upload ${file.name}: ${errorMessage}`);
        
        // Return immediately if any upload fails
        const errorDetails = s3Error instanceof Error ? s3Error.message : 'Unknown S3 error';
        const errorCode = s3Error instanceof Error ? s3Error.name : 'UnknownError';
        
        return NextResponse.json(
          { 
            error: `S3 upload failed for ${file.name}`,
            details: errorDetails,
            code: errorCode,
            sessionId,
            debugInfo: {
              region: region,
              bucket: s3BucketName,
              s3Key: s3Key,
              fileSize: file.size,
              fileType: file.type,
            }
          },
          { status: 500 }
        );
      }
    }

    // Check if any uploads failed
    if (uploadErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some files failed to upload',
          uploadErrors,
          sessionId
        },
        { status: 500 }
      );
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No files were successfully uploaded to S3', sessionId },
        { status: 500 }
      );
    }

    console.log(`✓ All ${uploadedFiles.length} files uploaded successfully`);

    // Use Step Function ARN from environment
    const stateMachineArn = process.env.STEP_FUNCTION_ARN || 'arn:aws:states:us-east-1:153717966029:stateMachine:nih_pdf_intake';
    if (!stateMachineArn) {
      return NextResponse.json(
        { error: 'Step Function ARN not configured. Please set STEP_FUNCTION_ARN environment variable.' },
        { status: 500 }
      );
    }

    // Prepare input for the state machine (matches new Step Functions definition)
    const executionInput = {
      sessionId,
      s3Bucket: s3BucketName,
      files: uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        s3Key: file.s3Key,
        index: file.index,
      })),
      timestamp: new Date().toISOString(),
    };

    // Log the input size to verify it's under 256KB
    const inputSize = JSON.stringify(executionInput).length;
    console.log(`Step Functions input size: ${inputSize} bytes (${(inputSize/1024).toFixed(2)}KB)`);
    
    if (inputSize > 256000) { // 256KB limit
      return NextResponse.json(
        { error: 'Input payload too large for Step Functions. Please reduce number of files or filename length.' },
        { status: 400 }
      );
    }

    const startExecutionCommand = new StartExecutionCommand({
      stateMachineArn,
      name: sessionId, // This becomes the execution name
      input: JSON.stringify(executionInput),
    });

    console.log('Starting Step Functions execution:', {
      stateMachineArn,
      sessionId,
      fileCount: uploadedFiles.length,
      inputSizeKB: (inputSize/1024).toFixed(2)
    });

    const execution = await sfnClient.send(startExecutionCommand);

    return NextResponse.json({
      success: true,
      sessionId,
      executionArn: execution.executionArn,
      files: uploadedFiles.map(f => ({ 
        name: f.name, 
        size: f.size,
        s3Key: f.s3Key,
        index: f.index
      })),
      message: 'Files uploaded to S3 and PDF processing started successfully',
      s3Locations: {
        input: `s3://${s3BucketName}/${sessionId}/input/`,
        output: `s3://${s3BucketName}/${sessionId}/output/`,
        summary: `s3://${s3BucketName}/${sessionId}/job_summary.json`
      },
      inputSizeBytes: inputSize,
      debug: {
        uploadedFileCount: uploadedFiles.length,
        uploadErrors: uploadErrors.length,
        s3Bucket: s3BucketName,
        region: region,
        usingIAMRole: true,
      }
    });

  } catch (error: unknown) {
    console.error('Processing error:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to start PDF processing';
    
    if (error instanceof Error) {
      if (error.name === 'InvalidParameterValueException') {
        errorMessage = 'Invalid Step Function configuration. Please check your ARN.';
      } else if (error.name === 'AccessDeniedException') {
        errorMessage = 'Access denied. Please check your IAM role permissions for S3 and Step Functions.';
      } else if (error.name === 'CredentialsProviderError') {
        errorMessage = 'AWS credentials not found. Please ensure IAM role is properly attached to Amplify.';
      } else if (error.name === 'NoSuchBucket') {
        errorMessage = 'S3 bucket does not exist. Please create the bucket first.';
      } else if ('code' in error && error.code === 'AccessDenied') {
        errorMessage = 'Access denied to S3 bucket. Please check your IAM role permissions.';
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        code: (error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : 'UnknownCode'),
        sessionId: null,
        debugInfo: {
          region: region,
          usingIAMRole: true,
          environmentVars: {
            AWS_REGION: process.env.AWS_REGION ? 'SET' : 'MISSING',
            REGION: process.env.REGION ? 'SET' : 'MISSING',
            S3_BUCKET_NAME: process.env.S3_BUCKET_NAME ? 'SET' : 'MISSING',
            STEP_FUNCTION_ARN: process.env.STEP_FUNCTION_ARN ? 'SET' : 'MISSING',
          }
        }
      },
      { status: 500 }
    );
  }
}