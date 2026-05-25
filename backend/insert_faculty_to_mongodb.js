// Script to insert faculty data into MongoDB
// Run with: node insert_faculty_to_mongodb.js
require('dotenv').config({ path: __dirname + '/../db/.env' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in db/.env');
  process.exit(1);
}

const facultyData = [
  {
    name: 'Larry',
    title: 'Director, PNIRD Lab',
    email: 'larry@vsu.edu',
    phone: '(804) 524-5523',
    imageKey: 'Larry.jpeg',
    isDirector: true
  },
  {
    name: 'Kimberly',
    title: 'Research Professor',
    email: 'kimberly@vsu.edu',
    phone: '(804) 524-5524',
    imageKey: 'Kimberly.jpeg',
    isDirector: false
  },
  {
    name: 'Arlener',
    title: 'Associate Researcher',
    email: 'arlener@vsu.edu',
    phone: '(804) 524-5525',
    imageKey: 'Arlener.png',
    isDirector: false
  },
  {
    name: 'Alexis',
    title: 'Graduate Research Assistant',
    email: 'alexis@vsu.edu',
    phone: '(804) 524-5526',
    imageKey: 'Alexis.jpeg',
    isDirector: false
  },
  {
    name: 'Diamond',
    title: 'Research Specialist',
    email: 'diamond@vsu.edu',
    phone: '(804) 524-5527',
    imageKey: 'Diamond.jpeg',
    isDirector: false
  },
  {
    name: 'Corrina',
    title: 'Clinical Coordinator',
    email: 'corrina@vsu.edu',
    phone: '(804) 524-5528',
    imageKey: 'Corrina.jpeg',
    isDirector: false
  },
  {
    name: 'Ayanna',
    title: 'Postdoctoral Fellow',
    email: 'ayanna@vsu.edu',
    phone: '(804) 524-5529',
    imageKey: 'Ayanna.jpeg',
    isDirector: false
  },
  {
    name: 'Manuelene',
    title: 'Research Associate',
    email: 'manuelene@vsu.edu',
    phone: '(804) 524-5530',
    imageKey: 'Manuelene.jpeg',
    isDirector: false
  },
  {
    name: 'Davian',
    title: 'Graduate Research Assistant',
    email: 'davian@vsu.edu',
    phone: '(804) 524-5531',
    imageKey: 'Davian.jpeg',
    isDirector: false
  },
  {
    name: 'Tony',
    title: 'Lab Manager',
    email: 'tony@vsu.edu',
    phone: '(804) 524-5532',
    imageKey: 'Tony.jpeg',
    isDirector: false
  }
];

async function insertFacultyData() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('c-otter');

    await db.collection('faculty').deleteMany({});
    await db.collection('faculty').insertMany(facultyData);
    console.log(`Inserted ${facultyData.length} faculty members into MongoDB`);

    console.log('Faculty data insertion complete!');
  } catch (err) {
    console.error('Error inserting faculty data:', err);
  } finally {
    await client.close();
  }
}

insertFacultyData();