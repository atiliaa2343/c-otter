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


    // Recursively find all image files in the images directory and subdirectories
    const imagesDir = path.join(__dirname, '..', 'assets', 'images');
    async function getAllImageFiles(dir) {
      let results = [];
      const list = await fs.promises.readdir(dir);
      for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = await fs.promises.stat(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(await getAllImageFiles(filePath));
        } else if (file.match(/\.(jpe?g|png)$/i)) {
          results.push(filePath);
        }
      }
      return results;
    }

    const imageFiles = await getAllImageFiles(imagesDir);

    for (const filePath of imageFiles) {
      const fileName = path.basename(filePath);
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
