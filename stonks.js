/** @param {NS} ns **/
export async function main(ns) {
    // --- Configuration ---
    const buyThreshold = 0.6; // This now refers to the 'score', not just forecast
    const sellThreshold = 0.5;
    const reserveCash = 1_000_000;
    const commission = 100_000;
    const cycleTime = 6000; // Operates every 6 seconds
    const dataPort = 1; // The port this script will write data to

    // --- State Tracking ---
    let sessionProfitAndLoss = 0;

    // Clear the port at the start to ensure no old data is lingering.
    ns.clearPort(dataPort);

    // --- Main Loop ---
    while (true) {
        const allSymbols = ns.stock.getSymbols();
        let portfolioValue = 0;

        // --- Sell Phase ---
        // Sells stocks that are underperforming and have low volatility.
        for (const sym of allSymbols) {
            const [shares, avgPrice] = ns.stock.getPosition(sym);
            if (shares > 0) {
                const bidPrice = ns.stock.getBidPrice(sym);
                portfolioValue += shares * bidPrice;
                
                // NEW: Added a volatility check to avoid selling stocks that might rebound.
                const forecast = ns.stock.getForecast(sym);
                const volatility = ns.stock.getVolatility(sym);

                if (forecast < sellThreshold && volatility < 0.05) { // Check for low forecast and low volatility
                    const salePrice = ns.stock.sellStock(sym, shares);
                    if (salePrice > 0) {
                        const saleGain = shares * (salePrice - avgPrice) - commission; // Only one commission on a sale
                        sessionProfitAndLoss += saleGain;
                        ns.print(`SELL: Sold ${sym} for a profit of ${ns.nFormat(saleGain, '$0.0a')}`);
                    }
                }
            }
        }

        // --- Buy Phase ---
        // Finds the best stock to buy based on a score combining forecast and volatility.
        let bestStock = '';
        let bestScore = 0;
        for (const sym of allSymbols) {
            const forecast = ns.stock.getForecast(sym);
            const volatility = ns.stock.getVolatility(sym);
            // NEW: Scoring system to balance high forecast with low volatility for safer bets.
            const score = forecast * (1 - volatility);

            if (score > bestScore) {
                bestScore = score;
                bestStock = sym;
            }
        }
        
        // NEW: Buys the stock with the best score if it's above the configured threshold.
        if (bestScore > buyThreshold) {
            let cashToSpend = ns.getPlayer().money - reserveCash;
            if (cashToSpend > commission) {
                const stockPrice = ns.stock.getAskPrice(bestStock);
                const maxSharesToBuy = ns.stock.getMaxShares(bestStock) - ns.stock.getPosition(bestStock)[0];
                const sharesToBuy = Math.min(Math.floor((cashToSpend - commission) / stockPrice), maxSharesToBuy);

                if (sharesToBuy > 0) {
                    ns.stock.buyStock(bestStock, sharesToBuy);
                }
            }
        }
        
        // --- COMMUNICATION ---
        // Clear the port to ensure the master script doesn't read stale data.
        ns.clearPort(dataPort);
        // Write the new data as a JSON string.
        await ns.writePort(dataPort, JSON.stringify({
            portfolioValue: portfolioValue,
            sessionProfitAndLoss: sessionProfitAndLoss
        }));

        await ns.sleep(cycleTime);
    }
}
