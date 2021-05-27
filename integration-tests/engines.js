const engines = [
  {
    label: 'MySQL',
    connection: {
      engine: 'mysql@dbgate-plugin-mysql',
      server: 'localhost',
      password: 'Pwd2020Db',
      user: 'root',
      port: 15001,
    },
  },
  {
    label: 'PostgreSQL',
    connection: {
      engine: 'postgres@dbgate-plugin-postgres',
      server: 'localhost',
      password: 'Pwd2020Db',
      user: 'postgres',
      port: 15000,
    },
  },
  {
    label: 'SQL Server',
    connection: {
      engine: 'mssql@dbgate-plugin-mssql',
      server: 'localhost',
      password: 'Pwd2020Db',
      user: 'sa',
      port: 15002,
    },
  },
];

module.exports = engines;
