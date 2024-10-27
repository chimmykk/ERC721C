// lib/db.js
const { Client } = require('ssh2');
const mysql = require('mysql2/promise');

let pool;

async function getDbConnection() {
    if (pool) return pool;  // Return existing pool if it exists

    const sshConfig = {
        host: '167.172.141.218',
        port: 22,
        username: 'forge',
        privateKey: `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`,
    };

    const forwardPort = new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.forwardOut('127.0.0.1', 0, '127.0.0.1', 3306, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(stream);
            });
        }).on('error', (err) => {
            reject(err);
        }).connect(sshConfig);
    });

    try {
        const stream = await forwardPort;

        // Create a MySQL connection pool using the SSH tunnel stream
        pool = mysql.createPool({
            host: '127.0.0.1',  // Use localhost since SSH tunnel will forward to local
            port: 3306,         // Local port forwarded by SSH tunnel
            user: 'forge',      // Replace with your MySQL username
            password: 'BzTrfKJ4ekWKTx7pNiGX',  // Your MySQL password
            database: 'forge',  // Your database name
            stream: stream,     // Use the SSH tunnel stream
        });

        return pool;
    } catch (error) {
        console.error('Database Connection Error:', error);
        throw new Error('Unable to connect to the database');
    }
}

// Export the function using CommonJS syntax
module.exports = { getDbConnection };
