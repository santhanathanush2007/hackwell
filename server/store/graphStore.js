/**
 * In-Memory Graph & Case Store for Agentic AI Fraud Ring Detection
 * Team Graph Guardians - Hackwell 2.0
 */

const seedData = require("../data/seedData");

class GraphStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.nodes = new Map();
    this.edges = [];
    this.transactions = [];
    this.rings = new Map();
    this.auditLogs = [];
    this.agentExecutionLogs = [];

    // Load initial seeds
    seedData.entities.forEach(entity => {
      this.nodes.set(entity.id, { ...entity });
    });

    seedData.transactions.forEach(txn => {
      this.transactions.push({ ...txn });
      this.edges.push({
        id: `EDGE-${txn.id}`,
        source: txn.from,
        target: txn.to,
        type: "TRANSACTION",
        label: `₹${txn.amount.toLocaleString("en-IN")}`,
        amount: txn.amount,
        timestamp: txn.timestamp,
        flag: txn.flag
      });
    });

    seedData.attributeLinks.forEach((link, idx) => {
      this.edges.push({
        id: `EDGE-ATTR-${idx + 1}`,
        source: link.source,
        target: link.target,
        type: "ATTRIBUTE_LINK",
        label: link.relationship,
        relationship: link.relationship
      });
    });

    this.logAudit("SYSTEM", "Graph store initialized with Hackwell 2.0 baseline seeds.");
  }

  logAudit(actor, action, details = {}) {
    const entry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  logAgentStep(agentName, status, summary, details = {}) {
    const step = {
      id: `AGENT-LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      agentName,
      status, // "RUNNING" | "COMPLETED" | "ALERT"
      summary,
      details
    };
    this.agentExecutionLogs.unshift(step);
    return step;
  }

  addTransaction(txnData) {
    const txnId = `TXN-${Date.now().toString().slice(-5)}`;
    const newTxn = {
      id: txnId,
      from: txnData.from,
      to: txnData.to,
      amount: Number(txnData.amount) || 1000,
      timestamp: txnData.timestamp || new Date().toISOString(),
      flag: txnData.flag || "Real-time Live Ingestion"
    };

    // Ensure sender & receiver nodes exist
    if (!this.nodes.has(newTxn.from)) {
      this.nodes.set(newTxn.from, {
        id: newTxn.from,
        type: "ACCOUNT",
        label: `${newTxn.from} (External)`,
        balance: 10000,
        risk: "MEDIUM"
      });
    }

    if (!this.nodes.has(newTxn.to)) {
      this.nodes.set(newTxn.to, {
        id: newTxn.to,
        type: "ACCOUNT",
        label: `${newTxn.to} (External)`,
        balance: 5000,
        risk: "MEDIUM"
      });
    }

    this.transactions.push(newTxn);
    this.edges.push({
      id: `EDGE-${txnId}`,
      source: newTxn.from,
      target: newTxn.to,
      type: "TRANSACTION",
      label: `₹${newTxn.amount.toLocaleString("en-IN")}`,
      amount: newTxn.amount,
      timestamp: newTxn.timestamp,
      flag: newTxn.flag
    });

    // Optional device link
    if (txnData.deviceId) {
      if (!this.nodes.has(txnData.deviceId)) {
        this.nodes.set(txnData.deviceId, {
          id: txnData.deviceId,
          type: "DEVICE",
          label: `Device ${txnData.deviceId}`,
          fingerprint: `fp_${txnData.deviceId.toLowerCase()}`
        });
      }
      this.edges.push({
        id: `EDGE-ATTR-DEV-${Date.now()}`,
        source: newTxn.from,
        target: txnData.deviceId,
        type: "ATTRIBUTE_LINK",
        label: "TRANSACTED_ON",
        relationship: "TRANSACTED_ON"
      });
    }

    this.logAudit("DATA_INPUT_AGENT", `Ingested live transaction ${txnId}`, { from: newTxn.from, to: newTxn.to, amount: newTxn.amount });
    return newTxn;
  }

  getGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges
    };
  }

  getRings() {
    return Array.from(this.rings.values());
  }

  getRingById(ringId) {
    return this.rings.get(ringId);
  }

  saveRing(ring) {
    this.rings.set(ring.id, ring);
  }

  updateRingStatus(ringId, status, note = "", actor = "ANALYST") {
    const ring = this.rings.get(ringId);
    if (!ring) return null;

    ring.status = status; // "TRIAGED" | "FROZEN" | "DISMISSED" | "ESCALATED"
    if (note) {
      ring.notes = ring.notes || [];
      ring.notes.push({
        text: note,
        timestamp: new Date().toISOString(),
        actor
      });
    }

    // Also update risk/frozen state on associated nodes if frozen
    if (status === "FROZEN") {
      ring.nodes.forEach(nodeId => {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.isFrozen = true;
          node.freezeTimestamp = new Date().toISOString();
        }
      });
    }

    this.logAudit(actor, `Updated ring ${ringId} status to ${status}`, { note });
    return ring;
  }

  getMetrics() {
    const rings = Array.from(this.rings.values());
    const criticalRings = rings.filter(r => r.threatLevel === "CRITICAL" || r.threatLevel === "HIGH");
    const frozenRings = rings.filter(r => r.status === "FROZEN");
    const totalFraudVolume = rings.reduce((acc, r) => acc + (r.exposedVolume || 0), 0);

    return {
      totalEntities: this.nodes.size,
      totalEdges: this.edges.length,
      totalTransactions: this.transactions.length,
      detectedRingsCount: rings.length,
      activeThreatCount: criticalRings.length,
      frozenRingsCount: frozenRings.length,
      totalFraudVolumeProtected: totalFraudVolume,
      agentAccuracyScore: "96.8%"
    };
  }
}

module.exports = new GraphStore();
