/** @param {NS} ns **/
export async function main(ns) {
  const checkInterval = 10000;
  const weakenScript = 'weaken.js';
  const statusFile = 'support-stats.txt';
  
  ns.print('INFO: Support Fleet Manager started.');

  // Initialize the status file
  await ns.write(statusFile, '0', 'w');

  while (true) {
    const target = ns.read('target.txt');
    if (!target) {
      ns.print('WARN: No target file found. Waiting...');
      await ns.sleep(checkInterval);
      continue;
    }

    // --- Find all servers ---
    const allServers = new Set();
    const q = ['home'];
    const visited = new Set(['home']);
    while(q.length > 0) {
        const server = q.shift();
        allServers.add(server);
        const neighbors = ns.scan(server);
        for(const neighbor of neighbors) {
            if(!visited.has(neighbor)) {
                visited.add(neighbor);
                q.push(neighbor);
            }
        }
    }

    // --- Filter for the Support Fleet ---
    const supportServers = Array.from(allServers).filter(s => 
        ns.hasRootAccess(s) && 
        s !== 'home' && 
        !s.startsWith('pserv-') &&
        s !== target 
    );
    
    ns.print(`INFO: Found ${supportServers.length} servers for the Support Fleet.`);
    await ns.write(statusFile, supportServers.length.toString(), 'w');

    // --- Deploy weaken script to the Support Fleet ---
    for (const server of supportServers) {
      const ramCost = ns.getScriptRam(weakenScript);
      const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      const threads = Math.floor(availableRam / ramCost);

      // ### NEW EFFICIENCY CHECK ###
      // Check if the server is already running the correct script against the correct target.
      const runningScripts = ns.ps(server);
      const isAlreadyWorking = runningScripts.length === 1 && 
                               runningScripts[0].filename === weakenScript && 
                               runningScripts[0].args[0] === target;

      if (isAlreadyWorking) {
        continue; // Skip to the next server if it's already doing its job.
      }

      // If not working correctly, kill all scripts and redeploy.
      ns.killall(server); 

      if (threads > 0) {
        ns.scp(weakenScript, server, 'home');
        ns.exec(weakenScript, server, threads, target, 0);
      }
    }
    
    ns.print(`SUCCESS: Deployment complete. Sleeping for ${checkInterval / 1000} seconds...`);
    await ns.sleep(checkInterval);
  }
}
