/** @param {NS} ns **/

// --- HELPER FUNCTION (GLOBAL SCOPE) ---
const formatTime = (ms) => new Date(ms).toISOString().substr(14, 5);

export async function main(ns) {
  ns.disableLog('ALL');
  ns.tprint('🚀 HWGW Batcher OS Starting...');
  
  // ### NEW: Ensure manager scripts are running ###
  const upgraderScript = 'upgrade-manager.js';
  const pwnedScript = 'pwned-manager.js';
  if (!ns.isRunning(upgraderScript, 'home')) {
    ns.exec(upgraderScript, 'home', 1);
  }
  if (!ns.isRunning(pwnedScript, 'home')) {
    ns.exec(pwnedScript, 'home', 1);
  }

  // --- CONFIGURATION ---
  const minRamToBuy = 256;
  const hackPercent = 0.25; 
  const batchSeparation = 200; 
  const prep_moneyThreshold = 0.90;
  const prep_securityThreshold = 5;

  // --- Status Report Configuration ---
  let lastLogTime = 0;
  const logInterval = 60000;
  let completedBatches = 0;
  let bottleneck = 'Analyzing...';
  let target = 'n00dles'; 

  // --- MAIN LOOP ---
  while (true) {
    ns.clearLog();
    
    // --- STEP 1: FLEET MANAGEMENT ---
    for (const server of ns.getPurchasedServers()) {
      const serverRam = ns.getServerMaxRam(server);
      if (serverRam < minRamToBuy) {
        ns.tprint(`🚨 Decommissioning ${server} (${serverRam}GB) - does not meet minimum of ${minRamToBuy}GB.`);
        ns.killall(server);
        ns.deleteServer(server);
      }
    }
    
    // --- STEP 2: SERVER ACQUISITION ---
    const purchasedServers = ns.getPurchasedServers();
    if (purchasedServers.length < ns.getPurchasedServerLimit()) {
      bottleneck = `Cash (for pserv-${purchasedServers.length})`;
      const currentMoney = ns.getServerMoneyAvailable('home');
      for (let ram = Math.pow(2, 20); ram >= minRamToBuy; ram /= 2) {
        if (currentMoney > ns.getPurchasedServerCost(ram)) {
          const hostname = `pserv-${purchasedServers.length}`; 
          ns.purchaseServer(hostname, ram);
          ns.tprint(`✅ FLEET EXPANDED: Acquired new server '${hostname}' with ${ram}GB RAM.`);
          bottleneck = 'None';
          break;
        }
      }
    }

    // --- STEP 3: DYNAMIC TARGET SELECTION ---
    const newTarget = findBestTarget(ns);
    if (newTarget && newTarget !== target) {
      ns.tprint(`🎯 New optimal target identified: ${newTarget}`);
      target = newTarget;
      await ns.write('target.txt', target, 'w');
    }

    // --- SPACERADIO TRANSMISSION ---
    if (Date.now() - lastLogTime > logInterval) {
        lastLogTime = Date.now();
        const network = getNetworkRam(ns);
        const pservs = ns.getPurchasedServers();
        const utilization = network.total > 0 ? ((network.used / network.total) * 100).toFixed(2) : 0;
        ns.tprint(`
        📡 ==[ SPACERADIO TRANSMISSION ]==
           System Time: ${new Date().toLocaleTimeString('en-US')}
           Fleet Status: ${pservs.length}/${ns.getPurchasedServerLimit()} servers owned. ${pservs.length + 1} total nodes online.
           Network Utilization: ${utilization}% (${ns.formatRam(network.used)}/${ns.formatRam(network.total)})
           Current Directive: Engaging target [${target}]
           Batches Launched: ${completedBatches}
           Current Bottleneck: ${bottleneck}
           --- Operation Times ---
           Hack Time:   ~${formatTime(ns.getHackTime(target))}
           Grow Time:   ~${formatTime(ns.getGrowTime(target))}
           Weaken Time: ~${formatTime(ns.getWeakenTime(target))}
        `);
    }

    // --- STEP 4: Prepare Target Server ---
    const maxMoney = ns.getServerMaxMoney(target);
    const minSec = ns.getServerMinSecurityLevel(target);

    if (ns.getServerSecurityLevel(target) > minSec + prep_securityThreshold) {
      bottleneck = 'RAM (for target prep)';
      await runPrep(ns, target, 'weaken.js');
      continue;
    }
    if (ns.getServerMoneyAvailable(target) < maxMoney * prep_moneyThreshold) {
      bottleneck = 'RAM (for target prep)';
      await runPrep(ns, target, 'grow.js');
      continue;
    }

    // --- STEP 5: Calculate and Launch Batches ---
    const batch = calculateBatch(ns, target, hackPercent);
    if (batch.ramCost > getNetworkRam(ns).total) {
      bottleneck = `RAM (for initial batch)`;
      ns.print(`ERROR: Not enough RAM for a single batch. Need ${ns.formatRam(batch.ramCost)}. Waiting...`);
      await ns.sleep(30000);
      continue;
    }

    let batching = true;
    while (batching) {
      bottleneck = 'Network Throughput (ideal)';
      if (ns.getServerSecurityLevel(target) > minSec + prep_securityThreshold || ns.getServerMoneyAvailable(target) < maxMoney * prep_moneyThreshold) {
          ns.print(`WARN: Target ${target} de-synced. Breaking to re-prep.`);
          batching = false; 
          continue;
      }
      if (batch.ramCost > (getNetworkRam(ns).total - getNetworkRam(ns).used)) {
          bottleneck = 'RAM (for concurrent batches)';
          await ns.sleep(100); 
          continue;
      }
      
      const weakenTime = ns.getWeakenTime(target);
      const landTime = Date.now() + weakenTime + (2 * batchSeparation);
      deploy(ns, target, 'hack.js', batch.hackThreads, landTime - (2 * batchSeparation) - ns.getHackTime(target));
      deploy(ns, target, 'weaken.js', batch.weaken1Threads, landTime - batchSeparation - ns.getWeakenTime(target));
      deploy(ns, target, 'grow.js', batch.growThreads, landTime - ns.getGrowTime(target));
      deploy(ns, target, 'weaken.js', batch.weaken2Threads, landTime + batchSeparation - ns.getWeakenTime(target));
      completedBatches++;
      await ns.sleep(4 * batchSeparation);
    }
  }
}

