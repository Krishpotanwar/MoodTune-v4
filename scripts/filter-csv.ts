export {};

async function main(): Promise<void> {
  console.log("CSV filtering is deferred until the corpus workflow lands in Phase 2.");
}

main().catch((error) => {
  console.error("Filter script failed", error);
  process.exit(1);
});
