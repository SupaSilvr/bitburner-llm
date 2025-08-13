/** @param {NS} ns */
export async function main(ns) {
  // Executes a hack against the target server passed as the first argument.
  await ns.hack(ns.args[0]);
}
