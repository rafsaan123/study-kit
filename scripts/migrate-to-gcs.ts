/**
 * Migration script to help transition from local file storage to Google Cloud Storage
 * This script can be used to identify content with local file attachments
 */

import { connectDB } from '../app/lib/mongodb';
import { Content } from '../app/models/Content';

async function migrateToGCS() {
  try {
    await connectDB();
    
    // Find all content with local file attachments
    const contentsWithLocalFiles = await Content.find({
      'attachments.fileUrl': { $regex: '^/uploads/' }
    });

    console.log(`Found ${contentsWithLocalFiles.length} content items with local file attachments:`);
    
    for (const content of contentsWithLocalFiles) {
      console.log(`\nContent ID: ${content._id}`);
      console.log(`Title: ${content.title}`);
      console.log(`Attachments:`);
      
      content.attachments.forEach((attachment: any, index: number) => {
        console.log(`  ${index + 1}. ${attachment.fileName}`);
        console.log(`     URL: ${attachment.fileUrl}`);
        console.log(`     Type: ${attachment.fileType}`);
      });
    }

    if (contentsWithLocalFiles.length === 0) {
      console.log('No content with local file attachments found. Migration not needed.');
    } else {
      console.log('\n⚠️  Migration Required:');
      console.log('1. Re-upload files through the new GCS system');
      console.log('2. Update content with new GCS URLs');
      console.log('3. Remove old local files from public/uploads/');
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    process.exit(0);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToGCS();
}

export { migrateToGCS };
