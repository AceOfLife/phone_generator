// const express = require('express');
// const cors = require('cors');
// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
// const axios = require('axios');

// const app = express();
// const PORT = process.env.PORT || 5000;
// const NUMVERIFY_KEY = process.env.NUMVERIFY_KEY;

// app.use(cors());
// app.use(express.json());

// const db = new sqlite3.Database(path.join(__dirname, 'numbers.db'));

// console.log('✅ Backend starting (Improved Mobile-Friendly Generator)...');

// // Create table and load real area codes
// db.serialize(() => {
//   db.run(`DROP TABLE IF EXISTS prefixes`);

//   db.run(`CREATE TABLE prefixes (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     npa TEXT NOT NULL,
//     state TEXT NOT NULL
//   )`, () => {
//     const areaCodesByState = {
//       "Alabama": ["205","251","256","334","659","938"],
//       "Alaska": ["907"],
//       "Arizona": ["480","520","602","623","928"],
//       "Arkansas": ["479","501","870"],
//       "California": ["209","213","310","323","408","415","510","530","559","562","619","626","650","707","714","760","805","818","831","858","909","916","925","949","951"],
//       "Colorado": ["303","719","720","970"],
//       "Connecticut": ["203","475","860"],
//       "Delaware": ["302"],
//       "District of Columbia": ["202"],
//       "Florida": ["239","305","321","352","407","561","727","754","772","786","813","850","863","904","941","954"],
//       "Georgia": ["229","404","470","478","678","706","770","912"],
//       "Hawaii": ["808"],
//       "Idaho": ["208"],
//       "Illinois": ["217","224","312","331","618","630","708","773","815","847"],
//       "Indiana": ["219","260","317","574","765","812"],
//       "Iowa": ["319","515","563","641","712"],
//       "Kansas": ["316","620","785","913"],
//       "Kentucky": ["270","502","606","859"],
//       "Louisiana": ["225","318","337","504","985"],
//       "Maine": ["207"],
//       "Maryland": ["240","301","410","443"],
//       "Massachusetts": ["339","413","508","617","774","781","978"],
//       "Michigan": ["231","248","269","313","517","586","616","734","810","906","989"],
//       "Minnesota": ["218","320","507","612","651","763","952"],
//       "Mississippi": ["228","601","662"],
//       "Missouri": ["314","417","573","636","816"],
//       "Montana": ["406"],
//       "Nebraska": ["308","402"],
//       "Nevada": ["702","775"],
//       "New Hampshire": ["603"],
//       "New Jersey": ["201","551","609","732","848","856","862","908","973"],
//       "New Mexico": ["505","575"],
//       "New York": ["212","315","347","516","518","585","607","631","646","716","718","845","914","917"],
//       "North Carolina": ["252","336","704","828","910","919","980"],
//       "North Dakota": ["701"],
//       "Ohio": ["216","234","330","419","440","513","614","740","937"],
//       "Oklahoma": ["405","580","918"],
//       "Oregon": ["503","541","971"],
//       "Pennsylvania": ["215","267","412","484","570","610","717","724","814"],
//       "Rhode Island": ["401"],
//       "South Carolina": ["803","843","864"],
//       "South Dakota": ["605"],
//       "Tennessee": ["423","615","731","865","901","931"],
//       "Texas": ["210","214","254","281","325","361","409","432","469","512","682","713","806","817","830","832","903","915","936","940","956","972","979"],
//       "Utah": ["385","435","801"],
//       "Vermont": ["802"],
//       "Virginia": ["276","434","540","571","703","757","804"],
//       "Washington": ["206","253","360","425","509"],
//       "West Virginia": ["304"],
//       "Wisconsin": ["262","414","608","715","920"],
//       "Wyoming": ["307"]
//     };

//     const stmt = db.prepare("INSERT INTO prefixes (npa, state) VALUES (?, ?)");
//     let total = 0;
//     Object.keys(areaCodesByState).forEach(state => {
//       areaCodesByState[state].forEach(npa => {
//         stmt.run(npa, state);
//         total++;
//       });
//     });
//     stmt.finalize(() => {
//       console.log(`✅ Loaded ${total} real area codes successfully!`);
//     });
//   });
// });

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok', message: 'Backend running with improved mobile generator' });
// });

// // Generate numbers - Improved for higher validity + mobile bias
// app.post('/api/generate', (req, res) => {
//   const { states = [], count = 1000 } = req.body;

