
const { pool } = require('../src/db');
const userDB = require('../src/db/user');

describe('User CRUD Operations', () => {
    let testUserId;

    // 1. SETUP: Create table and clean old data
    beforeAll(async () => {

        await userDB.initTable();
        // Optional: Clear table so tests are idempotent
    });

    // 2. CLOSE: Disconnect after tests finish
    afterAll(async () => {
        await pool.end();
    });

    it('should CREATE a new user', async () => {
        testUserId = await userDB.createUser('jack', 'jack@example.com');
        console.log('Created user ID:', testUserId);
    });

    it('should READ users', async () => {
        const users = await userDB.getUsers();
        console.log('Users:', users);
    });

    it('should UPDATE a user', async () => {
        await userDB.updateUser(testUserId, 'newjack@example.com');
        const res = await pool.query('SELECT email FROM users WHERE id = ?', [testUserId]);
        const [rows] = res;
        console.log('Updated email:', rows[0].email);
    });

    it('should DELETE a user', async () => {
        await userDB.deleteUser(testUserId);
        const res = await pool.query('SELECT * FROM users WHERE id = ?', [testUserId]);
        const [rows] = res;
        console.log('Remaining rows:', rows.length);
    });
});