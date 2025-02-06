const { createGunzip } = require("zlib");
const fs = require("fs");
const { readdir, writeFile } = require("fs/promises");
const path = require("path");

const BATCH_SIZE = 80;
const RESULTS_DIR = ".data/results";
const OUTPUT_FILE = ".data/auraboard.txt";

async function readAndParseFile(filePath) {
  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    let data = "";

    const stream = fs.createReadStream(filePath)
      .pipe(gunzip);

    stream.on("data", (chunk) => data += chunk.toString());
    stream.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (!json.user?.username || json.user.username === "undefined") {
          return resolve(null);
        }
        resolve([
          json.llm.analysis.aura.estimation,
          json.user.username,
          json.user.pfp,
          filePath.replace(".json", "").split("/").at(-1)
        ]);
      } catch {
        resolve(null);
      }
    });
    stream.on("error", reject);
  });
}

async function processResults() {
  const results = await readdir(RESULTS_DIR);
  let users = [];
  let seenUsernames = new Set();

  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE).filter(f => f.endsWith(".json"));

    const processedBatch = await Promise.all(batch.map(file => readAndParseFile(path.join(RESULTS_DIR, file))));

    users.push(...processedBatch.filter(Boolean));
  }

  users.sort((a, b) => b[0] - a[0]);

  const uniqueUsers = users.filter(([_, username]) => {
    if (seenUsernames.has(username)) return false;
    seenUsernames.add(username);
    return true;
  });

  await writeFile(OUTPUT_FILE, `${Date.now()}\n` + uniqueUsers.map(u => JSON.stringify(u).slice(1, -1)).join("\n"));
}


processResults().catch(console.error);