// --- GLOBAL HELPER FUNCTIONS ---

function findBestTarget(ns) {
    const allServers = new Set();
    const q = ['home'];
    const visited = new Set(['home']);
    let openPortTools = 0;
    if (ns.fileExists("BruteSSH.exe")) openPortTools++;
    if (ns.fileExists("FTPCrack.exe")) openPortTools++;
    if (ns.fileExists("relaySMTP.exe")) openPortTools++;
    if (ns.fileExists("HTTPWorm.exe")) openPortTools++;
    if (ns.fileExists("SQLInject.exe")) openPortTools++;
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
    const validTargets = Array.from(allServers).filter(s => {
        if (!ns.hasRootAccess(s)) {
            if (ns.getServerNumPortsRequired(s) <= openPortTools) {
                try { 
                    if (openPortTools > 0) ns.brutessh(s);
                    if (openPortTools > 1) ns.ftpcrack(s);
                    if (openPortTools > 2) ns.relaysmtp(s);
                    if (openPortTools > 3) ns.httpworm(s);
                    if (openPortTools > 4) ns.sqlinject(s);
                    ns.nuke(s); 
                } catch {}
            }
        }
        return ns.hasRootAccess(s) && ns.getServerMaxMoney(s) > 0 && !s.startsWith('pserv-') && ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel();
    }).map(s => {
        const score = ns.getServerMaxMoney(s) / ns.getWeakenTime(s);
        return { name: s, score: score };
    });
    if (validTargets.length === 0) return 'n00dles';
    return validTargets.reduce((prev, curr) => prev.score > curr.score ? prev : curr).name;
}

function calculateBatch(ns, target, hackPercent) {
  const serverMaxMoney = ns.getServerMaxMoney(target);
  const moneyToHack = serverMaxMoney * hackPercent;
  const hackThreads = moneyToHack > 0 ? Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, moneyToHack))) : 1;
  const hackSecIncrease = ns.hackAnalyzeSecurity(hackThreads);
  const weaken1Threads = Math.max(1, Math.ceil(hackSecIncrease / ns.weakenAnalyze(1)));
  const growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(target, 1 / (1 - hackPercent) + 0.01)));
  const growSecIncrease = ns.growthAnalyzeSecurity(growThreads);
  const weaken2Threads = Math.max(1, Math.ceil(growSecIncrease / ns.weakenAnalyze(1)));
  const hRam = ns.getScriptRam('hack.js');
  const gRam = ns.getScriptRam('grow.js');
  const wRam = ns.getScriptRam('weaken.js');
  return {
    hackThreads, weaken1Threads, growThreads, weaken2Threads,
    ramCost: (hackThreads * hRam) + (growThreads * gRam) + ((weaken1Threads + weaken2Threads) * wRam),
  };
}

function deploy(ns, target, script, threads, delay) {
  if (threads === 0) return;
  let remainingThreads = threads;
  const pservs = ['home', ...ns.getPurchasedServers()];
  for (const server of pservs) {
    if (remainingThreads <= 0) break;
    const ramCost = ns.getScriptRam(script);
    const freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    const threadsOnThisServer = Math.min(remainingThreads, Math.floor(freeRam / ramCost));
    if (threadsOnThisServer > 0) {
      ns.scp(script, server, 'home');
      ns.exec(script, server, threadsOnThisServer, target, delay);
      remainingThreads -= threadsOnThisServer;
    }
  }
}

function getNetworkRam(ns) {
  let totalRam = 0;
  let usedRam = 0;
  const pservs = ['home', ...ns.getPurchasedServers()];
  for (const server of pservs) {
    totalRam += ns.getServerMaxRam(server);
    usedRam += ns.getServerUsedRam(server);
  }
  return { total: totalRam, used: usedRam };
}

async function runPrep(ns, target, script) {
  const ramCost = ns.getScriptRam(script);
  const network = getNetworkRam(ns);
  const threads = Math.floor((network.total - network.used) / ramCost);
  if (threads > 0) {
    deploy(ns, target, script, threads, 0);
  }
  let waitTime = 0;
  if(script === 'weaken.js') waitTime = ns.getWeakenTime(target);
  if(script === 'grow.js') waitTime = ns.getGrowTime(target);
  ns.print(`INFO: Prepping ${target} with ${script} using ${threads} threads. Waiting for ~${formatTime(waitTime)}.`);
  await ns.sleep(waitTime + 1000);
}
