module.exports = `
SELECT
    schemaName = FK.TABLE_SCHEMA,
    pureName = FK.TABLE_NAME,
    columnName = CU.COLUMN_NAME,

    refSchemaName = ISNULL(IXS.name, PK.TABLE_SCHEMA),
    refTableName = ISNULL(IXT.name, PK.TABLE_NAME),
    refColumnName = IXCC.name,

    constraintName = C.CONSTRAINT_NAME,
    updateAction = rc.UPDATE_RULE,
    deleteAction = rc.DELETE_RULE,

    objectId = o.object_id 
FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS C
INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS FK 
    ON C.CONSTRAINT_NAME = FK.CONSTRAINT_NAME
    AND C.CONSTRAINT_SCHEMA = FK.CONSTRAINT_SCHEMA

LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS PK 
    ON C.UNIQUE_CONSTRAINT_NAME = PK.CONSTRAINT_NAME
    AND C.UNIQUE_CONSTRAINT_SCHEMA = PK.CONSTRAINT_SCHEMA

LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU 
    ON C.CONSTRAINT_NAME = CU.CONSTRAINT_NAME
    AND C.CONSTRAINT_SCHEMA = CU.CONSTRAINT_SCHEMA

INNER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc 
    ON FK.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    AND FK.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA

LEFT JOIN sys.indexes IX 
    ON IX.name = C.UNIQUE_CONSTRAINT_NAME
    AND IX.object_id = OBJECT_ID(PK.TABLE_SCHEMA + '.' + PK.TABLE_NAME)

LEFT JOIN sys.objects IXT 
    ON IXT.object_id = IX.object_id

LEFT JOIN sys.index_columns IXC 
    ON IX.object_id = IXC.object_id 
    AND IX.index_id = IXC.index_id

LEFT JOIN sys.columns IXCC 
    ON IXCC.object_id = IXC.object_id
    AND IXCC.column_id = IXC.column_id

LEFT JOIN sys.schemas IXS 
    ON IXT.schema_id = IXS.schema_id

INNER JOIN sys.objects o 
    ON o.name = FK.TABLE_NAME
    AND SCHEMA_NAME(o.schema_id) = FK.TABLE_SCHEMA

INNER JOIN sys.schemas s 
    ON o.schema_id = s.schema_id
    AND s.name = FK.TABLE_SCHEMA

where o.object_id =OBJECT_ID_CONDITION and s.name =SCHEMA_NAME_CONDITION
`;