//   let query = "SELECT npa, state FROM prefixes";
//   const params = [];

//   if (states.length > 0) {
//     query += " WHERE state IN (" + states.map(() => "?").join(",") + ")";
//     params.push(...states);
//   }

//   db.all(query, params, (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });

//     const numbers = [];
//     const used = new Set();

//     // Common patterns that tend to have higher mobile assignment rates
//     const preferredFirstDigits = [2,3,4,5,6,7,8,9];

//     while (numbers.length < count && rows.length > 0) {
//       const row = rows[Math.floor(Math.random() * rows.length)];

//       let nxx;
//       do {
//         const first = preferredFirstDigits[Math.floor(Math.random() * preferredFirstDigits.length)];
//         const second = Math.floor(Math.random() * 10);
//         const third = Math.floor(Math.random() * 10);
//         nxx = `${first}${second}${third}`;

//         // Avoid known reserved / test / low-assignment blocks
//       } while (
//         nxx.startsWith('55') || 
//         nxx === '411' || 
//         nxx === '911' || 
//         nxx.startsWith('976') || 
//         nxx.startsWith('950') || 
//         nxx.startsWith('958') || 
//         nxx.startsWith('959')
//       );

//       const xxxx = String(1000 + Math.floor(Math.random() * 9000)).padStart(4, '0');
//       const number = `(${row.npa}) ${nxx}-${xxxx}`;

//       if (!used.has(number)) {
//         used.add(number);
//         numbers.push({ number });
//       }
//     }

//     res.json({ numbers });
//   });
// });

// // Validate with Numverify (limited to 20 to protect quota)
// app.post('/api/validate', async (req, res) => {
//   const { numbers } = req.body;

//   if (!numbers || numbers.length === 0) {
//     return res.status(400).json({ error: "No numbers provided" });
//   }

//   const toValidate = numbers.slice(0, 20);
//   const results = [];

//   for (const num of toValidate) {
//     try {
//       const cleanNumber = num.replace(/\D/g, '');
//       const response = await axios.get('http://apilayer.net/api/validate', {
//         params: {
//           access_key: NUMVERIFY_KEY,
//           number: cleanNumber,
//           country_code: 'US'
//         },
//         timeout: 10000
//       });

//       const data = response.data;
//       results.push({
//         number: num,
//         valid: !!data.valid,
//         carrier: data.carrier || 'Unknown',
//         line_type: data.line_type || 'Unknown',
//         location: data.location || 'Unknown'
//       });
//     } catch (err) {
//       results.push({
//         number: num,
//         valid: false,
//         carrier: 'Lookup failed',
//         line_type: 'Error',
//         location: 'Error'
//       });
//     }
//   }

//   res.json({ 
//     results,
//     note: `Validated ${results.length} numbers`
//   });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
//   console.log(`   Improved generator + Numverify enabled`);
// });

// Updated without DB

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

const NUMVERIFY_KEY = process.env.NUMVERIFY_KEY;

app.use(express.json());

// TEMP: allow all origins (tighten later after Vercel deploy)
app.use(cors());

console.log('✅ Backend running (NO DB VERSION)');

