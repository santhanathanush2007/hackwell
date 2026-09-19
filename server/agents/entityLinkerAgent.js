/**
 * AGENT 3: Entity Linking Agent
 * Role: Multi-Hop Entity Relationship Mapping, Shared Device/IP Clustering, Synthetic ID Binding
 * Hackwell 2.0 - Team Graph Guardians
 */

class EntityLinkerAgent {
  constructor(graphStore) {
    this.name = "Entity Linking Agent";
    this.graphStore = graphStore;
  }

  async run(analysisResults = {}) {
    this.graphStore.logAgentStep(
      this.name,
      "RUNNING",
      "Traversing multi-modal edges: Linking Accounts <-> Devices <-> Network IPs <-> Identity Fragments."
    );

    const graph = this.graphStore.getGraph();
    const edges = graph.edges;
    const nodes = graph.nodes;

    // Adjacency map for graph traversal
    const adj = new Map();
    nodes.forEach(n => adj.set(n.id, new Set()));

    edges.forEach(e => {
      if (!adj.has(e.source)) adj.set(e.source, new Set());
      if (!adj.has(e.target)) adj.set(e.target, new Set());
      adj.get(e.source).add(e.target);
      adj.get(e.target).add(e.source);
    });

    // Find Connected Components / Clusters
    const visited = new Set();
    const clusters = [];

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = [];
        const queue = [node.id];
        visited.add(node.id);

        while (queue.length > 0) {
          const curr = queue.shift();
          cluster.push(curr);

          const neighbors = adj.get(curr) || new Set();
          neighbors.forEach(nbr => {
            if (!visited.has(nbr)) {
              visited.add(nbr);
              queue.push(nbr);
            }
          });
        }

        // Only consider clusters of size >= 3 as candidate rings
        if (cluster.length >= 3) {
          clusters.push(cluster);
        }
      }
    });

    // Detect specific linkages:
    // 1. Shared Devices: Devices connected to >= 2 accounts
    const sharedDevices = [];
    nodes
      .filter(n => n.type === "DEVICE")
      .forEach(dev => {
        const connectedAccounts = edges
          .filter(e => (e.source === dev.id || e.target === dev.id) && e.type === "ATTRIBUTE_LINK")
          .map(e => (e.source === dev.id ? e.target : e.source))
          .filter(id => id.startsWith("ACC-"));

        if (connectedAccounts.length >= 2) {
          sharedDevices.push({
            deviceId: dev.id,
            label: dev.label,
            accountCount: connectedAccounts.length,
            accounts: connectedAccounts
          });
        }
      });

    // 2. Shared VPN/Proxies:
    const sharedIPs = [];
    nodes
      .filter(n => n.type === "IP" && n.vpn)
      .forEach(ip => {
        const connected = edges
          .filter(e => e.source === ip.id || e.target === ip.id)
          .map(e => (e.source === ip.id ? e.target : e.source));
        if (connected.length >= 2) {
          sharedIPs.push({
            ipId: ip.id,
            label: ip.label,
            connectedNodes: connected
          });
        }
      });

    // 3. Synthetic Identity Collisions:
    const idCollisions = [];
    nodes
      .filter(n => n.type === "IDENTITY" || n.type === "PHONE")
      .forEach(kyc => {
        const connectedAccs = edges
          .filter(e => e.source === kyc.id || e.target === kyc.id)
          .map(e => (e.source === kyc.id ? e.target : e.source))
          .filter(id => id.startsWith("ACC-"));
        if (connectedAccs.length >= 2) {
          idCollisions.push({
            kycId: kyc.id,
            label: kyc.label,
            accounts: connectedAccs
          });
        }
      });

    const summary = `Mapped ${edges.length} multi-hop links across ${nodes.length} entities. Discovered ${clusters.length} connected network subgraphs, ${sharedDevices.length} shared device farms, and ${idCollisions.length} KYC collision vectors.`;

    this.graphStore.logAgentStep(this.name, "COMPLETED", summary, {
      candidateClusters: clusters.length,
      sharedDevicesDetected: sharedDevices.length,
      sharedIPsDetected: sharedIPs.length,
      identityCollisions: idCollisions.length
    });

    return {
      success: true,
      agent: this.name,
      summary,
      clusters,
      sharedDevices,
      sharedIPs,
      idCollisions
    };
  }
}

module.exports = EntityLinkerAgent;
