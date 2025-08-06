/** @param {NS} ns **/
export async function main(ns) {
    var scriptToRun = 'basic-hack.js';
    var initialMoney = ns.getPlayer().money;
    var startTime = Date.now();

    // Disables most logging to keep the terminal clean for the report.
    ns.disableLog('ALL');

    if (!ns.fileExists(scriptToRun, 'home')) {
        ns.tprint("ERROR: Hacking script '" + scriptToRun + "' not found. Please create it.");
        return;
    }

    // Main loop for continuous operation.
    while (true) {
        var serverSet = new Set(['home']);
        var serversToScan = ['home'];

        while (serversToScan.length > 0) {
            var currentServer = serversToScan.shift();
            var neighbors = ns.scan(currentServer);
            for (var i = 0; i < neighbors.length; i++) {
                if (!serverSet.has(neighbors[i])) {
                    serverSet.add(neighbors[i]);
                    serversToScan.push(neighbors[i]);
                }
            }
        }
        var allServers = Array.from(serverSet);

        // Rooting logic.
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
            if (ns.getServerNumPortsRequired(server) <= openPorts) ns.nuke(server);
        }

        var rootedServers = allServers.filter(function(s) { return ns.hasRootAccess(s); });

        // Target selection logic.
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

        // Deployment logic and statistics gathering.
        var totalMaxRam = 0;
        var totalUsedRam = 0;
        var attackingHosts = 0;

        for (var i = 0; i < rootedServers.length; i++) {
            var host = rootedServers[i];
            var maxRam = ns.getServerMaxRam(host);
            totalMaxRam += maxRam;
            totalUsedRam += ns.getServerUsedRam(host);

            if (maxRam > 0 && bestTarget !== '') {
                await ns.scp(scriptToRun, host, 'home');
                var scriptRam = ns.getScriptRam(scriptToRun, host);
                var availableRam = maxRam - ns.getServerUsedRam(host);
                var threads = Math.floor(availableRam / scriptRam);
                if (threads > 0 && !ns.scriptRunning(scriptToRun, host)) {
                    ns.exec(scriptToRun, host, threads, bestTarget);
                }
            }
             if (ns.scriptRunning(scriptToRun, host)) {
                attackingHosts++;
            }
        }

        // Reporting Section
        ns.clearLog(); // Clears previous report
        var runtime = (Date.now() - startTime) / 1000;
        var currentMoney = ns.getPlayer().money;
        var profit = currentMoney - initialMoney;
        var profitPerMinute = (runtime > 0) ? (profit / runtime) * 60 : 0;

        ns.tprint("======== STATUS REPORT ========");
        ns.tprint("Runtime: " + ns.tFormat(runtime * 1000));
        ns.tprint("Profit: " + ns.nFormat(profit, '$0.00a') + " (" + ns.nFormat(profitPerMinute, '$0.00a') + "/min)");
        ns.tprint("-------------------------------");
        ns.tprint("Target: " + (bestTarget || "None"));
        ns.tprint("Hacking Hosts: " + attackingHosts + " / " + rootedServers.length + " rooted");
        ns.tprint("-------------------------------");
        ns.tprint("Network RAM: " + ns.nFormat(totalUsedRam * 1e9, '0.00b') + " / " + ns.nFormat(totalMaxRam * 1e9, '0.00b') + " (" + Math.round((totalUsedRam/totalMaxRam)*100) + "%)");
        ns.tprint("===============================");
        
        await ns.sleep(30000); // Wait 30 seconds before next cycle and report.
    }
}
