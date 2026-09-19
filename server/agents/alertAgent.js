/**
 * AGENT 5: Alert & Analyst Review Agent
 * Role: Human-in-the-Loop Case Prioritization, Action Recommendation, Audit Logging
 * Hackwell 2.0 - Team Graph Guardians
 */

class AlertAgent {
  constructor(graphStore) {
    this.name = "Alert & Analyst Review Agent";
    this.graphStore = graphStore;
  }

  async run(riskResults = {}) {
    this.graphStore.logAgentStep(
      this.name,
      "RUNNING",
      "Prioritizing alerts by threat score, generating containment recommendations, and queuing for analyst review."
    );

    const rings = riskResults.rings || this.graphStore.getRings();
    const prioritizedAlerts = rings.map(ring => {
      let actionRecommendation = "MONITOR";
      let priority = "P3";

      if (ring.riskScore >= 85) {
        actionRecommendation = "IMMEDIATE_FREEZE_ALL_ACCOUNTS";
        priority = "P1 - EMERGENCY";
      } else if (ring.riskScore >= 65) {
        actionRecommendation = "ENFORCE_STEP_UP_KYC_AND_LIMIT_WITHDRAWALS";
        priority = "P2 - HIGH";
      }

      return {
        alertId: `ALT-${ring.id}`,
        ringId: ring.id,
        ringName: ring.name,
        threatLevel: ring.threatLevel,
        riskScore: ring.riskScore,
        priority,
        actionRecommendation,
        nodesCount: ring.nodes.length,
        exposedVolumeFormatted: `₹${ring.exposedVolume.toLocaleString("en-IN")}`,
        aiSummary: ring.aiExplanation,
        timestamp: ring.detectedAt
      };
    });

    const summary = `Compiled ${prioritizedAlerts.length} actionable alerts into analyst queue. Ranked by threat severity and financial exposure with human-in-the-loop review controls.`;

    this.graphStore.logAgentStep(this.name, "COMPLETED", summary, {
      alertsQueued: prioritizedAlerts.length,
      p1Alerts: prioritizedAlerts.filter(a => a.priority.includes("P1")).length
    });

    return {
      success: true,
      agent: this.name,
      summary,
      alerts: prioritizedAlerts
    };
  }
}

module.exports = AlertAgent;
