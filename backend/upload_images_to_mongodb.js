require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
const { MongoClient, GridFSBucket } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in environment');
  process.exit(1);
}

async function uploadImages() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    const imagesDir = path.join(__dirname, '..', 'assets', 'images');
    const files = await fs.promises.readdir(imagesDir);

    for (const fileName of files) {
      const filePath = path.join(imagesDir, fileName);
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) continue;
      // Only upload image files (common extensions)
      if (!fileName.match(/\.(jpe?g|png)$/i)) continue;

      // Upload with original filename
      const existing = await db.collection('images.files').findOne({ filename: fileName });
      if (!existing) {
        await new Promise((resolve, reject) => {
          const uploadStream = bucket.openUploadStream(fileName, {
            metadata: { originalPath: filePath }
          });
          fs.createReadStream(filePath)
            .on('error', (err) => reject(err))
            .pipe(uploadStream)
            .on('error', (err) => reject(err))
            .on('finish', () => {
              console.log(`Uploaded: ${fileName}`);
              resolve();
            });
        });
      } else {
        console.log(`Skipping existing file: ${fileName}`);
      }

      // Also upload with extension removed (if not already present and if extension is .png or .jpeg)
      const baseName = fileName.replace(/\.(jpe?g|png)$/i, '');
      if (baseName !== fileName) {
        const existingBase = await db.collection('images.files').findOne({ filename: baseName });
        if (!existingBase) {
          await new Promise((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(baseName, {
              metadata: { originalPath: filePath }
            });
            fs.createReadStream(filePath)
              .on('error', (err) => reject(err))
              .pipe(uploadStream)
              .on('error', (err) => reject(err))
              .on('finish', () => {
                console.log(`Uploaded: ${baseName}`);
                resolve();
              });
          });
        } else {
          console.log(`Skipping existing file: ${baseName}`);
        }
      }
    }

    console.log('All images processed.');
  } catch (err) {
    console.error('Error uploading images:', err);
  } finally {
    await client.close();
  }
}

uploadImages();
