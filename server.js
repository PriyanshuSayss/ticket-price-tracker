require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Main SerpApi Gateway
app.get('/api/flights', async (req, res) => {
    try {
        const { source, destination, date } = req.query;
        const apiKey = process.env.SERPAPI_KEY;

        if (!apiKey || apiKey === 'YOUR_SERPAPI_KEY') {
           return res.status(500).json({ error: 'Missing or Invalid SerpApi Key. Check your .env file.'});
        }

        console.log(`[Backend] Searching Real Flights: ${source} to ${destination} on ${date}`);

        // Call Google Flights via SerpApi
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_flights',
                departure_id: source,
                arrival_id: destination,
                outbound_date: date,
                currency: 'INR',
                type: 2, // 2 = one-way
                api_key: apiKey
            }
        });

        // Ensure we send back the actual flights array
        if (response.data && response.data.best_flights) {
            // Merge best_flights and other_flights to give more options
            let flightsArray = [...response.data.best_flights];
            if (response.data.other_flights) {
               flightsArray = flightsArray.concat(response.data.other_flights);
            }
            res.json(flightsArray);
        } else {
            console.log("[Backend] No flights found in SerpApi response");
            res.status(404).json({ error: 'No flights found for this route.' });
        }

    } catch (error) {
        console.error('[Backend] SerpApi Error:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch flight data from SerpApi', details: error.message });
    }
});

// Sanity Check Endpoint
app.get('/api/health', (req, res) => res.json({ status: 'Backend is running correctly!' }));

app.listen(PORT, () => {
    console.log(`🚀 Flight API proxy server running securely on http://localhost:${PORT}`);
});
