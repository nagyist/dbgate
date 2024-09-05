const { driverBase } = global.DBGATE_PACKAGES['dbgate-tools'];
const Dumper = require('./Dumper');
const { oracleSplitterOptions } = require('dbgate-query-splitter/lib/options');

const spatialTypes = ['GEOGRAPHY'];

/** @type {import('dbgate-types').SqlDialect} */
const dialect = {
  rangeSelect: true,
  limitSelect: false,
  offsetFetchRangeSyntax: true,
  ilike: true,
  // stringEscapeChar: '\\',
  stringEscapeChar: "'",
  fallbackDataType: 'varchar',
  anonymousPrimaryKey: true,
  enableConstraintsPerTable: true,
  dropColumnDependencies: ['dependencies'],
  quoteIdentifier(s) {
    return '"' + s + '"';
  },

  createColumn: true,
  dropColumn: true,
  changeColumn: true,
  createIndex: true,
  dropIndex: true,
  createForeignKey: true,
  dropForeignKey: true,
  createPrimaryKey: true,
  dropPrimaryKey: true,
  createUnique: true,
  dropUnique: true,
  createCheck: true,
  dropCheck: true,

  dropReferencesWhenDropTable: true,
  requireFromDual: true,

  predefinedDataTypes: [
    'VARCHAR2',
    'NUMBER',
    'DATE',
    'CLOB',
    'BLOB',
    'INTEGER',

    'BFILE',
    'BINARY_DOUBLE',
    'BINARY_FLOAT',
    'CHAR',
    'FLOAT',
    'INTERVAL DAY',
    'INTERVAL YEAR',
    'LONG',
    'LONG RAW',
    'NCHAR',
    'NCLOB',
    'NVARCHAR2',
    'RAW',
    'ROWID',
    'TIMESTAMP',
    'UROWID',
    // 'XMLTYPE',
  ],

  createColumnViewExpression(columnName, dataType, source, alias) {
    if (dataType && spatialTypes.includes(dataType.toUpperCase())) {
      return {
        exprType: 'call',
        func: 'ST_AsText',
        alias: alias || columnName,
        args: [
          {
            exprType: 'column',
            columnName,
            source,
          },
        ],
      };
    }
  },
};

/** @type {import('dbgate-types').EngineDriver} */
const oracleDriver = {
  ...driverBase,
  engine: 'oracle@dbgate-plugin-oracle',
  title: 'OracleDB',
  defaultPort: 1521,
  authTypeLabel: 'Driver mode',
  defaultAuthTypeName: 'thin',
  dialect,
  dumperClass: Dumper,
  // showConnectionField: (field, values) =>
  //   ['server', 'port', 'user', 'password', 'defaultDatabase', 'singleDatabase'].includes(field),
  getQuerySplitterOptions: () => oracleSplitterOptions,
  readOnlySessions: true,

  databaseUrlPlaceholder: 'e.g. localhost:1521/orcl',

  showConnectionField: (field, values, { config }) => {
    if (field == 'useDatabaseUrl') return true;
    if (field == 'authType') return true;
    if (field == 'clientLibraryPath') return config?.isElectron && values.authType == 'thick';

    if (values.useDatabaseUrl) {
      return ['databaseUrl', 'user', 'password'].includes(field);
    }

    return ['user', 'password', 'server', 'port', 'serviceName'].includes(field);
  },

  getNewObjectTemplates() {
    return [
      { label: 'New view', sql: 'CREATE VIEW myview\nAS\nSELECT * FROM table1' },
      { label: 'New materialized view', sql: 'CREATE MATERIALIZED VIEW myview\nAS\nSELECT * FROM table1' },
      {
        label: 'New procedure',
        sql: `CREATE PROCEDURE myproc (arg1 INT)
LANGUAGE SQL
AS $$
  SELECT * FROM table1;
$$`,
      },
      {
        label: 'New function (plpgsql)',
        sql: `CREATE FUNCTION myfunc (arg1 INT)
RETURNS INT
AS $$
BEGIN
  RETURN 1;
END
$$ LANGUAGE plpgsql;`,
      },
    ];
  },

  dialectByVersion(version) {
    if (version) {
      return {
        ...dialect,
        materializedViews:
          version &&
          version.versionMajor != null &&
          version.versionMinor != null &&
          (version.versionMajor > 9 || version.versionMajor == 9 || version.versionMinor >= 3),
      };
    }
    return dialect;
  },

  showConnectionTab: field => field == 'sshTunnel',
};

module.exports = oracleDriver;