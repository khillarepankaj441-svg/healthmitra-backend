export const doctors = [
  { id: 'doc-amit', name: 'Dr. Amit Verma', specialty: 'Cardiologist', experience: 8, degree: 'MBBS, MD', casesHandled: 4500, hospital: 'Max Super Speciality Hospital', rating: 4.8, reviews: 120, available: true, photo: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { id: 'doc-priya', name: 'Dr. Priya Sharma', specialty: 'Dermatologist', experience: 7, degree: 'MBBS, DDVL', casesHandled: 3200, hospital: 'Fortis Hospital, Delhi', rating: 4.7, reviews: 98, available: true, photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 'doc-rahul', name: 'Dr. Rahul Mehta', specialty: 'Neurologist', experience: 10, degree: 'MBBS, DM', casesHandled: 5100, hospital: 'AIIMS Hospital, Delhi', rating: 4.9, reviews: 150, available: true, photo: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 'doc-neha', name: 'Dr. Neha Singh', specialty: 'Pediatrician', experience: 6, degree: 'MBBS, DCH', casesHandled: 2800, hospital: 'Apollo Children Hospital', rating: 4.6, reviews: 50, available: true, photo: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: 'doc-vivek', name: 'Dr. Vivek Jain', specialty: 'Orthopedic', experience: 9, degree: 'MBBS, MS', casesHandled: 4800, hospital: 'Medanta Hospital, Gurgaon', rating: 4.8, reviews: 110, available: true, photo: 'https://randomuser.me/api/portraits/men/46.jpg' },
  { id: 'doc-anjali', name: 'Dr. Anjali Gupta', specialty: 'Gynecologist', experience: 8, degree: 'MBBS, MS', casesHandled: 3900, hospital: 'Cloudnine Hospital, Delhi', rating: 4.7, reviews: 78, available: true, photo: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: 'doc-saurabh', name: 'Dr. Saurabh Khanna', specialty: 'ENT Specialist', experience: 7, degree: 'MBBS, MS', casesHandled: 3500, hospital: 'BLK Max Hospital, Delhi', rating: 4.6, reviews: 60, available: true, photo: 'https://randomuser.me/api/portraits/men/54.jpg' },
  { id: 'doc-pooja', name: 'Dr. Pooja Malhotra', specialty: 'Ophthalmologist', experience: 6, degree: 'MBBS, MS', casesHandled: 2900, hospital: 'Sankara Eye Hospital, Delhi', rating: 4.5, reviews: 65, available: true, photo: 'https://randomuser.me/api/portraits/women/72.jpg' },
]

export const articles = [
  { id: 'art-immunity', category: 'Nutrition', title: '10 Superfoods to Boost Your Immunity Naturally', summary: 'Include these superfoods in your diet to strengthen your immune system and stay healthy all year long.', date: 'May 15, 2024', readTime: '5 min read' },
  { id: 'art-fitness', category: 'Fitness', title: 'Morning Exercises for a Healthy Body', summary: 'Simple and effective morning exercises to boost your energy and keep you fit.', date: 'May 12, 2024', readTime: '6 min read' },
  { id: 'art-stress', category: 'Mental Health', title: 'How to Manage Stress and Stay Positive', summary: 'Practical tips to manage stress, anxiety and maintain a positive mindset.', date: 'May 10, 2024', readTime: '4 min read' },
  { id: 'art-diabetes', category: 'Diseases', title: "Early Signs of Diabetes You Shouldn't Ignore", summary: 'Learn the early signs of diabetes and how you can manage it effectively.', date: 'May 15, 2024', readTime: '5 min read' },
  { id: 'art-prenatal', category: 'Women Health', title: 'Essential Prenatal Care Tips for Healthy Pregnancy', summary: 'Important prenatal care tips every woman should follow for a safe journey.', date: 'May 8, 2024', readTime: '6 min read' },
  { id: 'art-kids', category: 'Kids Health', title: 'Healthy Eating Habits for Growing Children', summary: 'Best nutrition tips and healthy eating habits for your children growth.', date: 'May 3, 2024', readTime: '6 min read' },
]

export const appointments = [
  { id: 'apt-12560', doctorId: 'doc-priya', doctor: 'Dr. Priya Sharma', specialty: 'Cardiologist', date: '2024-05-20', time: '10:30 AM', status: 'Confirmed', location: 'HealthMitra Clinic, New Delhi' },
  { id: 'apt-12561', doctorId: 'doc-amit', doctor: 'Dr. Amit Verma', specialty: 'General Physician', date: '2024-05-24', time: '04:00 PM', status: 'Confirmed', location: 'HealthMitra Clinic, New Delhi' },
  { id: 'apt-12562', doctorId: 'doc-neha', doctor: 'Dr. Neha Gupta', specialty: 'Dermatologist', date: '2024-05-28', time: '11:00 AM', status: 'Upcoming', location: 'HealthMitra Clinic, New Delhi' },
]

export const records = [
  { id: 'rec-1', fileName: 'Blood_Test_Report_May2024.pdf', type: 'Lab Report', date: '2024-05-20', uploadedBy: 'Rahul Verma', size: '245 KB' },
  { id: 'rec-2', fileName: 'XRay_Chest_May2024.pdf', type: 'Scan / Image', date: '2024-05-18', uploadedBy: 'Rahul Verma', size: '1.2 MB' },
  { id: 'rec-3', fileName: 'Prescription_DrPriya_May2024.pdf', type: 'Prescription', date: '2024-05-16', uploadedBy: 'Rahul Verma', size: '180 KB' },
  { id: 'rec-4', fileName: 'MRI_Brain_Apr2024.jpg', type: 'Scan / Image', date: '2024-04-28', uploadedBy: 'Rahul Verma', size: '2.4 MB' },
]

export const reminders = [
  { id: 'med-1', medicine: 'Paracetamol 650mg', dose: '1 Tablet', frequency: 'Everyday', time: '9:00 AM', status: 'Active' },
  { id: 'med-2', medicine: 'Amoxicillin 500mg', dose: '1 Capsule', frequency: 'Every 12 hours', time: '9:00 AM, 9:00 PM', status: 'Active' },
  { id: 'med-3', medicine: 'Vitamin D3 60K', dose: '1 Tablet', frequency: 'Every Sunday', time: '8:00 AM', status: 'Active' },
]

export const notifications = [
  { id: 'note-1', title: 'Upcoming Appointment Reminder', message: 'You have an appointment with Dr. Priya Sharma tomorrow.', type: 'Appointment', time: '10:15 AM', read: false },
  { id: 'note-2', title: 'Medicine Reminder', message: 'Time to take Paracetamol 650mg.', type: 'Reminder', time: '09:00 AM', read: false },
  { id: 'note-3', title: 'System Update', message: 'We updated the privacy policy.', type: 'System', time: '18 May 2024', read: true },
]
