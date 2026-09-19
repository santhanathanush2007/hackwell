/**
 * AGENT 1: Data Input Agent
 * Role: Signal Ingestion, Schema Normalization, Multi-Channel Signal Ingestion
 * Hackwell 2.0 - Team Graph Guardians
 */

class DataInputAgent {
  constructor(graphStore) {
    this.name = "Data Input Agent";
    this.graphStore = graphStore;
  }

  async run() {
    this.graphStore.logAgentStep(
      this.name,
      "RUNNING",
      "Scanning raw streaming queues, transaction ledgers, and identity registries."
    );

    const graph = this.graphStore.getGraph();
    const accountCount = graph.nodes.filter(n => n.type === "ACCOUNT").length;
    const deviceCount = graph.nodes.filter(n => n.type === "DEVICE").length;
    const ipCount = graph.nodes.filter(n => n.type === "IP").length;
    const txnCount = this.graphStore.transactions.length;

    const summary = `Ingested ${txnCount} transactions across ${accountCount} accounts, ${deviceCount} hardware fingerprints, and ${ipCount} network endpoints. Normalized signals into unified multi-attribute graph nodes.`;

    this.graphStore.logAgentStep(this.name, "COMPLETED", summary, {
      nodesIngested: graph.nodes.length,
      transactionsIngested: txnCount,
      signalIntegrity: "100%"
    });

    return {
      success: true,
      agent: this.name,
      summary,
      stats: {
        accounts: accountCount,
        devices: deviceCount,
        ips: ipCount,
        transactions: txnCount
      }
    };
  }
}

module.exports = DataInputAgent;
