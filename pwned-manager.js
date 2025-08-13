/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL');
  const checkInterval = 10000; // Check for new servers and tasks every 10 seconds.
  const weakenScript = 'weaken.js';

  while (true) {
    // Read the target from the file set by start.js
    const target = ns.read('target.txt');
    if (!target) {
      await ns.sleep(checkInterval);
      continue;
    }

    // --- Find all pwned servers (excluding home and purchased) ---
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

    const pwnedServers = Array.from(allServers).filter(s => 
        ns.hasRootAccess(s) && 
        s !== 'home' && 
        !s.startsWith('pserv-')
    );

    // --- Deploy weaken script to all pwned servers ---
    for (const server of pwnedServers) {
      // Kill any old scripts to ensure it's doing the current task
      ns.killall(server); 

      const ramCost = ns.getScriptRam(weakenScript);
      const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      const threads = Math.floor(availableRam / ramCost);

      if (threads > 0) {
        ns.scp(weakenScript, server, 'home');
        ns.exec(weakenScript, server, threads, target, 0);
      }
    }
    
    await ns.sleep(checkInterval);
  }
}
