const fs = require("fs");
const data = JSON.parse(fs.readFileSync("data/graph.json", "utf8"));

// Get all investment relationships
const investments = data.relationships.filter(
  (rel) => rel.type === "invests_in"
);

// Get all board relationships
const boardRelationships = data.relationships.filter(
  (rel) => rel.type === "board_member_of" || rel.type === "ex_board_member_of"
);

// Create a map of companies that have board members
const companiesWithBoardMembers = new Set(
  boardRelationships.map((rel) => rel.to)
);

// Create a map of fund->company investments
const fundInvestments = new Map();
investments.forEach((rel) => {
  if (!fundInvestments.has(rel.from)) {
    fundInvestments.set(rel.from, []);
  }
  fundInvestments.get(rel.from).push(rel.to);
});

// Find major funds that invest in companies but don't have board representation
console.log("=== POTENTIAL MISSING BOARD CONNECTIONS ===");
console.log(
  "Major funds investing in companies without apparent board seats:\n"
);

fundInvestments.forEach((companies, fundId) => {
  const fund = data.entities[fundId];
  if (!fund || fund.type !== "fund") return;

  // Check if this fund has board members on the companies they invest in
  const fundBoardSeats = boardRelationships.filter((rel) => {
    // Check if any person from this fund sits on boards of invested companies
    const person = data.entities[rel.from];
    if (!person) return false;

    // Check if this person is associated with the fund
    const personFundRelations = data.relationships.filter(
      (r) =>
        r.from === rel.from &&
        r.to === fundId &&
        (r.type === "founder_of" || r.type === "partner_of")
    );

    return personFundRelations.length > 0 && companies.includes(rel.to);
  });

  if (companies.length >= 3 && fundBoardSeats.length === 0) {
    console.log(`${fund.name}:`);
    console.log(
      `  Invests in ${companies.length} companies but no apparent board seats`
    );
    console.log(
      `  Companies: ${companies
        .map((id) => data.entities[id]?.name || id)
        .join(", ")}`
    );
    console.log("");
  }
});

// Find companies with significant investment but no board members at all
console.log("\n=== COMPANIES WITHOUT ANY BOARD MEMBERS ===");
const companiesWithInvestments = new Set(investments.map((rel) => rel.to));
const companiesWithoutBoards = [...companiesWithInvestments].filter(
  (companyId) => !companiesWithBoardMembers.has(companyId)
);

console.log(
  `Companies with investments but no board members: ${companiesWithoutBoards.length}`
);
companiesWithoutBoards.forEach((companyId) => {
  const company = data.entities[companyId];
  const investors = investments.filter((rel) => rel.to === companyId);
  console.log(
    `- ${company?.name || companyId} (${investors.length} investors)`
  );
});
