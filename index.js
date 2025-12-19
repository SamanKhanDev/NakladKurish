const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

// --- Configuration ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Accept2';
const GOOGLE_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;


// --- Express App Setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.status(200).send('Server is running and healthy.');
});


// --- API Route ---
app.post('/', async (req, res) => {
  if (!SPREADSHEET_ID || !GOOGLE_CREDENTIALS) {
    console.error("Server configuration error: Missing SPREADSHEET_ID or GOOGLE_CREDENTIALS.");
    return res.status(500).json({ status: 'error', message: 'Server configuration error.' });
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

    // --- Prepare Row Data ---
    const newRow = [
      customId,
      `'${data.SANA}`,
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
    // Using '!A1' tells the API to start looking for the table from the very first cell.
    // This is crucial for correctly identifying the last filled row.
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`, 
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
