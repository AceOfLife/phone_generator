const fs = require('fs');
const path = require('path');
const https = require('https');
const unzipper = require('unzipper');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'numbers.db');
const db = new sqlite3.Database(dbPath);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const filesToDownload = [
  { url: 'https://reports.nanpa.com/public/CoCodeAssignment_Region_CENTRAL.zip', filename: 'CENTRAL.zip' },
  { url: 'https://reports.nanpa.com/public/CoCodeAssignment_Region_EASTERN.zip', filename: 'EASTERN.zip' },
  { url: 'https://reports.nanpa.com/public/CoCodeAssignment_Region_WESTERN.zip', filename: 'WESTERN.zip' }
];

async function downloadFile(url, filename) {
  const filePath = path.join(DATA_DIR, filename);
  console.log(`Downloading ${filename}...`);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => { file.close(); console.log(`✅ Downloaded ${filename}`); resolve(filePath); });
    }).on('error', reject);
  });
}

async function extractZip(zipPath) {
  const extractDir = path.join(DATA_DIR, path.basename(zipPath, '.zip'));
  if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir);
  console.log(`Extracting ${path.basename(zipPath)}...`);
  await fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: extractDir })).promise();
  console.log(`✅ Extracted to ${extractDir}`);
  return extractDir;
}

async function importCsvToDb(csvDir) {
  const csvFiles = fs.readdirSync(csvDir).filter(f => f.toLowerCase().endsWith('.csv'));

  for (const file of csvFiles) {
    const filePath = path.join(csvDir, file);
    console.log(`\n--- Processing ${file} ---`);

    let imported = 0;
    let firstRow = null;

    await new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          if (!firstRow) firstRow = row; // Save first row for debugging

          // Try multiple possible ways to get NPA and NXX
          let npa = '', nxx = '';
          if (row['NPA-NXX']) {
            const parts = String(row['NPA-NXX']).trim().split('-');
            if (parts.length >= 2) {
              npa = parts[0].trim();
              nxx = parts[1].trim();
            }
          } else if (row.NPA && row.NXX) {
            npa = String(row.NPA).trim();
            nxx = String(row.NXX).trim();
          }

          const state = String(row['State Abbreviation'] || row.State || row.STATE || '').trim();
          const rateCenter = String(row['Rate Center'] || row.RateCenter || '').trim();
          const ocn = String(row.OCN || '').trim();
          const company = String(row['Company Name'] || row.Company || 'Unknown').trim();

          if (npa.length === 3 && nxx.length === 3 && state) {
            db.run(
              `INSERT OR IGNORE INTO prefixes (npa, nxx, state, rateCenter, ocn, company) VALUES (?, ?, ?, ?, ?, ?)`,
              [npa, nxx, state, rateCenter, ocn, company]
            );
            imported++;
          }
        })
        .on('end', () => {
          console.log(`✅ Imported ${imported} prefixes from ${file}`);
          if (firstRow) {
            console.log(`   First row columns: ${Object.keys(firstRow).join(', ')}`);
          }
          resolve();
        })
        .on('error', (err) => {
          console.error('CSV error:', err.message);
          resolve();
        });
    });
  }
}

async function loadAllData() {
  console.log('=== Starting NANPA Data Load (Debug Version) ===');

  db.run('DELETE FROM prefixes', () => console.log('Previous data cleared.'));

  for (const item of filesToDownload) {
    try {
      const zipPath = await downloadFile(item.url, item.filename);
      const extractDir = await extractZip(zipPath);
      await importCsvToDb(extractDir);
    } catch (err) {
      console.error(`Error with ${item.filename}:`, err.message);
    }
  }

  db.get('SELECT COUNT(*) as count FROM prefixes', (err, row) => {
    const total = row ? row.count : 0;
    console.log(`\n🎉 Load completed! Total realistic prefixes loaded: ${total}`);

    if (total > 1000) {
      console.log('✅ Great! Database is now populated.');
    } else {
      console.log('⚠️ Still 0. The debug output above (especially "First row columns") will help us fix it.');
    }

    console.log('\nRun the server with: npm run dev');
    db.close();
  });
}

loadAllData();