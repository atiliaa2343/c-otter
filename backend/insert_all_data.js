// Script to insert all app data into MongoDB
// Run with: node insert_all_data.js
require('dotenv').config({ path: __dirname + '/../db/.env' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in db/.env');
  process.exit(1);
}

const data = {
  events: [
    {
      title: "Upcoming Blood Drive",
      description: "Hunter McDaniel, March 18th 2pm-4pm",
      icon: "water",
      color: "#ef4444",
      date: "2026-03-18",
      time: "2pm-4pm",
      location: "Main Hall"
    },
    {
      title: "Mental Health Workshop",
      description: "Student Center, March 22nd 1pm-3pm",
      icon: "happy",
      color: "#6366f1",
      date: "2026-03-22",
      time: "1pm-3pm",
      location: "Student Center"
    },
    {
      title: "Career Fair",
      description: "Gymnasium, March 25th 10am-2pm",
      icon: "briefcase",
      color: "#f59e0b",
      date: "2026-03-25",
      time: "10am-2pm",
      location: "Gymnasium"
    },
    {
      title: "Campus Safety Alert",
      description: "Be aware of construction near Lot B",
      icon: "alert-circle",
      color: "#eab308",
      date: "",
      time: "",
      location: ""
    }
  ],
  publications: [
    {
      title: "Mental Health Guide",
      author: "Dr. Smith",
      date: "2026-01-15",
      description: "Comprehensive mental health resources guide"
    },
    {
      title: "Wellness Newsletter",
      author: "Health Dept",
      date: "2026-02-01",
      description: "Monthly wellness newsletter"
    },
    {
      title: "Research Brief: Opioid Recovery",
      author: "PNIRD Lab",
      date: "2026-03-01",
      description: "Latest research on opioid recovery methods"
    }
  ],
  community: [
    {
      name: "Community Health Center",
      address: "123 Main St",
      phone: "555-0100",
      description: "Local health services"
    },
    {
      name: "Youth Center",
      address: "456 Oak Ave",
      phone: "555-0200",
      description: "Youth programs and activities"
    },
    {
      name: "Recovery Support Center",
      address: "789 Elm St",
      phone: "555-0300",
      description: "Substance recovery support services"
    }
  ],
  financial: [
    {
      title: "Emergency Fund",
      amount: "$500",
      eligibility: "All students",
      description: "Emergency financial assistance"
    },
    {
      title: "Book Scholarship",
      amount: "$200",
      eligibility: "Full-time students",
      description: "Book and supply scholarship"
    }
  ],
  faculty: [
    {
      name: "Larry Keen II, Ph.D",
      title: "Associate Professor in Psychology; PNIRD Lab Director",
      email: "LKeen@vsu.edu",
      phone: "(804) 524-5523",
      imageFilename: "Larry.jpeg",
      isDirector: true
    },
    {
      name: "Kimberly Lawrence, Ph.D.",
      title: "Associate Professor in Psychology",
      email: "KLawrence@vsu.edu",
      phone: "(804) 524-5447",
      imageFilename: "Kimberly.jpeg",
      isDirector: false
    },
    {
      name: "Arlener D. Turner, Ph.D",
      title: "Associate Professor, Department of Psychiatry and Behavioral Sciences, University of Miami",
      email: "adanielleturner@gmail.com",
      phone: "(773) 339-1797",
      imageFilename: "Arlener.png",
      isDirector: false
    },
    {
      name: "Alexis Morris, M.S.",
      title: "Graduate Research Assistant",
      email: "",
      phone: "",
      imageFilename: "Alexis.jpeg",
      isDirector: false
    },
    {
      name: "Diamond Adams",
      title: "Graduate Research Assistant",
      email: "",
      phone: "",
      imageFilename: "Diamond.jpeg",
      isDirector: false
    },
    {
      name: "Corrina Stevenson",
      title: "Graduate Research Assistant",
      email: "",
      phone: "",
      imageFilename: "Corrina.jpeg",
      isDirector: false
    },
    {
      name: "Ayanna Reid",
      title: "Graduate Research Assistant",
      email: "",
      phone: "",
      imageFilename: "Ayanna.jpeg",
      isDirector: false
    },
    {
      name: "Manuelene Deigh",
      title: "Graduate Research Assistant",
      email: "",
      phone: "",
      imageFilename: "Manuelene.jpeg",
      isDirector: false
    },
    {
      name: "Davian Clifton",
      title: "Research Assistant",
      email: "",
      phone: "",
      imageFilename: "Davian.jpeg",
      isDirector: false
    }
  ],
  health: [
    {
      id: "1",
      title: "Opiods",
      color: "#8B7FE8",
      imageKey: "mental",
      description: "Opioid use & recovery"
    },
    {
      id: "2",
      title: "Cannabis",
      color: "#FFB088",
      imageKey: "drugs",
      description: "Cannabis use & effects"
    }
  ],
  campus: [
    {
      name: "Library",
      hours: "7am-11pm",
      location: "Building A",
      description: "Main campus library"
    },
    {
      name: "Gym",
      hours: "6am-10pm",
      location: "Rec Center",
      description: "Fitness facilities"
    }
  ],
  tutoring: [
    {
      name: "Math Tutoring",
      subject: "Mathematics",
      schedule: "Mon/Wed 2-4pm",
      description: "Free math tutoring sessions"
    },
    {
      name: "Writing Center",
      subject: "English",
      schedule: "Tue/Thu 1-5pm",
      description: "Writing assistance and feedback"
    }
  ],
  hours_of_operation: [
    { day: 'Monday', open_time: '08:00', close_time: '17:00', is_open: true },
    { day: 'Tuesday', open_time: '08:00', close_time: '17:00', is_open: true },
    { day: 'Wednesday', open_time: '08:00', close_time: '17:00', is_open: true },
    { day: 'Thursday', open_time: '08:00', close_time: '17:00', is_open: true },
    { day: 'Friday', open_time: '08:00', close_time: '17:00', is_open: true },
    { day: 'Saturday', open_time: '09:00', close_time: '13:00', is_open: true },
    { day: 'Sunday', open_time: '00:00', close_time: '00:00', is_open: false }
  ],
  locations: [
    {
      name: "C-OTTER Psychology Center",
      address: "Virginia State University, Petersburg, VA",
      phone: "(804) 524-5523",
      domain: "psychology",
      description: "Psychological support and counseling services for students"
    }
  ]
};

async function insertData() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('c-otter');

    // Insert each collection
    for (const [collectionName, documents] of Object.entries(data)) {
      if (Array.isArray(documents) && documents.length > 0) {
        await db.collection(collectionName).deleteMany({});
        await db.collection(collectionName).insertMany(documents);
        console.log(`Inserted ${documents.length} documents into ${collectionName}`);
      }
    }

    console.log('\n✓ All data inserted successfully!');
    console.log('\nCollections created:');
    for (const collectionName of Object.keys(data)) {
      console.log(`  - ${collectionName}`);
    }

  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    await client.close();
  }
}

insertData();