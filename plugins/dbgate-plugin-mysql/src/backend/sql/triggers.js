module.exports = `
SELECT 
    TRIGGER_NAME AS triggerName,
    EVENT_MANIPULATION AS eventType,
    ACTION_TIMING AS triggerTiming,
    EVENT_OBJECT_SCHEMA AS schemaName,
    EVENT_OBJECT_TABLE AS tableName,
    ACTION_STATEMENT AS definition,
    CREATED as modifyDate
FROM 
    INFORMATION_SCHEMA.TRIGGERS
    WHERE EVENT_OBJECT_SCHEMA = '#DATABASE#' AND TRIGGER_NAME =OBJECT_ID_CONDITION
`;
