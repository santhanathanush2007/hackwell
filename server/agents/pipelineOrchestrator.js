/**
 * Agentic AI Pipeline Orchestrator
 * Coordinates the 5-Agent Detection Flow (Slide 5 of Hackwell 2.0 PPT)
 * Team Graph Guardians
 */

const DataInputAgent = require("./dataInputAgent");
const AnalysisAgent = require("./analysisAgent");
const EntityLinkerAgent = require("./entityLinkerAgent");
const RiskScorerAgent = require("./riskScorerAgent");
const AlertAgent = require("./alertAgent");

class PipelineOrchestrator {
  constructor(graphStore) {
    this.graphStore = graphStore;
    this.dataInputAgent = new DataInputAgent(graphStore);
    this.analysisAgent = new AnalysisAgent(graphStore);
    this.entityLinkerAgent = new EntityLinkerAgent(graphStore);
    this.riskScorerAgent = new RiskScorerAgent(graphStore);
    this.alertAgent = new AlertAgent(graphStore);
    this.isRunning = false;
  }

  async runPipeline() {
    if (this.isRunning) {
      return { status: "ALREADY_RUNNING", message: "Pipeline currently executing." };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const trace = [];

    try {
      this.graphStore.logAudit("ORCHESTRATOR", "Starting Autonomous 5-Agent Detection Cycle");

      // 1. Data Input Agent
      const step1 = await this.dataInputAgent.run();
      trace.push(step1);

      // 2. Analysis Agent
      const step2 = await this.analysisAgent.run();
      trace.push(step2);

      // 3. Entity Linking Agent
      const step3 = await this.entityLinkerAgent.run(step2);
      trace.push(step3);

      // 4. Risk Scoring Agent
      const step4 = await this.riskScorerAgent.run(step3, step2);
      trace.push(step4);

      // 5. Alert & Analyst Review Agent
      const step5 = await this.alertAgent.run(step4);
      trace.push(step5);

      const totalTimeMs = Date.now() - startTime;
      this.graphStore.logAudit("ORCHESTRATOR", `Autonomous Detection Cycle completed in ${totalTimeMs}ms`, {
        ringsFound: step4.rings.length,
        durationMs: totalTimeMs
      });

      return {
        success: true,
        durationMs: totalTimeMs,
        completedAt: new Date().toISOString(),
        trace,
        rings: step4.rings,
        alerts: step5.alerts,
        metrics: this.graphStore.getMetrics()
      };
    } catch (err) {
      console.error("Pipeline execution error:", err);
      this.graphStore.logAudit("ORCHESTRATOR", "Pipeline execution error", { error: err.message });
      throw err;
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = PipelineOrchestrator;
