const express = require('express');
const { google } = require('googleapis');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  next();
});

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

app.post('/', async (req, res) => {
  const data = req.body;
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).send({ error: 'Bad Request: No data provided.' });
  }

  try {
    const { SPREADSHEET_ID, SHEET_NAME, GOOGLE_APPLICATION_CREDENTIALS } = process.env;
    if (!SPREADSHEET_ID || !SHEET_NAME || !GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error("Server configuration is missing.");
    }
    
    // Set the credentials
    process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_APPLICATION_CREDENTIALS;
    
    const auth = new google.auth.GoogleAuth({ 
      keyFile: GOOGLE_APPLICATION_CREDENTIALS,
      scopes: SCOPES 
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const row = [
      data.ID, data.DATE_TIME, data.CONCRETE_VOLUME_m3, data.GRADE,
      data.MIXER_NUMBER, data.PUMP_NUMBER, data.DRIVER_NAME,
      data.CLIENT_NAME, data.SITE_NAME, data.INVOICE_NUMBER,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).json({ success: true, message: "Ma'lumotlar Google Sheets'ga muvaffaqiyatli saqlandi!" });
  } catch (error) {
    console.error('Error appending to sheet:', error.message);
    res.status(500).send({ error: 'Internal Server Error: Could not append to sheet.' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});