const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Event = require('./models/Event');
const User = require('./models/User');
const { getAdminEmail, getAdminPassword } = require('./config/adminCredentials');

const events = [
  {
    title: 'Junooni Tour — Chicago, IL',
    description:
      'JUNOONI TOUR — USA TOUR featuring Mustafa Zahid & Ali Azmat. Live at Chicagoland Halal Fest 2026!\n\n' +
      'Saturday, August 8, 2026 at Kane County Fairgrounds, St. Charles, IL. Gates open at 6:30 PM · Concert starts at 7:30 PM (US Central).\n\n' +
      'Culture. Community. Music. All in one night! Celebrate our heritage & traditions, connect with the community, and enjoy world-class music & cultural vibes.\n\n' +
      'A night of music. A celebration of us. Junooni Tour live in concert! Bring your family. Bring your friends. Be part of something bigger.\n\n' +
      'Grab It Hot is proud to list this experience. When you book or request tickets here, you get clear information, careful handling of your details, and a straightforward path to confirmation.\n\n' +
      'Booking & inquiries:\n' +
      '• Fawad — (847) 909-3798\n' +
      '• Zoya — (872) 212-2691\n' +
      '• Masiha — (815) 241-1814\n' +
      '• Farooq — (630) 999-5097\n\n' +
      'Presented with support from MPS Melody Production & Sound, Nexgen Polymers, Illinois Muslim Chamber of Commerce, The Halal Group, and MFX Productions.\n' +
      'www.ilmuslimchamber.org',
    category: 'Music',
    date: new Date('2026-08-08T19:30:00-05:00'),
    endDate: new Date('2026-08-09T00:00:00-05:00'),
    location: {
      venue: 'Kane County Fairgrounds',
      city: 'St. Charles',
      state: 'IL',
      address: '525 S Randall Rd',
      zipCode: '60174',
    },
    organizer: {
      name: 'Illinois Muslim Chamber of Commerce',
      email: 'support@nexgenpolymers.com',
      phone: '+1 (847) 909-3798',
    },
    image: '/uploads/junooni-tour-usa-2026.png',
    ticketTiers: [
      { name: 'General Admission', price: 45, salePrice: 40, capacity: 800, description: 'Open Seating' },
      { name: 'VIP', price: 75, salePrice: 70, capacity: 200, description: 'VIP access · venue rules apply' },
      {
        name: 'VVIP (Meet&Greet Included)',
        price: 150,
        salePrice: 125,
        capacity: 80,
        description: 'VVIP · Meet & Greet included · limited availability',
      },
    ],
    featured: true,
    status: 'upcoming',
    dateComingSoon: false,
    tags: ['Junooni', 'Mustafa Zahid', 'Ali Azmat', 'Halal Fest', 'St. Charles', 'Chicago', 'Kane County Fairgrounds'],
  },
  {
    title: 'Junooni Tour - Dallas Texas',
    description:
      'JUNOONI TOUR — Pakistan Independence Day Live in Concert featuring Mustafa Zahid & Ali Azmat.\n\n' +
      'Saturday, August 15, 2026 at Grand Center, Plano, TX. Gates open at 8:00 PM · Concert starts at 8:30 PM (US Central).\n\n' +
      'Celebrate Pakistan Independence Day with a night of live music from Mustafa Zahid and Ali Azmat.\n\n' +
      'Grab It Hot is proud to list this experience. When you book or request tickets here, you get clear information, careful handling of your details, and a straightforward path to confirmation.\n\n' +
      'Booking & inquiries:\n' +
      '• Nasir Siddiqi — (214) 837-5055\n' +
      '• Farooq — (630) 999-5097\n\n' +
      'Presented by Nasir Siddiqi Presentation, Hiba Entertainment, MFX Productions, and MPS Melody Production & Sound.\n' +
      'Sponsors: Omar Khawaja Personal Injury Lawyers and Nexgen Polymers Inc.',
    category: 'Music',
    date: new Date('2026-08-15T20:30:00-05:00'),
    endDate: new Date('2026-08-16T01:00:00-05:00'),
    location: {
      venue: 'Grand Center',
      city: 'Plano',
      state: 'TX',
      address: '300 Chisholm Pl',
      zipCode: '75075',
    },
    organizer: {
      name: 'Nasir Siddiqi Presentation & Hiba Entertainment',
      phone: '+1 (214) 837-5055',
    },
    image: '/uploads/junooni-tour-dallas-2026.png',
    ticketTiers: [
      { name: 'VVIP (Meet & Greet)', price: 199, capacity: 40, description: 'Front row · Meet & Greet included' },
      { name: 'VIP', price: 99, capacity: 120, description: 'Rows 2–4 seating' },
      { name: 'General Admission', price: 50, capacity: 600, description: 'General seating' },
    ],
    featured: true,
    status: 'upcoming',
    dateComingSoon: false,
    tags: ['Junooni', 'Mustafa Zahid', 'Ali Azmat', 'Dallas', 'Plano', 'Texas', 'Pakistan Independence Day', 'Grand Center'],
  },
  {
    title: 'Junooni Tour - New Jersey',
    description:
      'JUNOONI TOUR featuring Mustafa Zahid & Ali Azmat — live in New Jersey.\n\n' +
      'Friday, August 14, 2026 at Ritz Theatre & Performing Arts Center, Elizabeth, NJ. Gates open at 8:00 PM · Concert starts at 8:30 PM (US Eastern).\n\n' +
      'Grab It Hot is proud to list this experience. When you book or request tickets here, you get clear information, careful handling of your details, and a straightforward path to confirmation.\n\n' +
      'Booking & inquiries:\n' +
      '• Arif Khan — (646) 393-6994\n' +
      '• Farooq — (630) 999-5097\n\n' +
      'Presented with support from The Musik World, MPS Melody Production & Sound, MFX Productions, and Nexgen Polymers.',
    category: 'Music',
    date: new Date('2026-08-14T20:30:00-04:00'),
    endDate: new Date('2026-08-15T01:00:00-04:00'),
    location: {
      venue: 'Ritz Theatre & Performing Arts Center',
      city: 'Elizabeth',
      state: 'NJ',
      address: '1148 E Jersey St',
      zipCode: '07201',
    },
    organizer: {
      name: 'The Musik World & MFX Productions',
      phone: '+1 (646) 393-6994',
    },
    image: '/uploads/junooni-tour-new-jersey-2026.png',
    ticketTiers: [
      { name: 'VVIP (Meet & Greet)', price: 199, capacity: 40, description: 'Front row · Meet & Greet included' },
      { name: 'VIP', price: 99, capacity: 120, description: 'Rows 2–4 seating' },
      { name: 'General Admission', price: 50, capacity: 600, description: 'General seating' },
    ],
    featured: true,
    status: 'upcoming',
    dateComingSoon: false,
    tags: ['Junooni', 'Mustafa Zahid', 'Ali Azmat', 'New Jersey', 'Elizabeth', 'Ritz Theatre'],
  },
  {
    title: 'Farhan Live in Chicago',
    description:
      'Farhan Saeed live in Chicago — Friday, April 24, 2026 at 7:00 PM (US Central) at NUR LOFT, Addison. Presented by MFX Productions in association with M Events and Marketing. National promoter: WO ADVERTISING.\n\n' +
      'Grab It Hot is proud to list this experience alongside other standout events in the Chicago area. When you book or request tickets here, you get clear information, careful handling of your details, and a straightforward path to confirmation. We look forward to seeing you at NUR LOFT for a memorable night with Farhan Saeed.',
    category: 'Music',
    // 7:00 PM local (US Central / Chicago) on Friday, Apr 24, 2026 — stored with CDT offset
    date: new Date('2026-04-24T19:00:00-05:00'),
    endDate: new Date('2026-04-24T23:30:00-05:00'),
    location: {
      venue: 'NUR LOFT',
      city: 'Addison',
      state: 'IL',
      address: '264 W North Ave',
      zipCode: '60101',
    },
    organizer: {
      name: 'MFX Productions & M Events and Marketing',
      phone: '815-242-1814',
    },
    image: '/uploads/farhan-live-chicago-poster.png',
    ticketTiers: [
      { name: 'Regular Ticket', price: 50, capacity: 400, description: 'General admission — NUR LOFT' },
    ],
    featured: true,
    status: 'completed',
    dateComingSoon: false,
    tags: ['Farhan Saeed', 'Chicago', 'live', 'MFX Productions', 'NUR LOFT', 'Addison'],
  },
  {
    title: 'Jigrra Live in Concert — Jigardan Gadhvi',
    description:
      'JIGRRA live in concert with Jigardan Gadhvi — Saturday, May 30, 2026 at 7:00 PM onwards (US Central) at National India Hub, Schaumburg, IL. National promoter: Emerald Events.\n\n' +
      'Presented with support from premier partners including Brightway Lending, Core Exteriors, Ajshi Events, and World Power Solutions. Tickets are available on Sulekha — choose Fan Pit or Regular as listed on the official flyer.\n\n' +
      'Grab It Hot is proud to list this experience alongside other standout live shows in the Chicago area. When you book or request tickets here, you get clear information, careful handling of your details, and a straightforward path to confirmation. We look forward to seeing you at National India Hub for an unforgettable night.',
    category: 'Music',
    date: new Date('2026-05-30T19:00:00-05:00'),
    endDate: new Date('2026-05-31T00:00:00-05:00'),
    location: {
      venue: 'National India Hub',
      city: 'Schaumburg',
      state: 'IL',
      address: '930 National Pkwy',
      zipCode: '60173',
    },
    organizer: {
      name: 'Emerald Events',
    },
    image: '/uploads/jigrra-jigardan-gadhvi-schaumburg.png',
    ticketTiers: [
      { name: 'Fan Pit', price: 40, capacity: 200, description: 'Fan pit — closest to the stage' },
      { name: 'Regular', price: 30, capacity: 450, description: 'General admission' },
    ],
    featured: false,
    status: 'completed',
    dateComingSoon: false,
    tags: ['Jigardan Gadhvi', 'Jigrra', 'Schaumburg', 'Chicago', 'Emerald Events', 'National India Hub', 'Sulekha'],
  },
  {
    title: 'DJ Chetas — MVM Chicago',
    description:
      'MVM Chicago featuring DJ Chetas at TAO Chicago — doors open at 9:00 PM (US Central).\n\n' +
      'Presented with Sahil Promotions, TAO Chicago, and Rajshi Events.\n\n' +
      'Grab It Hot is proud to list this experience alongside other standout live shows in the Chicago area. When you book or request tickets here, you get clear information, careful handling of your details, and a straightforward path to confirmation. We look forward to seeing you at TAO Chicago for an unforgettable night.\n\n' +
      'Contacts:\n' +
      '• Bhavesh Patel — (773) 552-2222\n' +
      '• Gaurav Tuteja — (352) 226-1319',
    category: 'Music',
    date: new Date('2026-04-30T21:00:00-05:00'),
    endDate: new Date('2026-05-01T02:30:00-05:00'),
    location: {
      venue: 'TAO Chicago',
      city: 'Chicago',
      state: 'IL',
      address: '632 N Dearborn St',
      zipCode: '60654',
    },
    organizer: {
      name: 'Sahil Promotions & Rajshi Events',
      phone: '(773) 552-2222',
    },
    image: '/uploads/dj-chetas-mvm-chicago.png',
    ticketTiers: [
      { name: 'Regular', price: 50, capacity: 500, description: 'Regular entry' },
    ],
    featured: false,
    status: 'completed',
    dateComingSoon: false,
    tags: ['DJ Chetas', 'MVM Chicago', 'TAO Chicago', 'Chicago', 'Sahil Promotions', 'Rajshi Events'],
  },
  {
    title: 'The Rampage Tour — Arjun Rampal (Chicago)',
    description:
      'The Rampage Tour — Arjun Rampal spinning live in Chicago. Melodic House · Bollytech.\n\n' +
      'Thursday, June 4 — doors 9:00 PM onwards (US Central). 21+ only.\n\n' +
      'Venue: TAO Chicago — 632 N Dearborn St, Chicago, IL 60654.\n\n' +
      'Presented by Rajshi Events and JD Eventz.',
    category: 'Music',
    date: new Date('2026-06-04T21:00:00-05:00'),
    endDate: new Date('2026-06-05T03:00:00-05:00'),
    location: {
      venue: 'TAO Chicago',
      city: 'Chicago',
      state: 'IL',
      address: '632 N Dearborn St',
      zipCode: '60654',
    },
    organizer: {
      name: 'Rajshi Events & JD Eventz',
    },
    image: '/uploads/rampage-tour-arjun-chicago.png',
    ticketTiers: [
      { name: 'General Admission', price: 99, capacity: 5, sold: 0, description: '21+ · GA floor' },
    ],
    featured: false,
    status: 'completed',
    dateComingSoon: false,
    tags: ['Arjun Rampal', 'Rampage Tour', 'TAO Chicago', 'Chicago', 'Melodic House', 'Bollytech', '21+'],
  },
];

