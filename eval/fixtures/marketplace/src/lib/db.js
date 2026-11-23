const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({ connectionString: config.databaseUrl });

const query = async (sql, params = []) => (await pool.query(sql, params)).rows;

const find = (table, where = {}, { limit = 50, offset = 0 } = {}) => {
  const keys = Object.keys(where);
  const clause = keys.length ? 'WHERE ' + keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ') : '';
  return query(`SELECT * FROM ${table} ${clause} LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, keys.map((k) => where[k]));
};
const findOne = async (table, where) => (await find(table, where, { limit: 1 }))[0];
const insert = async (table, data) => {
  const keys = Object.keys(data);
  const rows = await query(`INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, keys.map((k) => data[k]));
  return rows[0];
};
const update = async (table, id, data) => {
  const keys = Object.keys(data).filter((k) => k !== 'id');
  const rows = await query(`UPDATE ${table} SET ${keys.map((k, i) => `"${k}" = $${i + 1}`).join(',')} WHERE id = $${keys.length + 1} RETURNING *`, [...keys.map((k) => data[k]), id]);
  return rows[0];
};
const remove = (table, id) => query(`DELETE FROM ${table} WHERE id = $1`, [id]);

module.exports = { query, find, findOne, insert, update, remove };
