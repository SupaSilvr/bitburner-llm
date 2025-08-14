/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL');
  
  const controllerScript = 'controller.js';
  const controllerRam = ns.getScriptRam(controllerScript);
  const homeRam = ns.getServerMaxRam('home');

  // --- MODE 1: Full Controller Launch ---
  if (homeRam >= controllerRam) {
    ns.tprint(`✅ Sufficient RAM detected. Launching main controller: ${controllerScript}`);
    ns.exec(controllerScript, 'home', 1);
    return;
  }

  // --- MODE 2: Basic Hacks for Early Game ---
  const basicTarget = 'n00dles';
  const moneyThreshold = ns.getServerMaxMoney(basicTarget) * 0.75;
  const securityThreshold = ns.getServerMinSecurityLevel(basicTarget) + 5;
  const workerRam = 1.75;
  
  let lastLogTime = 0;
  const logInterval = 30000;
  const staticChars = ['#', '*', '?', '%', '$', '&'];
  
  const garble = (text, probability) => {
    let garbledText = "";
    for (const char of text) {
      garbledText += (Math.random() < probability && char !== ' ') ? 
                     staticChars[Math.floor(Math.random() * staticChars.length)] : char;
    }
    return garbledText;
  };

  // ### NEW: Ensure we have root access to the basic target ###
  if (!ns.hasRootAccess(basicTarget)) {
    ns.tprint(`INFO: Gaining root access on '${basicTarget}'...`);
    ns.nuke(basicTarget);
  }

  while (true) {
    // -- SPACERADIO TRANSMISSION (INTERMITTENT) --
    if (Date.now() - lastLogTime > logInterval) {
        lastLogTime = Date.now();
        const money = ns.getServerMoneyAvailable('home');
        ns.tprint(`
        ${garble("📡 ==[ SPACERADIO TRANSMISSION ]==", 0.1)}
           ${garble(`SYSTEM TIME: ${new Date().toLocaleTimeString('en-US')}`, 0.3)}
           ${garble(`STATUS: CONTROLLER OFFLINE`, 0.05)}
           ${garble(`-------------------------------`, 0.2)}
           ${garble(`REASON: INSUFFICIENT RAM`, 0.1)}
           ${garble(`REQUIRED: ${ns.formatRam(controllerRam)}`, 0.15)}
           ${garble(`C#RRENT CA$H: ${ns.formatNumber(money)}`, 0.35)}
           ${garble(`ACTION: BASIC HACKS ON ${basicTarget}`, 0.1)}
           ${garble(`[BZZT]...AWAITING MANUAL RAM UPGRADE...[KZZT]`, 0.1)}
        `);
    }

    // -- Basic Hacking Logic --
    let actionScript = '';
    if (ns.getServerSecurityLevel(basicTarget) > securityThreshold) {
      actionScript = 'weaken.js';
    } else if (ns.getServerMoneyAvailable(basicTarget) < moneyThreshold) {
      actionScript = 'grow.js';
    } else {
      actionScript = 'hack.js';
    }

    const availableRam = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');
    const threads = Math.max(1, Math.floor(availableRam / workerRam));
    
    ns.scp(['hack.js', 'grow.js', 'weaken.js'], 'home');
    ns.exec(actionScript, 'home', threads, basicTarget);
    
    let waitTime = 0;
    if (actionScript === 'weaken.js') waitTime = ns.getWeakenTime(basicTarget);
    if (actionScript === 'grow.js') waitTime = ns.getGrowTime(basicTarget);
    if (actionScript === 'hack.js') waitTime = ns.getHackTime(basicTarget);
    await ns.sleep(waitTime + 200);
  }
}
