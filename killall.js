/** @param {NS} ns **/
export async function main(ns) {
    // Kills all scripts on all servers.
    const allServers = Array.from(new Set(['home', ...ns.getPurchasedServers(), ...scanAll(ns)]));
    for (const server of allServers) {
        if (ns.hasRootAccess(server)) {
            ns.killall(server);
        }
    }
    ns.tprint("INFO: All scripts on all servers have been terminated.");

    function scanAll(ns, host = 'home', visited = new Set()) {
        let hosts = [];
        if (!visited.has(host)) {
            visited.add(host);
            for (const neighbor of ns.scan(host)) {
                hosts.push(neighbor, ...scanAll(ns, neighbor, visited));
            }
        }
        return hosts;
    }
}
