import { readFileSync, writeFileSync } from "node:fs";

const inputFile = "utils/whitelist.txt";
const outputFile = "utils/clash_rules.txt";

const lines = readFileSync(inputFile, "utf-8").split("\n");

const result = lines
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((domain) => `DOMAIN-SUFFIX,${domain},DIRECT`)
  .join("\n");

writeFileSync(outputFile, result, "utf-8");

console.log("Готово! clash_rules.txt создан.");
