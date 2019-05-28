/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Manage MySQL database connections.                                                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import mysql from 'mysql2/promise.js'; // fast mysql driver
import Debug from 'debug';             // small debugging utility

const debug = Debug('app:mysql'); // mysql db queries

let connectionPool = null;


class MysqlDb {
    static async query(sql, values) {
        if (!connectionPool) await setupConnectionPool();
        debug('MysqlDb.query', sql, values);

        return connectionPool.query(sql, values);
    }

    static async connect() {
        if (!connectionPool) await setupConnectionPool();
        debug('MysqlDb.connect');

        const db = await global.connectionPool.getConnection();

        return db;
    }
}


/**
 * First connection request after app startup will set up connection pool.
 */
async function setupConnectionPool() {
    const connectionString = process.env.DB_MYSQL_CONNECTION;
    if (!connectionString) throw new Error('No DB_MYSQL_CONNECTION available');

    const dbConfigKeyVal = connectionString.split(';').map(v => v.trim().split('='));
    const dbConfig = dbConfigKeyVal.reduce((config, v) => { config[v[0].toLowerCase()] = v[1]; return config; }, {});
    dbConfig.namedPlaceholders = true;
    connectionPool = mysql.createPool(dbConfig);
    debug('MysqlDb.setupConnectionPool', `connect to ${dbConfig.host}/${dbConfig.database}`);

    await connectionPool.query('SET SESSION sql_mode = "TRADITIONAL"');
}

export default MysqlDb;
