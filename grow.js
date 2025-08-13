/** @param {NS} ns */
export async function main(ns) {
  // Executes a grow operation against the target server passed as the first argument.
  await ns.grow(ns.args[0]);
}
