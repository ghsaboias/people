const fs = require("fs");

// Read the graph data
const graphData = JSON.parse(fs.readFileSync("data/graph.json", "utf8"));

// Get all entity IDs
const allEntityIds = Object.keys(graphData.entities);

// Find all entities that appear in relationships
const connectedEntities = new Set();

graphData.relationships.forEach((rel) => {
  connectedEntities.add(rel.from);
  connectedEntities.add(rel.to);
});

// Find entities with 0 connections
const entitiesWithZeroConnections = allEntityIds.filter(
  (entityId) => !connectedEntities.has(entityId)
);

console.log("=== ENTITIES WITH 0 CONNECTIONS ===");
console.log(`Total entities: ${allEntityIds.length}`);
console.log(`Connected entities: ${connectedEntities.size}`);
console.log(
  `Entities with 0 connections: ${entitiesWithZeroConnections.length}`
);
console.log("");

if (entitiesWithZeroConnections.length > 0) {
  console.log("Entities with no connections:");
  entitiesWithZeroConnections.forEach((entityId) => {
    const entity = graphData.entities[entityId];
    console.log(`- ${entityId}: ${entity.name} (${entity.type})`);
  });
} else {
  console.log("All entities have at least one connection.");
}

console.log("");
console.log("=== CONNECTION STATISTICS ===");

// Count connections per entity
const connectionCounts = {};
allEntityIds.forEach((id) => (connectionCounts[id] = 0));

graphData.relationships.forEach((rel) => {
  connectionCounts[rel.from]++;
  connectionCounts[rel.to]++;
});

// Sort by connection count
const sortedByCounts = Object.entries(connectionCounts)
  .filter(([id]) => graphData.entities[id]) // Filter out any undefined entities
  .sort(([, a], [, b]) => b - a)
  .map(([id, count]) => ({
    id,
    name: graphData.entities[id].name,
    type: graphData.entities[id].type,
    connections: count,
  }));

console.log("Top 10 most connected entities:");
sortedByCounts.slice(0, 10).forEach((entity) => {
  console.log(
    `- ${entity.name} (${entity.type}): ${entity.connections} connections`
  );
});

console.log("");
console.log("Bottom 10 least connected entities:");
sortedByCounts.slice(-10).forEach((entity) => {
  console.log(
    `- ${entity.name} (${entity.type}): ${entity.connections} connections`
  );
});
