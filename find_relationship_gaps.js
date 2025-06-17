const fs = require("fs");
const data = JSON.parse(fs.readFileSync("data/graph.json", "utf8"));

console.log("=== RELATIONSHIP GAPS ANALYSIS ===\n");

// 1. Find companies with only one founder (might be missing co-founders)
const founderRelationships = data.relationships.filter(
  (rel) => rel.type === "founder_of" || rel.type === "founder_and_ceo_of"
);

const companiesFounderCount = {};
founderRelationships.forEach((rel) => {
  companiesFounderCount[rel.to] = (companiesFounderCount[rel.to] || 0) + 1;
});

const singleFounderCompanies = Object.entries(companiesFounderCount)
  .filter(([companyId, count]) => count === 1)
  .map(([companyId]) => ({
    id: companyId,
    name: data.entities[companyId]?.name || companyId,
  }));

console.log("COMPANIES WITH ONLY ONE FOUNDER (might be missing co-founders):");
singleFounderCompanies.forEach((company, index) => {
  console.log(`${index + 1}. ${company.name}`);
});

// 2. Find missing acquisition relationships
console.log("\n=== POTENTIAL MISSING ACQUISITIONS ===");
const ownedCompanies = data.relationships
  .filter((rel) => rel.type === "owns_equity_in")
  .map((rel) => ({
    parent: data.entities[rel.from]?.name,
    child: data.entities[rel.to]?.name,
  }));

console.log("Current ownership relationships:");
ownedCompanies.forEach((rel) => {
  console.log(`- ${rel.parent} owns ${rel.child}`);
});

// 3. Find people who might be missing "ex_employee_of" relationships
console.log("\n=== POTENTIAL MISSING CAREER TRANSITIONS ===");
const ceoRelationships = data.relationships.filter(
  (rel) => rel.type === "ceo_of"
);
const founderCeoRelationships = data.relationships.filter(
  (rel) => rel.type === "founder_and_ceo_of"
);

console.log(
  "People who are CEOs but not founders (might have previous career history):"
);
ceoRelationships.forEach((rel) => {
  const person = data.entities[rel.from];
  const company = data.entities[rel.to];

  // Check if they're also a founder of this company
  const isFounder = founderRelationships.some(
    (fRel) => fRel.from === rel.from && fRel.to === rel.to
  );

  if (!isFounder) {
    console.log(`- ${person?.name} is CEO of ${company?.name} (not founder)`);
  }
});

// 4. Find potential supplier/customer relationships
console.log("\n=== EXISTING SUPPLY CHAIN RELATIONSHIPS ===");
const supplyRelationships = data.relationships.filter(
  (rel) => rel.type === "supplies_to" || rel.type === "supplier_to"
);

console.log("Current supply chain connections:");
supplyRelationships.forEach((rel) => {
  const supplier = data.entities[rel.from];
  const customer = data.entities[rel.to];
  console.log(`- ${supplier?.name} supplies to ${customer?.name}`);
});
