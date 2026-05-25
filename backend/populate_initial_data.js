require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

const initialData = {
  // Faculty members
  faculty: [
    { name: 'Dr. Larry Jones', title: 'Lab Director', email: 'ljones@vsu.edu', phone: '(555) 123-4567', imageKey: 'Larry.jpeg', isDirector: true, department: 'Psychology' },
    { name: 'Dr. Kimberly Smith', title: 'Research Coordinator', email: 'ksmith@vsu.edu', phone: '(555) 234-5678', imageKey: 'Kimberly.jpeg', department: 'Psychology' },
    { name: 'Arlener Williams', title: 'Graduate Research Assistant', email: 'awilliams@vsu.edu', phone: '(555) 345-6789', imageKey: 'Arlener.png', department: 'Psychology' },
    { name: 'Alexis Johnson', title: 'Graduate Research Assistant', email: 'ajohnson@vsu.edu', phone: '(555) 456-7890', imageKey: 'Alexis.jpeg', department: 'Psychology' },
    { name: 'Diamond Brown', title: 'Graduate Research Assistant', email: 'dbrown@vsu.edu', phone: '(555) 567-8901', imageKey: 'Diamond.jpeg', department: 'Psychology' },
    { name: 'Corrina Davis', title: 'Undergraduate Research Assistant', email: 'cdavis@vsu.edu', phone: '(555) 678-9012', imageKey: 'Corrina.jpeg', department: 'Psychology' },
    { name: 'Ayanna Miller', title: 'Undergraduate Research Assistant', email: 'amiller@vsu.edu', phone: '(555) 789-0123', imageKey: 'Ayanna.jpeg', department: 'Psychology' },
    { name: 'Manuelene Wilson', title: 'Undergraduate Research Assistant', email: 'mwilson@vsu.edu', phone: '(555) 890-1234', imageKey: 'Manuelene.jpeg', department: 'Psychology' },
    { name: 'Davian Moore', title: 'Undergraduate Research Assistant', email: 'dmoore@vsu.edu', phone: '(555) 901-2345', imageKey: 'Davian.jpeg', department: 'Psychology' },
    { name: 'Tony Taylor', title: 'Undergraduate Research Assistant', email: 'ttaylor@vsu.edu', phone: '(555) 012-3456', imageKey: 'Tony.jpeg', department: 'Psychology' },
  ],

  // Events
  events: [
    { title: 'Campus Tour', date: '2026-04-01', time: '10:00 AM', location: 'Main Hall', description: 'Guided campus tour for new students', icon: 'walk', color: '#6366f1' },
    { title: 'Health Fair', date: '2026-04-15', time: '9:00 AM', location: 'Student Center', description: 'Annual health and wellness fair', icon: 'medical', color: '#10b981' },
    { title: 'Research Symposium', date: '2026-04-20', time: '2:00 PM', location: 'Conference Hall', description: 'Student research presentations', icon: 'flask', color: '#f59e0b' },
  ],

  // Contact info
  contact_info: [
    { department: 'Main Office', phone: '(804) 524-5000', email: 'info@vsu.edu', hours: 'Mon-Fri 8am-5pm', description: 'General inquiries and campus information' },
    { department: 'Student Services', phone: '(804) 524-5100', email: 'students@vsu.edu', hours: 'Mon-Fri 9am-4pm', description: 'Student support and assistance' },
    { department: 'PNIRD Lab', phone: '(804) 524-XXXX', email: 'pnird@vsu.edu', hours: 'By Appointment', description: 'Research lab inquiries' },
  ],

  // Homepage content
  homepage_content: [
    { 
      section: 'mission', 
      title: 'Our Mission', 
      content: 'C-OTTER empowers students through accessible support, community engagement, and academic growth by providing a unified digital platform designed to uplift, inform, and connect the campus community.', 
      order: 1 
    },
    { 
      section: 'crisis', 
      title: 'Need Help?', 
      content: 'If you\'re in crisis, call or text 988', 
      order: 2 
    },
  ],

  // Community partners (examples from the component)
  community: [
    { name: 'Local Food Bank', address: '123 Main St, Petersburg, VA', phone: '(555) 234-5678', email: 'info@foodbank.org', description: 'Weekly sorting and food distribution', category: 'Community Partners' },
    { name: 'Homeless Shelter', address: '456 Oak Ave, Petersburg, VA', phone: '(555) 345-6789', email: 'shelter@homelesshelp.org', description: 'Meal service and tutoring for residents', category: 'Community Partners' },
    { name: 'Animal Shelter', address: '789 Pine Rd, Petersburg, VA', phone: '(555) 567-8901', email: 'volunteer@animalshelter.org', description: 'Animal care, walking, and socialization', category: 'Community Partners' },
  ],

  // Financial assistance
  financial: [
    { title: 'Emergency Student Fund', amount: 'Varies', eligibility: 'Students in crisis', description: 'One-time grants for students facing financial emergencies', contact: 'financialaid@campus.edu', phone: '(555) 111-2222' },
    { title: 'Book Vouchers', amount: 'Up to $200', eligibility: 'All students', description: 'Vouchers for textbooks and course materials', contact: 'bookstore@campus.edu', phone: '(555) 222-3333' },
    { title: 'Transportation Assistance', amount: 'Varies', eligibility: 'Commuter students', description: 'Bus passes and gas cards for students', contact: 'transport@campus.edu', phone: '(555) 333-4444' },
  ],

  // Tutoring services
  tutoring: [
    { name: 'Peer Tutoring Center', subject: 'All Subjects', schedule: 'Mon-Sun 10:00 AM to 8:00 PM', location: 'Library 2nd Floor', description: 'Free one-on-one tutoring in all subjects', contact: 'tutoring@campus.edu' },
    { name: 'Writing Center', subject: 'Writing & English', schedule: 'Mon-Fri 9:00 AM to 6:00 PM', location: 'English Building Room 101', description: 'Essay review, feedback, and writing support', contact: 'writing@campus.edu' },
    { name: 'Math Lab', subject: 'Mathematics', schedule: 'Mon-Thu 1:00 PM to 7:00 PM', location: 'Math Building Room 205', description: 'Drop-in math tutoring and problem-solving help', contact: 'mathlab@campus.edu' },
  ],

  // Campus services
  campus: [
    { name: 'Library', hours: '7am-11pm Mon-Fri, 9am-9pm Sat-Sun', location: 'Main Campus', description: 'Study spaces, computers, and research resources', phone: '(555) 111-2222' },
    { name: 'Counseling Center', hours: '8am-5pm Mon-Fri', location: 'Student Health Building', description: 'Mental health support and counseling services', phone: '(555) 222-3333' },
    { name: 'Career Services', hours: '9am-5pm Mon-Fri', location: 'Student Services Building', description: 'Resume reviews, job fairs, and career guidance', phone: '(555) 333-4444' },
    { name: 'Recreation Center', hours: '6am-10pm Daily', location: 'Rec Center', description: 'Fitness facilities and intramural sports', phone: '(555) 444-5555' },
  ],

  // Research projects
  research: [
    { title: 'Sleep Study', researcher: 'Dr. Smith', status: 'Recruiting', description: 'Study on sleep patterns in college students and academic performance', eligibility: 'College students ages 18-25' },
    { title: 'Nutrition Research', researcher: 'Dr. Johnson', status: 'Ongoing', description: 'Impact of diet on academic performance and mental health', eligibility: 'All students' },
    { title: 'Stress Management Study', researcher: 'Dr. Williams', status: 'Recruiting', description: 'Examining stress reduction techniques for students', eligibility: 'Undergraduate students' },
  ],

  // Health topics
  health: [
    { category: 'Substance Awareness', title: 'Opioids', description: 'Opioid recovery apps', imageKey: 'drugs', color: '#FFB088', phone: '(555) 100-4004' },
    { category: 'Substance Awareness', title: 'Cannabis', description: 'Cannabis recovery apps', imageKey: 'drugs', color: '#6BCF7F', phone: '(555) 100-4005' },
  ],

  // Publications
  publications: [
    { 
      text: 'Ma, L., Keen II, L. D., Steinberg, J. L., Eddie, D., Tan, A., Keyser-Marcus, L., ... & Moeller, F. G. (2024). Relationship between central autonomic effective connectivity and heart rate variability: a resting-state fMRI dynamic causal modeling study. NeuroImage, 300, 120869.',
      isFeatured: true
    },
    { 
      text: 'Ma, L., Braun, S. E., Steinberg, J. L., Bjork, J. M., Martin, C. E., Keen II, L. D., & Moeller, F. G. (2024). Effect of scanning duration and sample size on reliability in resting state fMRI dynamic causal modeling analysis. NeuroImage, 292, 120604.'
    },
    { 
      text: 'Kuno, C. B., Frankel, L., Ofosuhene, P., & Keen II, L. (2024). Validation of the Adult Eating Behavior Questionnaire (AEBQ) in a young adult Black sample in the US: Evaluating the psychometric properties and associations with BMI. Current Psychology, 43(35), 28590-28603.'
    },
    { 
      text: 'Quarles, E., West, S. J., & Keen, L. (2024). Determining associations between Big Five personality traits and executive function in an undergraduate student sample. Journal of the International Neuropsychological Society, 1-8.'
    },
    { 
      text: 'Ma L, Keen LD II and Del Buono MG (2022) Editorial: Investigating substance use disorders using neuroimaging-based brain connectivity. Front. Psychiatry 13:992669. doi: 10.3389/fpsyt.2022.992669'
    },
    { 
      text: 'Bell, K. A., Coleman, E., Cooke, B. G., & Keen, L. D. (2022). Recreational cannabis use is associated with poorer sleep outcomes in young adult African Americans. Addictive Behaviors, 134, 107399.'
    },
    { 
      text: 'Keen II, L., Turner, A. D., George, L., & Lawrence, K. (2022). Cannabis use disorder severity and sleep quality among undergraduates attending a Historically Black University. Addictive Behaviors, 134, 107414.'
    },
    { 
      text: 'Keen, L., Turner, A. D., Harris, T., George, L., & Crump, J. (2021). Differences in internalizing symptoms between those with and without Cannabis Use Disorder among HBCU undergraduate students. JOURNAL OF AMERICAN COLLEGE HEALTH.'
    },
    { 
      text: 'Keen, L., Abbate, A., Clark, V., Moeller, F. G., & Tan, A. Y. (2020). Differences in heart rate among recent marijuana use groups. Minerva cardioangiologica.'
    },
    { 
      text: 'Keen II, L., Turner, A. D. (2015). Differential effects of self-reported lifetime marijuana use on interleukin-1 alpha and tumor necrosis factor in African American adults. Journal of behavioral medicine, 1-8.'
    },
  ],

  // Recovery Apps
  apps: [
    // Opioid Apps
    { 
      title: 'Nomo', 
      category: 'opioids', 
      description: 'Nomo is a sobriety-tracking app that helps users stay accountable to recovery goals. It is simple, flexible, and useful for building daily consistency.',
      features: 'Custom sobriety clocks, Mini exercises to stay focused, Encouragement and reminders, Search for accountability partners'
    },
    { 
      title: 'reSET-O', 
      category: 'opioids', 
      description: 'reSET-O is a prescription digital therapeutic made specifically for opioid use disorder and used alongside outpatient treatment.',
      features: 'FDA-approved for opioid use disorder, Prescription required, CBT-based lessons and activities, Designed to support people already in treatment'
    },
    { 
      title: 'WEconnect', 
      category: 'opioids', 
      description: 'WEconnect is a recovery support app that helps people stay engaged with treatment goals and daily recovery routines.',
      features: 'Sobriety and meeting attendance tracking, Daily goal setting and progress tracking, Virtual meetings and peer support, Special-topic and community-specific meetings'
    },
    { 
      title: 'SoberTool', 
      category: 'opioids', 
      description: 'SoberTool is built to help people handle cravings in the moment and avoid relapse.',
      features: 'Craving-management tools, Relapse-prevention support, Sobriety tracking, Motivational messages and rewards'
    },
    { 
      title: 'Affect', 
      category: 'opioids', 
      description: 'Affect is an all-in-one recovery app offering support for opioids and other substances.',
      features: 'Structured recovery program, Supports opioids, alcohol, cannabis, stimulants, and prescription drugs, Rewards for progress, Mental health and healthy-habit support'
    },
    // Cannabis Apps
    { 
      title: 'rTribe', 
      category: 'cannabis', 
      description: 'rTribe is a peer-support recovery app that lets users connect anonymously with others and track progress.',
      features: 'Anonymous profile option, Individual and group messaging, Recovery tracking and check-ins, Reach-out support when feeling triggered'
    },
    { 
      title: 'Came to Believe in Sobriety', 
      category: 'cannabis', 
      description: 'Came to Believe in Sobriety is a recovery app with goal-setting and milestone tracking.',
      features: 'Goal setting, Progress tracking, Milestone celebration, Simple, user-friendly design'
    },
    { 
      title: 'Quitzilla', 
      category: 'cannabis', 
      description: 'Quitzilla is a habit and sobriety tracker that can support people trying to quit or reduce use.',
      features: 'Sobriety tracker, Motivation reminders, Habit-building tools, Works for multiple bad habits'
    },
    { 
      title: 'Grounded', 
      category: 'cannabis', 
      description: 'Grounded is designed for people trying to quit or cut back on weed with craving support.',
      features: 'Days-clean and sobriety tracking, Craving logging and trigger tracking, Weed journal for reflections and progress, Supports tolerance breaks or full quitting'
    },
    { 
      title: 'Lucid', 
      category: 'cannabis', 
      description: 'Lucid is a cannabis recovery app that helps people quit or reduce use with coaching and symptom tracking.',
      features: 'AI recovery coach trained for cannabis withdrawal support, Sobriety tracker and money-saved tracker, Breathing and grounding tools for cravings, Recovery timeline with symptom forecasts and milestones'
    },
  ],
};

async function populateDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('c-otter');
    
    // Populate each collection
    for (const [collectionName, data] of Object.entries(initialData)) {
      console.log(`\nPopulating ${collectionName}...`);
      
      // Clear existing data (optional - comment out if you want to keep existing data)
      const deleteResult = await db.collection(collectionName).deleteMany({});
      console.log(`  Deleted ${deleteResult.deletedCount} existing documents`);
      
      // Insert new data with timestamps
      const dataWithTimestamps = data.map(item => ({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      
      const result = await db.collection(collectionName).insertMany(dataWithTimestamps);
      console.log(`  Inserted ${result.insertedCount} documents into ${collectionName}`);
    }
    
    console.log('\n✅ Database population complete!');
    console.log('\nYou can now use the admin panel to view and edit this content.');
    
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

populateDatabase();
