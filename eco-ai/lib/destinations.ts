import { Destination } from './types';

// NOTE: images are deterministic placeholders (picsum.photos/seed/...) so the
// UI has real, stable imagery without depending on a licensed photo API yet.
// Swap `image` for a CMS/DAM URL when this goes to production.
const img = (seed: string) => `https://picsum.photos/seed/${seed}/900/700`;

export const destinations: Destination[] = [
  {
    id: 'ladakh', name: 'Ladakh', state: 'Ladakh', image: img('ladakh'),
    shortDescription: 'High-altitude desert of monasteries, turquoise lakes, and star-thick skies.',
    tags: ['Adventure', 'Nature', 'Spiritual'], sustainabilityScore: 72, popularity: 91,
    budgetTier: 'Mid-range', bestSeasons: ['Summer'], latitude: 34.1526, longitude: 77.5771,
    sustainablePractices: ['Solar-powered homestays', 'Community-run treks'],
  },
  {
    id: 'darjeeling', name: 'Darjeeling', state: 'West Bengal', image: img('darjeeling'),
    shortDescription: 'Tea-terraced hills with toy trains and Kanchenjunga sunrises.',
    tags: ['Nature', 'Heritage'], sustainabilityScore: 68, popularity: 78,
    budgetTier: 'Budget', bestSeasons: ['Summer'], latitude: 27.041, longitude: 88.2663,
  },
  {
    id: 'munnar', name: 'Munnar', state: 'Kerala', image: img('munnar'),
    shortDescription: 'Rolling tea gardens and misty Western Ghats peaks.',
    tags: ['Nature', 'Eco Tourism'], sustainabilityScore: 80, popularity: 85,
    budgetTier: 'Mid-range', bestSeasons: ['Summer', 'Monsoon'], latitude: 10.0889, longitude: 77.0595,
    sustainablePractices: ['Plastic-free zones', 'Local tea-worker cooperatives'],
  },
  {
    id: 'ooty', name: 'Ooty', state: 'Tamil Nadu', image: img('ooty'),
    shortDescription: 'Colonial hill station with botanical gardens and blue mountain rail.',
    tags: ['Nature', 'Heritage'], sustainabilityScore: 60, popularity: 74,
    budgetTier: 'Mid-range', bestSeasons: ['Summer'], latitude: 11.4102, longitude: 76.695,
  },
  {
    id: 'coorg', name: 'Coorg', state: 'Karnataka', image: img('coorg'),
    shortDescription: 'Coffee-scented monsoon hills and homestays run by local growers.',
    tags: ['Nature', 'Food', 'Eco Tourism'], sustainabilityScore: 82, popularity: 80,
    budgetTier: 'Mid-range', bestSeasons: ['Summer', 'Monsoon'], latitude: 12.3375, longitude: 75.8069,
    sustainablePractices: ['Shade-grown coffee farms', 'Family-run homestays'],
  },
  {
    id: 'cherrapunji', name: 'Cherrapunji', state: 'Meghalaya', image: img('cherrapunji'),
    shortDescription: 'Living root bridges and waterfalls in one of the wettest places on Earth.',
    tags: ['Nature', 'Adventure', 'Eco Tourism'], sustainabilityScore: 88, popularity: 66,
    budgetTier: 'Budget', bestSeasons: ['Monsoon'], latitude: 25.2702, longitude: 91.7323,
    sustainablePractices: ['Khasi community forest stewardship'],
  },
  {
    id: 'valley-of-flowers', name: 'Valley of Flowers', state: 'Uttarakhand', image: img('valleyofflowers'),
    shortDescription: 'A UNESCO alpine meadow that erupts into wildflowers each monsoon.',
    tags: ['Nature', 'Adventure'], sustainabilityScore: 85, popularity: 63,
    budgetTier: 'Mid-range', bestSeasons: ['Monsoon'], latitude: 30.7280, longitude: 79.6050,
  },
  {
    id: 'goa', name: 'Goa', state: 'Goa', image: img('goa'),
    shortDescription: 'Laid-back beaches, Portuguese-era lanes, and monsoon-green hinterlands.',
    tags: ['Nature', 'Food', 'Heritage'], sustainabilityScore: 55, popularity: 96,
    budgetTier: 'Mid-range', bestSeasons: ['Monsoon', 'Winter'], latitude: 15.2993, longitude: 74.1240,
  },
  {
    id: 'gulmarg', name: 'Gulmarg', state: 'Jammu & Kashmir', image: img('gulmarg'),
    shortDescription: 'Snow bowls and gondola rides beneath the Pir Panjal range.',
    tags: ['Adventure', 'Nature'], sustainabilityScore: 58, popularity: 79,
    budgetTier: 'Premium', bestSeasons: ['Winter'], latitude: 34.0484, longitude: 74.3805,
  },
  {
    id: 'auli', name: 'Auli', state: 'Uttarakhand', image: img('auli'),
    shortDescription: 'Himalayan ski slopes with views of Nanda Devi.',
    tags: ['Adventure', 'Nature'], sustainabilityScore: 62, popularity: 70,
    budgetTier: 'Mid-range', bestSeasons: ['Winter'], latitude: 30.5292, longitude: 79.5674,
  },
  {
    id: 'rann-of-kutch', name: 'Rann of Kutch', state: 'Gujarat', image: img('rannofkutch'),
    shortDescription: 'A moonlit white salt desert that hosts the Rann Utsav each winter.',
    tags: ['Nature', 'Heritage', 'Villages'], sustainabilityScore: 74, popularity: 77,
    budgetTier: 'Mid-range', bestSeasons: ['Winter'], latitude: 23.7337, longitude: 69.8597,
    sustainablePractices: ['Craft-village tourism supporting local artisans'],
  },
  {
    id: 'andaman', name: 'Andaman Islands', state: 'Andaman & Nicobar', image: img('andaman'),
    shortDescription: 'Coral reefs and rainforest-backed beaches in the Bay of Bengal.',
    tags: ['Nature', 'Adventure', 'Wildlife'], sustainabilityScore: 65, popularity: 84,
    budgetTier: 'Premium', bestSeasons: ['Winter'], latitude: 11.7401, longitude: 92.6586,
  },
  {
    id: 'kolkata', name: 'Kolkata', state: 'West Bengal', image: img('kolkata'),
    shortDescription: 'A city that turns into an open-air gallery during Durga Puja.',
    tags: ['Heritage', 'Food', 'Spiritual'], sustainabilityScore: 50, popularity: 88,
    budgetTier: 'Budget', bestSeasons: ['Winter'], latitude: 22.5726, longitude: 88.3639,
  },
  {
    id: 'kumartuli', name: 'Kumartuli', state: 'West Bengal', image: img('kumartuli'),
    shortDescription: 'The potters\u2019 quarter where Kolkata\u2019s idols are hand-sculpted.',
    tags: ['Heritage', 'Villages'], sustainabilityScore: 70, popularity: 55,
    budgetTier: 'Budget', bestSeasons: ['Winter'], latitude: 22.5958, longitude: 88.3556,
  },
  {
    id: 'dakshineswar', name: 'Dakshineswar', state: 'West Bengal', image: img('dakshineswar'),
    shortDescription: 'A riverside temple complex on the banks of the Hooghly.',
    tags: ['Spiritual', 'Heritage'], sustainabilityScore: 66, popularity: 60,
    budgetTier: 'Budget', bestSeasons: ['Winter'], latitude: 22.6549, longitude: 88.3573,
  },
  {
    id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', image: img('varanasi'),
    shortDescription: 'Ghats, oil lamps, and centuries of ritual along the Ganges.',
    tags: ['Spiritual', 'Heritage'], sustainabilityScore: 52, popularity: 93,
    budgetTier: 'Budget', bestSeasons: ['Winter'], latitude: 25.3176, longitude: 82.9739,
  },
  {
    id: 'ayodhya', name: 'Ayodhya', state: 'Uttar Pradesh', image: img('ayodhya'),
    shortDescription: 'A pilgrimage town lit end-to-end with diyas each Diwali.',
    tags: ['Spiritual', 'Heritage'], sustainabilityScore: 55, popularity: 82,
    budgetTier: 'Budget', bestSeasons: ['Winter'], latitude: 26.7922, longitude: 82.1998,
  },
  {
    id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', image: img('jaipur'),
    shortDescription: 'The Pink City\u2019s forts and bazaars, glowing during Diwali.',
    tags: ['Heritage', 'Food'], sustainabilityScore: 58, popularity: 90,
    budgetTier: 'Mid-range', bestSeasons: ['Winter'], latitude: 26.9124, longitude: 75.7873,
  },
  {
    id: 'vrindavan', name: 'Vrindavan', state: 'Uttar Pradesh', image: img('vrindavan'),
    shortDescription: 'Krishna\u2019s childhood home, awash in colour during Holi.',
    tags: ['Spiritual', 'Heritage'], sustainabilityScore: 56, popularity: 75,
    budgetTier: 'Budget', bestSeasons: ['Winter', 'Summer'], latitude: 27.5806, longitude: 77.7006,
  },
  {
    id: 'mathura', name: 'Mathura', state: 'Uttar Pradesh', image: img('mathura'),
    shortDescription: 'Temple town and birthplace of the subcontinent\u2019s biggest Holi celebrations.',
    tags: ['Spiritual', 'Heritage'], sustainabilityScore: 54, popularity: 73,
    budgetTier: 'Budget', bestSeasons: ['Winter', 'Summer'], latitude: 27.4924, longitude: 77.6737,
  },
  {
    id: 'pushkar', name: 'Pushkar', state: 'Rajasthan', image: img('pushkar'),
    shortDescription: 'A lake town famous for its camel fair and holy ghats.',
    tags: ['Spiritual', 'Heritage', 'Villages'], sustainabilityScore: 64, popularity: 76,
    budgetTier: 'Budget', bestSeasons: ['Winter'], latitude: 26.4899, longitude: 74.5511,
  },
  {
    id: 'nagaland', name: 'Nagaland', state: 'Nagaland', image: img('nagaland'),
    shortDescription: 'Tribal villages and the roaring colour of the Hornbill Festival.',
    tags: ['Heritage', 'Villages', 'Food'], sustainabilityScore: 78, popularity: 61,
    budgetTier: 'Mid-range', bestSeasons: ['Winter'], latitude: 25.6702, longitude: 94.1077,
    sustainablePractices: ['Community-owned tribal tourism'],
  },
  {
    id: 'mysuru', name: 'Mysuru', state: 'Karnataka', image: img('mysuru'),
    shortDescription: 'A palace city lit up gold for ten days of Dasara.',
    tags: ['Heritage', 'Food'], sustainabilityScore: 60, popularity: 79,
    budgetTier: 'Mid-range', bestSeasons: ['Winter'], latitude: 12.2958, longitude: 76.6394,
  },
  {
    id: 'ziro-valley', name: 'Ziro Valley', state: 'Arunachal Pradesh', image: img('ziro'),
    shortDescription: 'Pine-ringed rice paddies and the Apatani tribe\u2019s living farmland.',
    tags: ['Nature', 'Villages', 'Eco Tourism'], sustainabilityScore: 90, popularity: 42,
    budgetTier: 'Budget', bestSeasons: ['Summer'], latitude: 27.5486, longitude: 93.8322,
    sustainablePractices: ['Indigenous wetland farming', 'Homestay-only tourism'],
  },
  {
    id: 'chopta', name: 'Chopta', state: 'Uttarakhand', image: img('chopta'),
    shortDescription: 'Meadow trails to Tungnath, the world\u2019s highest Shiva temple.',
    tags: ['Nature', 'Adventure', 'Spiritual'], sustainabilityScore: 83, popularity: 47,
    budgetTier: 'Budget', bestSeasons: ['Summer'], latitude: 30.4993, longitude: 79.1907,
  },
  {
    id: 'majuli', name: 'Majuli', state: 'Assam', image: img('majuli'),
    shortDescription: 'The world\u2019s largest river island, home to centuries-old Vaishnavite monasteries.',
    tags: ['Heritage', 'Villages', 'Eco Tourism'], sustainabilityScore: 86, popularity: 39,
    budgetTier: 'Budget', bestSeasons: ['Winter'], latitude: 26.9526, longitude: 94.1697,
    sustainablePractices: ['Bamboo-built eco-cottages', 'Mask-making artisan cooperatives'],
  },
  {
    id: 'gandikota', name: 'Gandikota', state: 'Andhra Pradesh', image: img('gandikota'),
    shortDescription: 'India\u2019s "Grand Canyon" \u2014 a red-rock gorge cut by the Pennar river.',
    tags: ['Nature', 'Adventure', 'Heritage'], sustainabilityScore: 71, popularity: 35,
    budgetTier: 'Budget', bestSeasons: ['Winter'], latitude: 14.8225, longitude: 78.2842,
  },
  {
    id: 'mawlynnong', name: 'Mawlynnong', state: 'Meghalaya', image: img('mawlynnong'),
    shortDescription: 'Asia\u2019s cleanest village, run entirely on community stewardship.',
    tags: ['Villages', 'Eco Tourism', 'Nature'], sustainabilityScore: 95, popularity: 44,
    budgetTier: 'Budget', bestSeasons: ['Monsoon'], latitude: 25.2001, longitude: 91.8813,
    sustainablePractices: ['100% community waste management', 'No-plastic village charter'],
  },
  {
    id: 'tirthan-valley', name: 'Tirthan Valley', state: 'Himachal Pradesh', image: img('tirthan'),
    shortDescription: 'Trout streams and quiet trails on the edge of the Great Himalayan National Park.',
    tags: ['Nature', 'Adventure', 'Eco Tourism'], sustainabilityScore: 84, popularity: 48,
    budgetTier: 'Budget', bestSeasons: ['Summer'], latitude: 31.6350, longitude: 77.4051,
    sustainablePractices: ['Family-run trout-farm homestays'],
  },
  {
    id: 'jim-corbett', name: 'Jim Corbett', state: 'Uttarakhand', image: img('corbett'),
    shortDescription: 'India\u2019s oldest national park, tracking tigers through sal forest.',
    tags: ['Wildlife', 'Nature'], sustainabilityScore: 67, popularity: 72,
    budgetTier: 'Mid-range', bestSeasons: ['Winter'], latitude: 29.5300, longitude: 78.7747,
  },
  {
    id: 'kaziranga', name: 'Kaziranga', state: 'Assam', image: img('kaziranga'),
    shortDescription: 'Grasslands guarding the world\u2019s largest population of one-horned rhinos.',
    tags: ['Wildlife', 'Nature'], sustainabilityScore: 76, popularity: 68,
    budgetTier: 'Mid-range', bestSeasons: ['Winter'], latitude: 26.5775, longitude: 93.1714,
  },
];

export const moods = [
  { id: 'peace', label: 'Need Peace', emoji: '\ud83c\udf3f', filters: { tags: ['Nature', 'Eco Tourism'] } },
  { id: 'adventure', label: 'Adventure Calling', emoji: '\ud83c\udfd4', filters: { tags: ['Adventure'] } },
  { id: 'history', label: 'History Lover', emoji: '\ud83c\udfdb', filters: { tags: ['Heritage'] } },
  { id: 'food', label: 'Food Explorer', emoji: '\ud83c\udf72', filters: { tags: ['Food'] } },
  { id: 'instagram', label: 'Instagram Worthy', emoji: '\ud83d\udcf8', filters: { sustainabilityMin: 0 } },
  { id: 'sustainable', label: 'Sustainable Travel', emoji: '\ud83d\udc9a', filters: { sustainabilityMin: 80 } },
  { id: 'family', label: 'Family Trip', emoji: '\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67', filters: { budgetTier: 'Mid-range' } },
  { id: 'romantic', label: 'Romantic Escape', emoji: '\u2764\ufe0f', filters: { budgetTier: 'Premium' } },
];
