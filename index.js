const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

// --- Configuration ---
// These values should be set as environment variables in your Render service.
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Accept';
const GOOGLE_CREDENTIALS = process.env.GOOGLE_CREDENTIALS;


// --- Express App Setup ---
const app = express();
// FIX: Use a more permissive CORS policy to allow requests from any origin.
// This resolves the "Failed to fetch" error commonly seen in browser-based clients.
app.use(cors());
app.use(express.json());

// --- Health Check Route ---
app.get('/', (req, res) => {
  // Check environment variables
  const configStatus = {
    SPREADSHEET_ID: SPREADSHEET_ID ? 'SET' : 'MISSING',
    GOOGLE_CREDENTIALS: GOOGLE_CREDENTIALS ? 'SET' : 'MISSING',
    SHEET_NAME: SHEET_NAME
  };
  
  res.status(200).send(`
    <h1>Sahifaga salom run bo'lomqda</h1>
    <h2>Configuration Status:</h2>
    <ul>
      <li>SPREADSHEET_ID: ${configStatus.SPREADSHEET_ID}</li>
      <li>GOOGLE_CREDENTIALS: ${configStatus.GOOGLE_CREDENTIALS}</li>
      <li>SHEET_NAME: ${configStatus.SHEET_NAME}</li>
    </ul>
    <p>${SPREADSHEET_ID && GOOGLE_CREDENTIALS 
      ? '✅ All required environment variables are set. Service is ready to accept data.' 
      : '❌ Missing required environment variables. Please configure SPREADSHEET_ID and GOOGLE_CREDENTIALS in Render.'}</p>
  `);
});

// --- Configuration Status API ---
app.get('/config', (req, res) => {
  const configStatus = {
    SPREADSHEET_ID: SPREADSHEET_ID ? 'SET' : 'MISSING',
    GOOGLE_CREDENTIALS: GOOGLE_CREDENTIALS ? 'SET' : 'MISSING',
    SHEET_NAME: SHEET_NAME,
    allSet: !!(SPREADSHEET_ID && GOOGLE_CREDENTIALS)
  };
  
  res.status(200).json(configStatus);
});

// --- API Route ---
app.post('/', async (req, res) => {
  if (!SPREADSHEET_ID || !GOOGLE_CREDENTIALS) {
    console.error("Server configuration error: Missing SPREADSHEET_ID or GOOGLE_CREDENTIALS.");
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server configuration error.',
      details: {
        SPREADSHEET_ID: SPREADSHEET_ID ? 'SET' : 'MISSING',
        GOOGLE_CREDENTIALS: GOOGLE_CREDENTIALS ? 'SET' : 'MISSING'
      },
      solution: 'Please set SPREADSHEET_ID and GOOGLE_CREDENTIALS environment variables in Render dashboard.'
    });
  }
  
  try {
    const data = req.body;

    // --- Authentication with Service Account Key ---
    const credentials = JSON.parse(GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // --- Generate Custom ID ---
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const customId = `${year}${month}${day}${hours}${minutes}${seconds}${random}`;

    // --- Prepare Row Data (in the specified order) ---
    const newRow = [
      customId,
      data.SANA,
      data["BETON_SIG'IMI"],
      data.MARKA,
      data.MIKSER_RAQAM,
      data.NASOS_RAQAM,
      data.SHAFYOR_ISM,
      data.FIRMA,
      data.PLASHADKA,
      data.NAKLADNOY_RAQAMI,
    ];

    // --- Append to Google Sheet ---
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
      },
    });

    res.status(200).json({ status: 'success', message: 'Data saved successfully.' });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ status: 'error', message: error.message || 'An internal server error occurred.' });
  }
});

// --- Server Listener ---
// Render provides the PORT environment variable.
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
