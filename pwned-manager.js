/** @param {NS} ns **/
export async function main(ns) {
  const checkInterval = 10000;
  const statusFile = 'support-stats.txt';
  await ns.write(statusFile, '0', 'w');
  ns.print('INFO: Support Fleet Manager started.');

  while (true) {
    // ### NEW: Read the shared state file ###
    const stateRaw = ns.read('state.txt');
    const state = stateRaw ? JSON.parse(stateRaw) : null;

    if (!state || !state.target) {
      ns.print('WARN: No state file found. Waiting...');
      await ns.sleep(checkInterval);
      continue;
    }

    // ### NEW: Determine action based on commander's state ###
    let actionScript = '';
    let actionTarget = '';

    if (state.phase === 'STALLED') {
      // Commander is waiting for RAM, so our mission is to make money.
      actionScript = 'hack.js';
      actionTarget = 'n00dles'; // A safe, easy target for early game cash
    } else {
      // Commander is active, so our mission is to support by weakening.
      actionScript = 'weaken.js';
      actionTarget = state.target;
    }
    
    // --- Find all servers for the Support Fleet ---
    const allServers = new Set();
    const q = ['home'];
    const visited = new Set(['home']);
    while(q.length > 0) {
        const server = q.shift();
        allServers.add(server);
        for(const neighbor of ns.scan(server)) {
            if(!visited.has(neighbor)) { visited.add(neighbor); q.push(neighbor); }
        }
    }

    const supportServers = Array.from(allServers).filter(s => 
        ns.hasRootAccess(s) && s !== 'home' && !s.startsWith('pserv-') && s !== state.target
    );

    ns.print(`INFO: Commander state is [${state.phase}]. Deploying [${actionScript}] to ${supportServers.length} servers targeting [${actionTarget}].`);
    await ns.write(statusFile, supportServers.length.toString(), 'w');

    // --- Deploy the determined action to the Support Fleet ---
    for (const server of supportServers) {
      const ramCost = ns.getScriptRam(actionScript);
      const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      const threads = Math.floor(availableRam / ramCost);

      const runningScripts = ns.ps(server);
      const isAlreadyWorking = runningScripts.length === 1 && 
                               runningScripts[0].filename === actionScript && 
                               runningScripts[0].args[0] === actionTarget &&
                               runningScripts[0].threads === threads;

      if (isAlreadyWorking) continue;

      ns.killall(server); 

      if (threads > 0) {
        ns.scp(actionScript, server, 'home');
        ns.exec(actionScript, server, threads, actionTarget, 0);
      }
    }
    
    await ns.sleep(checkInterval);
  }
}
