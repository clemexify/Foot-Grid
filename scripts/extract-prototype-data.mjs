import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = await readFile("index.html", "utf8");

function extractConst(name, followingConst) {
  const pattern = new RegExp(`const ${name} = (.*?);\\n\\nconst ${followingConst}`, "s");
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Unable to extract ${name} from index.html`);
  }
  return Function(`"use strict"; return (${match[1]});`)();
}

const players = extractConst("JOUEURS", "FLAGS");
const puzzles = extractConst("GRILLES", "CLUBS_LOGOS");

await mkdir("src/data", { recursive: true });
await writeFile("src/data/players.generated.json", `${JSON.stringify(players, null, 2)}\n`);
await writeFile("src/data/puzzles.generated.json", `${JSON.stringify(puzzles, null, 2)}\n`);

console.log(`Generated ${players.length} players and ${Object.keys(puzzles).length} puzzle modes.`);
