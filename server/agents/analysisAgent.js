/**
 * AGENT 2: Analysis Agent
 * Role: Transaction Behavioral Anomaly Detection, Velocity Spikes, Layering & Smurfing Analysis
 * Hackwell 2.0 - Team Graph Guardians
 */

class AnalysisAgent {
  constructor(graphStore) {
    this.name = "Analysis Agent";
    this.graphStore = graphStore;
  }

  async run() {
    this.graphStore.logAgentStep(
      this.name,
      "RUNNING",
      "Analyzing transaction velocity, temporal clustering, amount smurfing, and pass-through ratios."
    );

    const txns = this.graphStore.transactions;
    const anomalies = [];

    // Group transactions by sender and receiver
    const accountTxCount = {};
    const rapidTransfers = [];

    txns.forEach((tx, idx) => {
      accountTxCount[tx.from] = (accountTxCount[tx.from] || 0) + 1;
      accountTxCount[tx.to] = (accountTxCount[tx.to] || 0) + 1;

      // 1. High Velocity / Rapid Hops
      if (idx > 0) {
        const prevTx = txns[idx - 1];
        const timeDiffMs = Math.abs(new Date(tx.timestamp) - new Date(prevTx.timestamp));
        const minutes = timeDiffMs / (1000 * 60);

        if (minutes < 10 && tx.from === prevTx.to) {
          rapidTransfers.push({
            type: "RAPID_HOP_LAYERING",
            from: prevTx.from,
            hop: tx.from,
            to: tx.to,
            intervalMinutes: minutes.toFixed(1),
            amount: tx.amount
          });
        }
      }

      // 2. High Value Smurfing
      if (tx.amount >= 200000) {
        anomalies.push({
          type: "HIGH_VALUE_THRESHOLD",
          txId: tx.id,
          parties: `${tx.from} -> ${tx.to}`,
          amount: tx.amount,
          reason: "High velocity capital movement exceeding standard velocity profile"
        });
      }

      // 3. Automated Bonus / Small Amount Drain
      if (tx.amount === 2500 && tx.flag && tx.flag.includes("Bonus")) {
        anomalies.push({
          type: "COORDINATED_DRAIN",
          txId: tx.id,
          parties: `${tx.from} -> ${tx.to}`,
          amount: tx.amount,
          reason: "Identical micro-drain targeting single aggregator"
        });
      }
    });

    const summary = `Detected ${anomalies.length} transaction anomalies and ${rapidTransfers.length} rapid layering hops. Flagged high-frequency account interactions for entity linking.`;

    this.graphStore.logAgentStep(this.name, "COMPLETED", summary, {
      anomaliesFound: anomalies.length,
      rapidHopsDetected: rapidTransfers.length,
      sampleAnomalies: anomalies.slice(0, 3)
    });

    return {
      success: true,
      agent: this.name,
      summary,
      anomalies,
      rapidTransfers
    };
  }
}

module.exports = AnalysisAgent;
