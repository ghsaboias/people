const fs = require("fs");
const data = JSON.parse(fs.readFileSync("data/graph.json", "utf8"));

// Get all people
const people = Object.entries(data.entities)
  .filter(([id, entity]) => entity.type === "person")
  .map(([id, entity]) => ({ id, name: entity.name }));

// Professional relationship types
const professionalRelTypes = [
  "ceo_of",
  "founder_of",
  "founder_and_ceo_of",
  "chairman_of",
  "cfo_of",
  "board_member_of",
  "ex_board_member_of",
  "partner_of",
  "ex_employee_of",
  "head_of",
  "president_of",
  "owner_of",
];

// Get all professional relationships
const professionalRelationships = data.relationships.filter((rel) =>
  professionalRelTypes.includes(rel.type)
);

// Find people with professional roles
const peopleWithRoles = new Set(
  professionalRelationships.map((rel) => rel.from)
);

// Find people without professional roles
const peopleWithoutRoles = people.filter(
  (person) => !peopleWithRoles.has(person.id)
);

console.log("=== PEOPLE WITHOUT PROFESSIONAL ROLES ===");
console.log(`Total people: ${people.length}`);
console.log(`People with roles: ${peopleWithRoles.size}`);
console.log(`People without roles: ${peopleWithoutRoles.length}`);
console.log("\nPeople without professional roles:");
peopleWithoutRoles.forEach((person, index) => {
  console.log(`${index + 1}. ${person.name} (id: ${person.id})`);
});

// Show what relationships these people do have (if any)
console.log("\n=== RELATIONSHIPS FOR PEOPLE WITHOUT PROFESSIONAL ROLES ===");
peopleWithoutRoles.forEach((person) => {
  const relationships = data.relationships.filter(
    (rel) => rel.from === person.id || rel.to === person.id
  );

  if (relationships.length > 0) {
    console.log(`\n${person.name}:`);
    relationships.forEach((rel) => {
      if (rel.from === person.id) {
        const target = data.entities[rel.to];
        console.log(`  -> ${rel.type} -> ${target?.name || rel.to}`);
      } else {
        const source = data.entities[rel.from];
        console.log(`  <- ${rel.type} <- ${source?.name || rel.from}`);
      }
    });
  }
});
