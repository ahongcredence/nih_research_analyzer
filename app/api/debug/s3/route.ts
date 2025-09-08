import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.REGION || 'us-east-1',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const prefix = searchParams.get('prefix') || '';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const s3BucketName = process.env.S3_BUCKET_NAME || 'nih-uploaded-docs';
    
    // List all objects with the session ID
    const listCommand = new ListObjectsV2Command({
      Bucket: s3BucketName,
      Prefix: prefix || sessionId,
      MaxKeys: 100
    });
    
    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];
    
    // Filter for JSON files that might be reports
    const reportFiles = objects.filter(obj => 
      obj.Key?.endsWith('.json') && 
      (obj.Key.includes('jbi') || obj.Key.includes('report') || obj.Key.includes('analysis'))
    );
    
    // Get all objects for debugging
    const allObjects = objects.map(obj => ({
      key: obj.Key,
      lastModified: obj.LastModified?.toISOString(),
      size: obj.Size,
      isReport: obj.Key?.endsWith('.json') && 
               (obj.Key.includes('jbi') || obj.Key.includes('report') || obj.Key.includes('analysis'))
    }));

    return NextResponse.json({
      success: true,
      sessionId,
      bucket: s3BucketName,
      prefix: prefix || sessionId,
      totalObjects: objects.length,
      reportFiles: reportFiles.map(obj => ({
        key: obj.Key,
        lastModified: obj.LastModified?.toISOString(),
        size: obj.Size
      })),
      allObjects,
      searchPrefix: prefix || sessionId
    });

  } catch (error: unknown) {
    console.error('S3 debug error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to list S3 objects',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
