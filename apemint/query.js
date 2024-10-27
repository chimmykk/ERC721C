const express = require('express');
const { getDbConnection } = require('./lib/db'); // Adjust the path as necessary

const app = express();
const PORT = 8080;

// API endpoint to fetch collections
app.get('/getdata', async (req, res) => {
    const pool = await getDbConnection();

    try {
        // Get the current time and subtract 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

        const [results] = await pool.query(`
            SELECT * 
            FROM collections 
            WHERE chain_id = "33139" 
            AND created_at >= ?
        `, [oneHourAgo]);

        if (results.length > 0) {
            res.json(results); // Send all matching collections
        } else {
            res.status(404).json({ message: 'No collections found for the specified criteria.' });
        }
    } catch (error) {
        console.error('Error fetching data from collections table:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (pool) {
            await pool.end(); // Close the connection
        }
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
