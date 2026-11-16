// One-off helper: generate a realistic text-based resume PDF for testing the upload endpoint.
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const lines = [
  'Pranavi Jadhav',
  'Bengaluru, India | pranavi.jadhav@example.com | +91 98765 43210',
  '',
  'SUMMARY',
  'Final-year BCA student with 2 years of internship experience in web',
  'application development. Comfortable across the JavaScript stack.',
  '',
  'SKILLS',
  'JavaScript, TypeScript, React, Node.js, Express, MySQL, Git, REST APIs',
  '',
  'EXPERIENCE',
  'Web Development Intern — TechStart Solutions (2023 - 2024)',
  'Built dashboards with React and Express; wrote MySQL queries and',
  'REST endpoints consumed by the frontend team.',
  '',
  'EDUCATION',
  'BCA, Bangalore University (2022 - 2026) — 8.6 CGPA',
  '',
  'CERTIFICATIONS',
  'Responsive Web Design — freeCodeCamp',
];

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const page = doc.addPage([595, 842]);
let y = 780;
for (const line of lines) {
  page.drawText(line, { x: 56, y, size: 11, font });
  y -= 18;
}
const bytes = await doc.save();
fs.writeFileSync('/tmp/test-resume.pdf', bytes);
console.log('Wrote /tmp/test-resume.pdf', bytes.length, 'bytes');