const SEED_EVENT_TITLES = events.map((e) => e.title);

async function upsertDemoEvents() {
  const removed = await Event.deleteMany({ title: { $nin: SEED_EVENT_TITLES } });
  if (removed.deletedCount > 0) {
    console.log(`Removed ${removed.deletedCount} event(s) not in seed list (${SEED_EVENT_TITLES.join(' | ')}).`);
  }

  let created = 0;
  let updated = 0;
  for (const ev of events) {
    const existing = await Event.findOne({ title: ev.title }).lean();
    const replacement = { ...ev };
    if (existing) {
      replacement._id = existing._id;
      replacement.createdAt = existing.createdAt;
      updated += 1;
    } else {
      created += 1;
    }
    // Full document replace so nested `ticketTiers` (e.g. Farhan → one Regular $50) is not merged with stale tiers
    await Event.findOneAndReplace({ title: ev.title }, replacement, {
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
  }
  console.log(`Events: ${created} inserted, ${updated} updated (matched by title).`);
}

async function upsertAdmin() {
  const ADMIN_EMAIL = getAdminEmail();
  const ADMIN_PASSWORD = getAdminPassword();
  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (user) {
    user.password = ADMIN_PASSWORD;
    user.role = 'admin';
    user.name = user.name || 'Admin User';
    await user.save();
    console.log(`Admin updated: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }
}

async function ensureTestUser() {
  const email = 'test@grabit-hot.com';
  const exists = await User.findOne({ email });
  if (exists) {
    console.log(`Test user already exists (${email}), left unchanged.`);
    return;
  }
  await User.create({
    name: 'Test User',
    email,
    password: 'test123456',
    role: 'user',
  });
  console.log(`Test user created: ${email} / test123456`);
}

const seedDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI. Set it in backend/.env (e.g. MongoDB Atlas connection string).');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await upsertDemoEvents();
    await upsertAdmin();
    await ensureTestUser();

    console.log('\n✅ Seed finished (nothing was deleted — only upserts).');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDB();
