const fs = require("fs");
const data = JSON.parse(fs.readFileSync("data/graph.json", "utf8"));

// Get all companies
const companies = Object.entries(data.entities)
  .filter(([id, entity]) => entity.type === "company")
  .map(([id, entity]) => ({ id, name: entity.name }));

// Get all founder relationships
const founderRelationships = data.relationships.filter(
  (rel) => rel.type === "founder_of" || rel.type === "founder_and_ceo_of"
);

// Find companies that have founders
const companiesWithFounders = new Set(
  founderRelationships.map((rel) => rel.to)
);

// Find companies without founders
const companiesWithoutFounders = companies.filter(
  (company) => !companiesWithFounders.has(company.id)
);

console.log("=== COMPANIES WITHOUT FOUNDERS ===");
console.log(`Total companies: ${companies.length}`);
console.log(`Companies with founders: ${companiesWithFounders.size}`);
console.log(`Companies without founders: ${companiesWithoutFounders.length}`);
console.log("\nCompanies without founders:");
companiesWithoutFounders.forEach((company, index) => {
  console.log(`${index + 1}. ${company.name} (id: ${company.id})`);
});
