// Script to insert hours of operation and locations into MongoDB
// Run with: node insert_data_to_mongodb.js
require('dotenv').config({ path: __dirname + '/../db/.env' });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in db/.env');
  process.exit(1);
}

// Sample data - in production, you'd read from Excel files
const hoursOfOperation = [
  {
    location_id: 1,
    day: 'Monday',
    open_time: '08:00',
    close_time: '17:00',
    is_open: true
  },
  {
    location_id: 1,
    day: 'Tuesday',
    open_time: '08:00',
    close_time: '17:00',
    is_open: true
  },
  {
    location_id: 1,
    day: 'Wednesday',
    open_time: '08:00',
    close_time: '17:00',
    is_open: true
  },
  {
    location_id: 1,
    day: 'Thursday',
    open_time: '08:00',
    close_time: '17:00',
    is_open: true
  },
  {
    location_id: 1,
    day: 'Friday',
    open_time: '08:00',
    close_time: '17:00',
    is_open: true
  },
  {
    location_id: 1,
    day: 'Saturday',
    open_time: '09:00',
    close_time: '13:00',
    is_open: true
  },
  {
    location_id: 1,
    day: 'Sunday',
    open_time: '00:00',
    close_time: '00:00',
    is_open: false
  }
];

const locations = [
  {
    name: 'C-OTTER Psychology Center',
    address: 'Virginia State University, Petersburg, VA',
    phone: '(804) 524-5523',
    domain: 'psychology',
    description: 'Psychological support and counseling services for students'
  },
  {
    name: 'Student Health Services',
    address: 'Student Center, Virginia State University',
    phone: '(804) 524-5000',
    domain: 'health',
    description: 'General health services and medical care'
  },
  {
    name: 'Campus Counseling Center',
    address: 'Building A, Virginia State University',
    phone: '(804) 524-5555',
    domain: 'counseling',
    description: 'Mental health and counseling services'
  }
];

async function insertData() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('c-otter');

    // Clear existing data and insert new
    await db.collection('hours_of_operation').deleteMany({});
    await db.collection('hours_of_operation').insertMany(hoursOfOperation);
    console.log(`Inserted ${hoursOfOperation.length} hours of operation records`);

    await db.collection('locations').deleteMany({});
    await db.collection('locations').insertMany(locations);
    console.log(`Inserted ${locations.length} location records`);

    console.log('Data insertion complete!');
  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    await client.close();
  }
}

insertData();
