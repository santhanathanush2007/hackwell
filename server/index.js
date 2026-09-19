/**
 * Express REST API Server for Agentic AI Fraud Ring Detection
 * Hackwell 2.0 - Saranathan College of Engineering
 * Team Graph Guardians
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

const graphStore = require("./store/graphStore");
const PipelineOrchestrator = require("./agents/pipelineOrchestrator");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const orchestrator = new PipelineOrchestrator(graphStore);

// Execute initial detection run on server startup
(async () => {
  try {
    console.log("🚀 Initializing Autonomous Agent Pipeline...");
    await orchestrator.runPipeline();
    console.log("✅ Initial Agent Detection Cycle completed successfully.");
  } catch (e) {
    console.error("Initialization error:", e);
  }
})();

// === API ROUTES ===

// 1. Get full entity graph
app.get("/api/graph", (req, res) => {
  const graph = graphStore.getGraph();
  res.json({ success: true, graph });
});

// 2. Get all detected fraud rings
app.get("/api/rings", (req, res) => {
  const rings = graphStore.getRings();
  res.json({ success: true, count: rings.length, rings });
});

// 3. Get single ring details
app.get("/api/rings/:id", (req, res) => {
  const ring = graphStore.getRingById(req.params.id);
  if (!ring) return res.status(404).json({ success: false, message: "Ring not found" });
  res.json({ success: true, ring });
});

// 4. Trigger Autonomous Pipeline Run
app.post("/api/pipeline/run", async (req, res) => {
  try {
    const result = await orchestrator.runPipeline();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Ingest new transaction (Live Real-Time Simulation)
app.post("/api/transactions", async (req, res) => {
  try {
    const { from, to, amount, deviceId, flag, triggerPipeline } = req.body;
    if (!from || !to || !amount) {
      return res.status(400).json({ success: false, message: "Missing required fields (from, to, amount)" });
    }

    const newTxn = graphStore.addTransaction({
      from,
      to,
      amount: Number(amount),
      deviceId,
      flag
    });

    let pipelineResult = null;
    if (triggerPipeline !== false) {
      pipelineResult = await orchestrator.runPipeline();
    }

    res.json({
      success: true,
      message: "Transaction ingested successfully",
      transaction: newTxn,
      pipelineResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Human-in-the-Loop Analyst Actions (Freeze, Flag, Dismiss, Add Note)
app.post("/api/rings/:id/action", (req, res) => {
  const { action, note, actor } = req.body;
  const validActions = ["FROZEN", "FLAGGED", "DISMISSED", "TRIAGED"];

  if (!action || !validActions.includes(action)) {
    return res.status(400).json({ success: false, message: `Invalid action. Valid: ${validActions.join(", ")}` });
  }

  const updatedRing = graphStore.updateRingStatus(req.params.id, action, note, actor || "FRAUD_ANALYST");
  if (!updatedRing) {
    return res.status(404).json({ success: false, message: "Ring not found" });
  }

  res.json({
    success: true,
    message: `Ring status updated to ${action}`,
    ring: updatedRing
  });
});

// 7. System & Fraud Metrics Overview
app.get("/api/stats", (req, res) => {
  res.json({
    success: true,
    metrics: graphStore.getMetrics()
  });
});

// 8. Agent Execution Logs & Audit Trail
app.get("/api/logs", (req, res) => {
  res.json({
    success: true,
    agentLogs: graphStore.agentExecutionLogs,
    auditTrail: graphStore.auditLogs
  });
});

// 9. Reset baseline data
app.post("/api/reset", async (req, res) => {
  graphStore.reset();
  await orchestrator.runPipeline();
  res.json({ success: true, message: "Graph reset to baseline and pipeline re-executed." });
});

// Catch-all route to serve SPA frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  ==============================================================
  🛡️  AGENTIC AI FRAUD RING DETECTION PLATFORM
  🎓  HACKWELL 2.0 - SARANATHAN COLLEGE OF ENGINEERING
  👥  TEAM: GRAPH GUARDIANS
  🌐  URL: http://localhost:${PORT}
  ==============================================================
  `);
});