// ========================
// USA AREA CODES (IN-MEMORY)
// ========================
const areaCodesByState = {
  "Alabama": ["205","251","256","334","659","938"],
  "Alaska": ["907"],
  "Arizona": ["480","520","602","623","928"],
  "Arkansas": ["479","501","870"],
  "California": ["209","213","310","323","408","415","510","530","559","562","619","626","650","707","714","760","805","818","831","858","909","916","925","949","951"],
  "Colorado": ["303","719","720","970"],
  "Connecticut": ["203","475","860"],
  "Delaware": ["302"],
  "District of Columbia": ["202"],
  "Florida": ["239","305","321","352","407","561","727","754","772","786","813","850","863","904","941","954"],
  "Georgia": ["229","404","470","478","678","706","770","912"],
  "Hawaii": ["808"],
  "Idaho": ["208"],
  "Illinois": ["217","224","312","331","618","630","708","773","815","847"],
  "Indiana": ["219","260","317","574","765","812"],
  "Iowa": ["319","515","563","641","712"],
  "Kansas": ["316","620","785","913"],
  "Kentucky": ["270","502","606","859"],
  "Louisiana": ["225","318","337","504","985"],
  "Maine": ["207"],
  "Maryland": ["240","301","410","443"],
  "Massachusetts": ["339","413","508","617","774","781","978"],
  "Michigan": ["231","248","269","313","517","586","616","734","810","906","989"],
  "Minnesota": ["218","320","507","612","651","763","952"],
  "Mississippi": ["228","601","662"],
  "Missouri": ["314","417","573","636","816"],
  "Montana": ["406"],
  "Nebraska": ["308","402"],
  "Nevada": ["702","775"],
  "New Hampshire": ["603"],
  "New Jersey": ["201","551","609","732","848","856","862","908","973"],
  "New Mexico": ["505","575"],
  "New York": ["212","315","347","516","518","585","607","631","646","716","718","845","914","917"],
  "North Carolina": ["252","336","704","828","910","919","980"],
  "North Dakota": ["701"],
  "Ohio": ["216","234","330","419","440","513","614","740","937"],
  "Oklahoma": ["405","580","918"],
  "Oregon": ["503","541","971"],
  "Pennsylvania": ["215","267","412","484","570","610","717","724","814"],
  "Rhode Island": ["401"],
  "South Carolina": ["803","843","864"],
  "South Dakota": ["605"],
  "Tennessee": ["423","615","731","865","901","931"],
  "Texas": ["210","214","254","281","325","361","409","432","469","512","682","713","806","817","830","832","903","915","936","940","956","972","979"],
  "Utah": ["385","435","801"],
  "Vermont": ["802"],
  "Virginia": ["276","434","540","571","703","757","804"],
  "Washington": ["206","253","360","425","509"],
  "West Virginia": ["304"],
  "Wisconsin": ["262","414","608","715","920"],
  "Wyoming": ["307"]
};

// flatten for easy random selection
const stateEntries = Object.entries(areaCodesByState);

// ========================
// HEALTH CHECK
// ========================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend running (no DB)' });
});

// ========================
// GENERATE NUMBERS
// ========================
app.post('/api/generate', (req, res) => {
  const { states = [], count = 1000 } = req.body;

  let pool = stateEntries;

  // filter by selected states if any
  if (states.length > 0) {
    pool = stateEntries.filter(([state]) => states.includes(state));
  }

  const numbers = [];
  const used = new Set();

  const preferredDigits = [2,3,4,5,6,7,8,9];

  while (numbers.length < count && pool.length > 0) {
    const [state, areaCodes] = pool[Math.floor(Math.random() * pool.length)];
    const npa = areaCodes[Math.floor(Math.random() * areaCodes.length)];

    let nxx;
    do {
      const a = preferredDigits[Math.floor(Math.random() * preferredDigits.length)];
      const b = Math.floor(Math.random() * 10);
      const c = Math.floor(Math.random() * 10);
      nxx = `${a}${b}${c}`;
    } while (
      nxx.startsWith('55') ||
      nxx === '411' ||
      nxx === '911' ||
      nxx.startsWith('976') ||
      nxx.startsWith('950') ||
      nxx.startsWith('958') ||
      nxx.startsWith('959')
    );

    const xxxx = String(Math.floor(1000 + Math.random() * 9000));
    const number = `(${npa}) ${nxx}-${xxxx}`;

    if (!used.has(number)) {
      used.add(number);
      numbers.push({ number });
    }
  }

  res.json({ numbers });
});

// ========================
// NUMVERIFY (UNCHANGED)
// ========================
app.post('/api/validate', async (req, res) => {
  const { numbers } = req.body;

  if (!numbers || numbers.length === 0) {
    return res.status(400).json({ error: "No numbers provided" });
  }

  const toValidate = numbers.slice(0, 20);
  const results = [];

  for (const num of toValidate) {
    try {
      const clean = num.replace(/\D/g, '');

      const response = await axios.get('http://apilayer.net/api/validate', {
        params: {
          access_key: NUMVERIFY_KEY,
          number: clean,
          country_code: 'US'
        }
      });

      const data = response.data;

      results.push({
        number: num,
        valid: !!data.valid,
        carrier: data.carrier || 'Unknown',
        line_type: data.line_type || 'Unknown',
        location: data.location || 'Unknown'
      });

    } catch (err) {
      results.push({
        number: num,
        valid: false,
        carrier: 'Error',
        line_type: 'Error',
        location: 'Error'
      });
    }
  }

  res.json({
    results,
    note: `Validated ${results.length} numbers`
  });
});

// ========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});