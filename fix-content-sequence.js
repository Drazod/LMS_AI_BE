const { Client } = require('pg');

async function fixContentSequence() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'lms_dev'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check current content records
    const contentResult = await client.query('SELECT id FROM content ORDER BY id;');
    console.log('Existing content IDs:', contentResult.rows.map(row => row.id));

    // Check current sequence value
    const sequenceResult = await client.query("SELECT currval('content_id_seq') AS current_value;");
    console.log('Current sequence value:', sequenceResult.rows[0]?.current_value);

    // Get max ID from content table
    const maxIdResult = await client.query('SELECT COALESCE(MAX(id), 0) AS max_id FROM content;');
    const maxId = maxIdResult.rows[0].max_id;
    console.log('Max ID in content table:', maxId);

    // Fix sequence to be greater than max ID
    const newSequenceValue = maxId + 1;
    await client.query(`SELECT setval('content_id_seq', ${newSequenceValue}, false);`);
    console.log(`Fixed sequence to start from ${newSequenceValue}`);

    // Verify the fix
    const newSequenceResult = await client.query("SELECT currval('content_id_seq') AS current_value;");
    console.log('New sequence value:', newSequenceResult.rows[0]?.current_value);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixContentSequence();