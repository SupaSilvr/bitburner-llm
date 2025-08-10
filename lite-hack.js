/** @param {NS} ns **/
export async function main(ns) {
    // This script is designed for low-RAM servers.
    // It takes one argument: the server to target.
    while(true) {
        await ns.weaken(ns.args[0]);
        await ns.grow(ns.args[0]);
        await ns.hack(ns.args[0]);
    }
}
