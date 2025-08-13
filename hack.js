/** @param {NS} ns **/
export async function main(ns) {
  // args[0]: target server
  // args[1]: time to sleep before executing
  await ns.sleep(ns.args[1]);
  await ns.hack(ns.args[0]);
}
