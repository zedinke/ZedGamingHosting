SET sql_mode = '';
UPDATE Node SET updatedAt=NOW();
UPDATE Node SET createdAt=NOW();
SELECT id, name, updatedAt FROM Node;
