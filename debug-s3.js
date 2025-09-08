// Debug script to help troubleshoot S3 report location issues
// Run this with: node debug-s3.js

const sessionId = 'pdf-job-1757344723352-ojcffknpm'; // Replace with your actual session ID

console.log('🔍 Debugging S3 Report Location');
console.log('================================');
console.log(`Session ID: ${sessionId}`);
console.log('');

// Test the debug endpoint
async function debugS3() {
  try {
    const response = await fetch(`http://localhost:3000/api/debug/s3?sessionId=${sessionId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ S3 Debug Results:');
      console.log(`Bucket: ${data.bucket}`);
      console.log(`Search Prefix: ${data.searchPrefix}`);
      console.log(`Total Objects: ${data.totalObjects}`);
      console.log('');
      
      if (data.reportFiles.length > 0) {
        console.log('📄 Report Files Found:');
        data.reportFiles.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.key}`);
          console.log(`     Last Modified: ${file.lastModified}`);
          console.log(`     Size: ${file.size} bytes`);
          console.log('');
        });
      } else {
        console.log('❌ No report files found');
        console.log('');
      }
      
      if (data.allObjects.length > 0) {
        console.log('📁 All Objects in Session Directory:');
        data.allObjects.forEach((obj, index) => {
          const status = obj.isReport ? '📄 REPORT' : '📁 FILE';
          console.log(`  ${index + 1}. ${status} ${obj.key}`);
          console.log(`     Last Modified: ${obj.lastModified}`);
          console.log(`     Size: ${obj.size} bytes`);
          console.log('');
        });
      } else {
        console.log('❌ No objects found in session directory');
      }
      
    } else {
      console.log('❌ Debug failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error running debug:', error.message);
  }
}

// Test the report API
async function testReportAPI() {
  try {
    console.log('🧪 Testing Report API...');
    const response = await fetch(`http://localhost:3000/api/report?sessionId=${sessionId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Report API Success:');
      console.log(`Report Location: ${data.reportLocation}`);
      console.log(`Last Modified: ${data.lastModified}`);
      console.log(`Content Length: ${data.contentLength} bytes`);
    } else {
      console.log('❌ Report API Failed:');
      console.log(`Error: ${data.error}`);
      console.log(`Details: ${data.details}`);
      if (data.attemptedKey) {
        console.log(`Attempted Key: ${data.attemptedKey}`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing report API:', error.message);
  }
}

// Run the debug
async function runDebug() {
  await debugS3();
  console.log('');
  await testReportAPI();
}

runDebug();
