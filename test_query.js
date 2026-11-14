const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./apps/server/db/markflow.db');

const userId = 2; // Suppose user 2
const parentId = null;

let query = `
WITH RECURSIVE visible_nodes AS (
  SELECT id, parent_id, node_type, title, status, creator_id, sort_order
  FROM tree_nodes
  WHERE creator_id = ? OR id IN (SELECT target_id FROM share_links)
  
  UNION
  
  SELECT t.id, t.parent_id, t.node_type, t.title, t.status, t.creator_id, t.sort_order
  FROM tree_nodes t
  JOIN visible_nodes v ON t.id = v.parent_id
)
SELECT DISTINCT * FROM visible_nodes
WHERE ${parentId ? 'parent_id = ?' : 'parent_id IS NULL'}
ORDER BY sort_order ASC, id ASC
`;

db.all(query, parentId ? [userId, parentId] : [userId], (err, rows) => {
  if (err) console.error(err);
  else console.log(rows);
});
