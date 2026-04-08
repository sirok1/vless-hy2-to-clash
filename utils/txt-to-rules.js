const fs = require("fs");

const inputFile = "whitelist.txt";
const outputFile = "clash_rules.txt";

const lines = fs.readFileSync(inputFile, "utf-8").split("\n");

const result = lines
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((domain) => `DOMAIN-SUFFIX,${domain},DIRECT`)
  .join("\n");

fs.writeFileSync(outputFile, result, "utf-8");

console.log("Готово! clash_rules.txt создан.");
