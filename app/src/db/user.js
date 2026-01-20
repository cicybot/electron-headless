const {pool} = require('../db'); // your pool file

const userDB = {
    // Setup table
    async initTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `;
        return await pool.query(sql);
    },

    async createUser(username, email) {
        const res = await pool.query(
            'INSERT INTO users (username, email) VALUES (?, ?)',
            [username, email]
        );
        const [result] = res;
        return result.insertId;
    },

    async getUsers() {
        const [rows] = await pool.query('SELECT * FROM users');
        return rows;
    },

    async updateUser(id, email) {
        return await pool.query('UPDATE users SET email = ? WHERE id = ?', [email, id]);
    },

    async deleteUser(id) {
        return await pool.query('DELETE FROM users WHERE id = ?', [id]);
    }
};

module.exports = userDB;