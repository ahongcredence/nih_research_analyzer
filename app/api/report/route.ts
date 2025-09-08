import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.REGION || 'us-east-1',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const reportKey = searchParams.get('reportKey');

    if (!sessionId && !reportKey) {
      return NextResponse.json(
        { error: 'Either sessionId or reportKey is required' },
        { status: 400 }
      );
    }

    const s3BucketName = process.env.S3_BUCKET_NAME || 'nih-uploaded-docs';
    let finalReportKey = reportKey;

    // If we have sessionId but no reportKey, try to find the report
    if (sessionId && !reportKey) {
      // Try to find the report by listing objects in the reports directory
      try {
        const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        const listCommand = new ListObjectsV2Command({
          Bucket: s3BucketName,
          Prefix: `reports/${sessionId}/`,
          MaxKeys: 10
        });
        
        const listResponse = await s3Client.send(listCommand);
        const reportObjects = listResponse.Contents?.filter(obj => 
          obj.Key?.endsWith('.json') && 
          (obj.Key.includes('final_jbi_report') || obj.Key.includes('jbi_bias_assessment'))
        ) || [];
        
        if (reportObjects.length > 0) {
          // Sort by LastModified to get the most recent report
          reportObjects.sort((a, b) => 
            (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)
          );
          finalReportKey = reportObjects[0].Key!;
          console.log(`Found report at: ${finalReportKey}`);
        } else {
          // Fallback to common locations
          const fallbackKeys = [
            `reports/${sessionId}/final_jbi_report.json`,
            `${sessionId}/analysis/jbi_bias_assessment_report.json`,
            `${sessionId}/analysis/final_jbi_report.json`,
            `${sessionId}/jbi_bias_assessment_report.json`
          ];
          
          // Try each fallback location
          for (const key of fallbackKeys) {
            try {
              const testCommand = new GetObjectCommand({
                Bucket: s3BucketName,
                Key: key,
              });
              await s3Client.send(testCommand);
              finalReportKey = key;
              console.log(`Found report at fallback location: ${finalReportKey}`);
              break;
            } catch (error) {
              // Continue to next location
              continue;
            }
          }
        }
      } catch (listError) {
        console.log('Could not list objects, trying fallback locations:', listError);
        // Fallback to hardcoded location
        finalReportKey = `reports/${sessionId}/final_jbi_report.json`;
      }
    }

    if (!finalReportKey) {
      return NextResponse.json(
        { error: 'No report key provided' },
        { status: 400 }
      );
    }

    try {
      const reportCommand = new GetObjectCommand({
        Bucket: s3BucketName,
        Key: finalReportKey,
      });
      
      const reportResponse = await s3Client.send(reportCommand);
      const reportData = await reportResponse.Body?.transformToString();
      
      if (!reportData) {
        return NextResponse.json(
          { error: 'Report data is empty' },
          { status: 404 }
        );
      }

      const parsedReport = JSON.parse(reportData);
      
      // Validate that this is a JBI bias assessment report
      if (!parsedReport.reportMetadata || !parsedReport.reportMetadata.reportType?.includes('jbi')) {
        return NextResponse.json(
          { error: 'Invalid report format - not a JBI bias assessment report' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        report: parsedReport,
        reportLocation: `s3://${s3BucketName}/${finalReportKey}`,
        lastModified: reportResponse.LastModified?.toISOString(),
        contentLength: reportResponse.ContentLength,
      });

    } catch (s3Error: any) {
      console.error('S3 error:', s3Error);
      console.error('Attempted to fetch report from:', finalReportKey);
      console.error('S3 Bucket:', s3BucketName);
      
      if (s3Error.name === 'NoSuchKey') {
        return NextResponse.json(
          { 
            error: 'Report not found at the specified location',
            details: `Report not found at s3://${s3BucketName}/${finalReportKey}`,
            sessionId: sessionId,
            attemptedKey: finalReportKey
          },
          { status: 404 }
        );
      } else if (s3Error.name === 'AccessDenied') {
        return NextResponse.json(
          { error: 'Access denied to the report' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { 
            error: 'Failed to fetch report from S3',
            details: s3Error.message,
            sessionId: sessionId,
            attemptedKey: finalReportKey
          },
          { status: 500 }
        );
      }
    }

  } catch (error: unknown) {
    console.error('Report fetch error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint to trigger report generation (if needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reportType = 'jbi_bias_assessment' } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // This could trigger a report generation if needed
    // For now, we'll just return a success message
    return NextResponse.json({
      success: true,
      message: 'Report generation triggered',
      sessionId,
      reportType,
    });

  } catch (error: unknown) {
    console.error('Report generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to trigger report generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
