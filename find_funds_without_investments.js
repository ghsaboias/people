const fs = require("fs");
const data = JSON.parse(fs.readFileSync("data/graph.json", "utf8"));

// Get all funds
const funds = Object.entries(data.entities)
  .filter(([id, entity]) => entity.type === "fund")
  .map(([id, entity]) => ({ id, name: entity.name }));

// Get all investment relationships
const investmentRelationships = data.relationships.filter(
  (rel) => rel.type === "invests_in"
);

// Find funds that have investments
const fundsWithInvestments = new Set(
  investmentRelationships.map((rel) => rel.from)
);

// Find funds without investments
const fundsWithoutInvestments = funds.filter(
  (fund) => !fundsWithInvestments.has(fund.id)
);

console.log("=== FUNDS WITHOUT INVESTMENTS ===");
console.log(`Total funds: ${funds.length}`);
console.log(`Funds with investments: ${fundsWithInvestments.size}`);
console.log(`Funds without investments: ${fundsWithoutInvestments.length}`);
console.log("\nFunds without investments:");
fundsWithoutInvestments.forEach((fund, index) => {
  console.log(`${index + 1}. ${fund.name} (id: ${fund.id})`);
});

// Also show investment activity summary
console.log("\n=== INVESTMENT ACTIVITY SUMMARY ===");
const investmentCounts = {};
investmentRelationships.forEach((rel) => {
  investmentCounts[rel.from] = (investmentCounts[rel.from] || 0) + 1;
});

const sortedFunds = Object.entries(investmentCounts)
  .map(([fundId, count]) => {
    const fund = data.entities[fundId];
    return { name: fund?.name || fundId, count };
  })
  .sort((a, b) => b.count - a.count);

console.log("Most active investors:");
sortedFunds.slice(0, 10).forEach((fund, index) => {
  console.log(`${index + 1}. ${fund.name}: ${fund.count} investments`);
});
