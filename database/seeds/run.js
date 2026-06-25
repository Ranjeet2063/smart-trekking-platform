require('dotenv').config({ path: require('path').join(__dirname, '..', '..', 'backend', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function runSeeds() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  });

  try {
    const demoUsers = [
      {
        email: '123@demo.com',
        password: '123',
        name: 'Demo',
        role: 'trekker',
      },
      {
        email: 'family@demo.com',
        password: 'Family@123',
        name: 'Family Demo',
        role: 'family',
      },
      {
        email: 'rescue@demo.com',
        password: 'Rescue@123',
        name: 'Rescue Demo',
        role: 'rescue',
      },
    ];

    for (const user of demoUsers) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length > 0) {
        console.log(`Demo user already exists: ${user.email}`);
        continue;
      }

      const password_hash = await bcrypt.hash(user.password, 12);
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role, auth_provider, is_verified)
         VALUES ($1, $2, $3, $4, 'local', true)`,
        [user.email, password_hash, user.name, user.role]
      );
      console.log(`Created demo user: ${user.email}`);
    }

    console.log('\n=== DEMO ACCOUNTS ===');
    console.log('| Email           | Password     | Role     |');
    console.log('|-----------------|--------------|----------|');
    console.log('| 123@demo.com    | 123          | trekker  |');
    console.log('| family@demo.com | Family@123   | family   |');
    console.log('| rescue@demo.com | Rescue@123   | rescue   |');
    console.log('=====================');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeeds();
