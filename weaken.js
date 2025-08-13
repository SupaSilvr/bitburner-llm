/** @param {NS} ns */
export async function main(ns) {
  // Executes a weaken operation against the target server passed as the first argument.
  await ns.weaken(ns.args[0]);
}
