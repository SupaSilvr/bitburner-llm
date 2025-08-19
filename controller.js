/** @param {NS} ns **/

// --- HELPER FUNCTION (GLOBAL SCOPE) ---
const formatTime = (ms) => new Date(ms).toISOString().substr(14, 5);
async function updateState(ns, state) {
  await ns.write('state.txt', JSON.stringify(state), 'w');
}

export async function main(ns) {
  ns.disableLog('ALL');
  ns.tprint('🚀 HWGW Batcher OS Starting...');
  
  const upgraderScript = 'upgrade-manager.js';
  const pwnedScript = 'pwned-manager.js';
  if (!ns.isRunning(upgraderScript, 'home')) ns.exec(upgraderScript, 'home', 1);
  if (!ns.isRunning(pwnedScript, 'home')) ns.exec(pwnedScript, 'home', 1);

  // --- CONFIGURATION & STATE ---
  const minRamToBuy = 256;
  const hackPercent = 0.25; 
  const batchSeparation = 200; 
  const prep_moneyThreshold = 0.90;
  const prep_securityThreshold = 5;
  
  let lastLogTime = 0;
  const logInterval = 60000;
  let completedBatches = 0;
  let bottleneck = 'Analyzing...';
  let target = 'n00dles'; 
  let currentPhase = 'Initializing';
  
  await updateState(ns, { target: target, phase: currentPhase });

  // --- MAIN LOOP ---
  while (true) {
    ns.clearLog();
    
    // --- STEP 1: FLEET MANAGEMENT ---
    const purchasedServers = ns.getPurchasedServers();
    
    // -- Acquire new servers until the fleet is full --
    if (purchasedServers.length < ns.getPurchasedServerLimit()) {
      bottleneck = `Cash (for pserv-${purchasedServers.length})`;
      const currentMoney = ns.getServerMoneyAvailable('home');
      for (let ram = Math.pow(2, 20); ram >= minRamToBuy; ram /= 2) {
        const purchaseCost = ns.getPurchasedServerCost(ram);
        if (currentMoney > purchaseCost) {
          const hostname = `pserv-${purchasedServers.length}`; 
          ns.purchaseServer(hostname, ram);
          ns.tprint(`✅ FLEET EXPANDED: Acquired new server '${hostname}' with ${ram}GB RAM for ${ns.formatNumber(purchaseCost)}.`);
          bottleneck = 'None';
          break;
        }
      }
    } 
    // -- If fleet is full, start upgrading the weakest server --
    else {
        let weakestServer = purchasedServers[0] || null;
        let minRam = weakestServer ? ns.getServerMaxRam(weakestServer) : 0;

        if (weakestServer) {
            for (const server of purchasedServers) {
                const currentRam = ns.getServerMaxRam(server);
                if (currentRam < minRam) {
                    minRam = currentRam;
                    weakestServer = server;
                }
            }
        }

        const nextRamTier = minRam * 2;
        if (weakestServer && nextRamTier <= ns.getPurchasedServerMaxRam()) {
            const upgradeCost = ns.getPurchasedServerCost(nextRamTier);
            bottleneck = `Cash (for ${weakestServer} upgrade to ${ns.formatRam(nextRamTier)})`;
            if (ns.getServerMoneyAvailable('home') > upgradeCost) {
                ns.killall(weakestServer);
                ns.deleteServer(weakestServer);
                ns.purchaseServer(weakestServer, nextRamTier);
                ns.tprint(`✅ FLEET UPGRADE: Replaced ${weakestServer} with a new ${ns.formatRam(nextRamTier)} server for ${ns.formatNumber(upgradeCost)}.`);
            }
        }
    }

    // --- STEP 2: DYNAMIC TARGET SELECTION ---
    const newTarget = findBestTarget(ns);
    if (newTarget && newTarget !== target) {
      ns.tprint(`🎯 New optimal target identified: ${newTarget}`);
      target = newTarget;
      await updateState(ns, { target: target, phase: 'Analyzing' });
    }

    // --- STEP 3: PHASE DETERMINATION & STATE BROADCASTING ---
    const maxMoney = ns.getServerMaxMoney(target);
    const minSec = ns.getServerMinSecurityLevel(target);
    if (ns.getServerSecurityLevel(target) > minSec + prep_securityThreshold) {
      bottleneck = 'RAM (for target prep)';
      currentPhase = 'Weakening';
      await updateState(ns, { target: target, phase: 'PREPPING' });
    } else if (ns.getServerMoneyAvailable(target) < maxMoney * prep_moneyThreshold) {
      bottleneck = 'RAM (for target prep)';
      currentPhase = 'Growing';
      await updateState(ns, { target: target, phase: 'PREPPING' });
    } else {
      bottleneck = 'Network Throughput (ideal)';
      currentPhase = 'Hacking (Batching)';
    }

    // --- STEP 4: SPACERADIO TRANSMISSION ---
    if (Date.now() - lastLogTime > logInterval) {
        lastLogTime = Date.now();
        const network = getNetworkRam(ns);
        const pservs = ns.getPurchasedServers();
        const utilization = network.total > 0 ? ((network.used / network.total) * 100).toFixed(2) : 0;
        const supportFleetSize = ns.read('support-stats.txt') || 0;
        ns.tprint(`
        📡 ==[ SPACERADIO TRANSMISSION ]==
           System Time: ${new Date().toLocaleTimeString('en-US')}
           Core Fleet: ${pservs.length + 1} nodes (${ns.formatRam(network.used)}/${ns.formatRam(network.total)} RAM used)
           Support Fleet: ${supportFleetSize} pwned nodes online.
           Current Directive: ${currentPhase} target [${target}]
           Batches Launched: ${completedBatches}
           Current Bottleneck: ${bottleneck}
           --- Operation Times ---
           Hack Time:   ~${formatTime(ns.getHackTime(target))}
           Grow Time:   ~${formatTime(ns.getGrowTime(target))}
           Weaken Time: ~${formatTime(ns.getWeakenTime(target))}
        `);
    }

    // --- STEP 5: ACTION EXECUTION ---
    if (currentPhase === 'Weakening') {
      await runPrep(ns, target, 'weaken.js');
      continue;
    }
    if (currentPhase === 'Growing') {
      await runPrep(ns, target, 'grow.js');
      continue;
    }
    if (currentPhase === 'Hacking (Batching)') {
      const batch = calculateBatch(ns, target, hackPercent);
      if (batch.ramCost > getNetworkRam(ns).total) {
        bottleneck = `RAM (for initial batch)`;
        await updateState(ns, { target: target, phase: 'STALLED' });
        ns.print(`ERROR: Not enough RAM for a single batch. Waiting...`);
        await ns.sleep(30000);
        continue;
      }
      
      let batching = true;
      while (batching) {
        await updateState(ns, { target: target, phase: 'BATCHING' });
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
