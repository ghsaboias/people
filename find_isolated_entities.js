const fs = require("fs");
const data = JSON.parse(fs.readFileSync("data/graph.json", "utf8"));

// Get all entities
const allEntities = Object.entries(data.entities).map(([id, entity]) => ({
  id,
  name: entity.name,
  type: entity.type,
}));

// Get all entities that appear in relationships
const connectedEntities = new Set();
data.relationships.forEach((rel) => {
  connectedEntities.add(rel.from);
  connectedEntities.add(rel.to);
});

// Find isolated entities
const isolatedEntities = allEntities.filter(
  (entity) => !connectedEntities.has(entity.id)
);

// Group by type
const isolatedByType = isolatedEntities.reduce((acc, entity) => {
  if (!acc[entity.type]) acc[entity.type] = [];
  acc[entity.type].push(entity);
  return acc;
}, {});

console.log("=== ISOLATED ENTITIES (NO CONNECTIONS) ===");
console.log(`Total entities: ${allEntities.length}`);
console.log(`Connected entities: ${connectedEntities.size}`);
console.log(`Isolated entities: ${isolatedEntities.length}`);

Object.entries(isolatedByType).forEach(([type, entities]) => {
  console.log(`\n${type.toUpperCase()}S WITHOUT CONNECTIONS:`);
  entities.forEach((entity, index) => {
    console.log(`${index + 1}. ${entity.name} (id: ${entity.id})`);
  });
});
