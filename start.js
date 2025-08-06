/** @param {NS} ns **/
export async function main(ns) {
    var scriptToRun = 'basic-hack.js';

    // Make sure the hacking script exists on the home server to be copied.
    if (!ns.fileExists(scriptToRun, 'home')) {
        ns.tprint("ERROR: Hacking script '" + scriptToRun + "' not found. Please create it.");
        return;
    }

    // Infinite loop to continuously scan, root, and deploy.
    while (true) {
        var serverSet = new Set(['home']);
        var serversToScan = ['home'];

        // Discover all servers on the network.
        while (serversToScan.length > 0) {
            var currentServer = serversToScan.shift();
            var neighbors = ns.scan(currentServer);
            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                if (!serverSet.has(neighbor)) {
                    serverSet.add(neighbor);
                    serversToScan.push(neighbor);
                }
            }
        }

        var allServers = Array.from(serverSet);

        // Attempt to root every server that we can.
        for (var i = 0; i < allServers.length; i++) {
            var server = allServers[i];
            if (ns.hasRootAccess(server) || ns.getHackingLevel() < ns.getServerRequiredHackingLevel(server)) {
                continue;
            }

            var openPorts = 0;
            if (ns.fileExists("BruteSSH.exe", "home")) { ns.brutessh(server); openPorts++; }
            if (ns.fileExists("FTPCrack.exe", "home")) { ns.ftpcrack(server); openPorts++; }
            if (ns.fileExists("relaySMTP.exe", "home")) { ns.relaysmtp(server); openPorts++; }
            if (ns.fileExists("HTTPWorm.exe", "home")) { ns.httpworm(server); openPorts++; }
            if (ns.fileExists("SQLInject.exe", "home")) { ns.sqlinject(server); openPorts++; }

            if (ns.getServerNumPortsRequired(server) <= openPorts) {
                ns.nuke(server);
            }
        }

        var rootedServers = allServers.filter(function(s) { return ns.hasRootAccess(s); });

        // Find the best server to target.
        var bestTarget = '';
        var maxScore = 0;
        for (var i = 0; i < rootedServers.length; i++) {
            var server = rootedServers[i];
            var serverMaxMoney = ns.getServerMaxMoney(server);
            if (serverMaxMoney === 0) continue;

            var score = serverMaxMoney / ns.getServerMinSecurityLevel(server);
            if (score > maxScore) {
                maxScore = score;
                bestTarget = server;
            }
        }

        if (bestTarget === '') {
            ns.print("WARN: No suitable target found. Waiting for next cycle.");
            await ns.sleep(10000);
            continue;
        }

        // Deploy and execute the hacking script.
        for (var i = 0; i < rootedServers.length; i++) {
            var host = rootedServers[i];
            if (ns.getServerMaxRam(host) === 0) continue;

            await ns.scp(scriptToRun, host, 'home');
            
            var scriptRam = ns.getScriptRam(scriptToRun, host);
            var availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
            var threads = Math.floor(availableRam / scriptRam);

            if (threads > 0 && !ns.scriptRunning(scriptToRun, host)) {
                 ns.exec(scriptToRun, host, threads, bestTarget);
            }
        }

        ns.print("SUCCESS: Cycle complete. Target: " + bestTarget + ". Waiting before next scan.");
        await ns.sleep(60000);
    }
}
