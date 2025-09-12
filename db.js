const Pool = require('pg').Pool;

const pool = new Pool({
  connectionString: process.env.HEROKU_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.connect();

pool.query('SELECT table_scheman, table_name FROM information_scema.tables;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  pool.end();
});

module.exports = pool;
