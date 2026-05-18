const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Document = require('../models/Document');
const TOR = require('../models/TOR');
const Request = require('../models/Request');

const sampleRequests = [
  {
    requestId: 'REQ-2026-001',
    name: 'Sarah Jane Doe',
    status: 'Pending',
    documentType: 'Certification',
    subDocumentType: 'Certificate of Enrollment',
    purpose: 'Scholarship Application',
    quantity: 1,
    dateRequested: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    requestId: 'REQ-2026-002',
    name: 'John Paul Smith',
    status: 'In Process',
    documentType: 'Certification',
    subDocumentType: 'Certificate of Good Moral',
    purpose: 'Employment Requirement',
    quantity: 1,
    dateRequested: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    requestId: 'REQ-2026-003',
    name: 'Maria Clara Santos',
    status: 'Approved',
    documentType: 'Certified True Copy',
    subDocumentType: 'CTC of Diploma',
    purpose: 'Board Examination',
    quantity: 2,
    dateRequested: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    requestId: 'REQ-2026-004',
    name: 'Michael Brandon Lee',
    status: 'Released',
    documentType: 'Transcript of Records',
    subDocumentType: 'Official Transcript of Records',
    purpose: 'Graduate School Admission',
    quantity: 1,
    documentHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    dateRequested: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
  },
  {
    requestId: 'REQ-2026-005',
    name: 'Clara Bella Reyes',
    status: 'Rejected',
    documentType: 'Certification',
    subDocumentType: 'Grade Certification',
    purpose: 'Transfer to another University',
    quantity: 1,
    dateRequested: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
  }
];

const sampleDocuments = [
  {
    documentId: 'DOC-1779016897123',
    category: 'Certification',
    documentType: 'Certificate of Enrollment',
    studentName: 'Sarah Jane Doe',
    studentId: '2023-10203',
    course: 'BS in Information Technology',
    yearLevel: '3rd Year',
    purpose: 'Scholarship Application',
    linkedRequestId: 'REQ-2026-001',
    status: 'Draft',
    notes: 'Awaiting final registrar signature validation.',
    generatedBy: 'Primary Admin'
  },
  {
    documentId: 'DOC-1779016897456',
    category: 'Certification',
    documentType: 'Certificate of Good Moral',
    studentName: 'John Paul Smith',
    studentId: '2022-04592',
    course: 'BS in Computer Science',
    yearLevel: '4th Year',
    purpose: 'Employment Requirement',
    linkedRequestId: 'REQ-2026-002',
    status: 'Finalized',
    documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    notes: 'Good moral character verified by Guidency Office.',
    generatedBy: 'Primary Admin'
  },
  {
    documentId: 'DOC-1779016897789',
    category: 'Certified True Copy',
    documentType: 'CTC of Diploma',
    studentName: 'Maria Clara Santos',
    studentId: '2021-00088',
    course: 'BS in Business Administration',
    yearLevel: 'Graduated',
    purpose: 'Board Examination',
    linkedRequestId: 'REQ-2026-003',
    status: 'Released',
    documentHash: 'f4b9c1d044f210515e01c80996fb82427ae41e4649b934ca495991b7852b899',
    notes: 'Released physically to student representative with authorization letter.',
    generatedBy: 'Admin'
  },
  {
    documentId: 'DOC-1779016897000',
    category: 'Certification',
    documentType: 'Grade Certification',
    studentName: 'Clara Bella Reyes',
    studentId: '2024-11882',
    course: 'BS in Hospitality Management',
    yearLevel: '2nd Year',
    purpose: 'Transfer to another University',
    linkedRequestId: 'REQ-2026-005',
    status: 'Draft',
    notes: 'Missing grade for HMT-202 (pending compliance).',
    generatedBy: 'Admin'
  }
];

const sampleTors = [
  {
    torId: 'TOR-2026-0001',
    studentId: '2022-04592',
    studentName: 'John Paul Smith',
    course: 'BS in Computer Science',
    yearLevel: '4th Year',
    gwa: 1.45,
    totalUnits: 126,
    status: 'Finalized',
    pdfPath: '',
    generatedBy: 'Primary Admin',
    grades: [
      { academicYear: '2022-2023', semester: '1st', subjectCode: 'CS-101', subjectName: 'Introduction to Computing', units: 3, grade: 1.25 },
      { academicYear: '2022-2023', semester: '1st', subjectCode: 'CS-102', subjectName: 'Computer Programming 1', units: 3, grade: 1.50 },
      { academicYear: '2022-2023', semester: '2nd', subjectCode: 'CS-103', subjectName: 'Computer Programming 2', units: 3, grade: 1.25 },
      { academicYear: '2023-2024', semester: '1st', subjectCode: 'CS-201', subjectName: 'Data Structures & Algorithms', units: 3, grade: 1.75 }
    ]
  },
  {
    torId: 'TOR-2026-0002',
    studentId: '2023-10203',
    studentName: 'Sarah Jane Doe',
    course: 'BS in Information Technology',
    yearLevel: '3rd Year',
    gwa: 1.62,
    totalUnits: 98,
    status: 'Draft',
    pdfPath: '',
    generatedBy: 'Admin',
    grades: [
      { academicYear: '2023-2024', semester: '1st', subjectCode: 'IT-101', subjectName: 'IT Infrastructure', units: 3, grade: 1.5 },
      { academicYear: '2023-2024', semester: '1st', subjectCode: 'IT-102', subjectName: 'Web Systems & Technologies', units: 3, grade: 1.75 },
      { academicYear: '2023-2024', semester: '2nd', subjectCode: 'IT-103', subjectName: 'Database Management Systems', units: 3, grade: 1.5 }
    ]
  },
  {
    torId: 'TOR-2026-0003',
    studentId: '2021-00088',
    studentName: 'Maria Clara Santos',
    course: 'BS in Business Administration',
    yearLevel: 'Graduated',
    gwa: 1.35,
    totalUnits: 142,
    status: 'Released',
    pdfPath: 'TOR-2026-0003.pdf',
    generatedBy: 'Primary Admin',
    grades: [
      { academicYear: '2021-2022', semester: '1st', subjectCode: 'BA-101', subjectName: 'Principles of Management', units: 3, grade: 1.25 },
      { academicYear: '2021-2022', semester: '1st', subjectCode: 'BA-102', subjectName: 'Basic Marketing', units: 3, grade: 1.50 }
    ]
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in env variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully for seeding...');

    // Drop current collections to avoid duplicates/messy states
    await Request.deleteMany({});
    console.log('Cleared Requests collection.');

    await Document.deleteMany({});
    console.log('Cleared Documents collection.');

    await TOR.deleteMany({});
    console.log('Cleared TOR collection.');

    // Seed data
    await Request.insertMany(sampleRequests);
    console.log('Successfully seeded 5 example Document Requests!');

    await Document.insertMany(sampleDocuments);
    console.log('Successfully seeded 4 example Documents (Certifications & CTCs)!');

    await TOR.insertMany(sampleTors);
    console.log('Successfully seeded 3 example Transcript of Records (TOR)!');

    console.log('Database Seeding Completed Successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
