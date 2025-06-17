const fs = require("fs");
const data = JSON.parse(fs.readFileSync("data/graph.json", "utf8"));

// Get all companies
const companies = Object.entries(data.entities)
  .filter(([id, entity]) => entity.type === "company")
  .map(([id, entity]) => ({ id, name: entity.name }));

// Get all CEO relationships
const ceoRelationships = data.relationships.filter(
  (rel) => rel.type === "ceo_of" || rel.type === "founder_and_ceo_of"
);

// Find companies that have CEOs
const companiesWithCEOs = new Set(ceoRelationships.map((rel) => rel.to));

// Find companies without CEOs
const companiesWithoutCEOs = companies.filter(
  (company) => !companiesWithCEOs.has(company.id)
);

console.log("=== COMPANIES WITHOUT CEOs ===");
console.log(`Total companies: ${companies.length}`);
console.log(`Companies with CEOs: ${companiesWithCEOs.size}`);
console.log(`Companies without CEOs: ${companiesWithoutCEOs.length}`);
console.log("");

if (companiesWithoutCEOs.length > 0) {
  console.log("Companies without CEOs:");
  companiesWithoutCEOs.forEach((company, index) => {
    console.log(`${index + 1}. ${company.name} (id: ${company.id})`);
  });
} else {
  console.log("All companies have CEOs assigned.");
}
