const _ = require('lodash');
const stream = require('stream');
const driverBase = require('../frontend/driver');
const Analyser = require('./Analyser');
const cassandra = require('cassandra-driver');
const createCassandraBulkInsertStream = require('./createBulkInsertStream.js');

function getTypeName(code) {
  return Object.keys(cassandra.types.dataTypes).find((key) => cassandra.types.dataTypes[key] === code);
}

/** @type {import('dbgate-types').EngineDriver<cassandra.Client>} */
const driver = {
  ...driverBase,
  analyserClass: Analyser,
  // creating connection
  async connect({ server, user, password, database, localDataCenter, useDatabaseUrl, databaseUrl }) {
    const client = new cassandra.Client({
      // user,
      // password,
      contactPoints: server.split(','),
      localDataCenter: localDataCenter ?? this.defaultLocalDataCenter,
      keyspace: database,
    });

    client.connect();

    return {
      client,
      database,
    };
  },

  // called for retrieve data (eg. browse in data grid) and for update database
  async query(dbhan, query, options) {
    const offset = options?.range?.offset;
    if (options?.discardResult) {
      await dbhan.client.execute(query);
      return {
        rows: [],
        columns: [],
      };
    }
    const result = await dbhan.client.execute(query);
    if (!result.rows?.[0]) {
      return {
        rows: [],
        columns: [],
      };
    }

    const columns = result.columns.map(({ name, type: { code } }) => ({
      columnName: name,
      dataType: getTypeName(code),
    }));

    return {
      rows: offset ? result.rows.slice(offset) : result.rows,
      columns,
    };
  },
  // called in query console
  async stream(dbhan, query, options) {
    try {
      if (!query.match(/^\s*SELECT/i)) {
        await dbhan.client.execute(query);
        options.done();
        return;
      }

      const strm = dbhan.client.stream(query);

      strm.on('readable', () => {
        let row;
        while ((row = strm.read())) {
          options.row(row);
        }
      });

      strm.on('end', () => {
        options.done();
      });

      strm.on('error', (err) => {
        options.info({
          message: err.toString(),
          time: new Date(),
          severity: 'error',
        });
        options.done();
      });
    } catch (err) {
      const mLine = err.message.match(/\(line (\d+)\,/);
      let line = undefined;
      if (mLine) {
        line = parseInt(mLine[1]) - 1;
      }

      options.info({
        message: err.message,
        time: new Date(),
        severity: 'error',
        line,
      });
      options.done();
    }
  },
  // called when exporting table or view
  async readQuery(dbhan, query, structure) {
    const pass = new stream.PassThrough({
      objectMode: true,
      highWaterMark: 100,
    });

    const strm = dbhan.client.stream(query);

    strm.on('readable', () => {
      let row;
      while ((row = strm.read())) {
        pass.write(row);
      }
    });

    strm.on('end', () => {
      pass.end();
    });

    strm.on('error', (err) => {
      pass.info({
        message: err.toString(),
        time: new Date(),
        severity: 'error',
      });
      pass.end();
    });

    return pass;
  },
  async writeTable(dbhan, name, options) {
    return createCassandraBulkInsertStream(this, stream, dbhan, name, options);
  },
  // detect server version
  async getVersion(dbhan) {
    const result = await dbhan.client.execute('SELECT release_version from system.local');
    return { version: result.rows[0].release_version };
  },
  // list databases on server
  async listDatabases(dbhan) {
    const result = await dbhan.client.execute(
      "SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name >= 'system' ALLOW FILTERING"
    );
    return result.rows.map((row) => ({ name: row.keyspace_name }));
  },

  async close(dbhan) {
    return dbhan.client.shutdown();
  },
};

module.exports = driver;
