#!/usr/bin/env node

let cliEntry = "../src/cli";
try {
  require.resolve("../dist/cli");
  cliEntry = "../dist/cli";
} catch {
  // dev: no build yet
}
const { main } = require(cliEntry);

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    const message = error && error.message ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
