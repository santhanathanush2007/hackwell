/**
 * Application Frontend Logic for Agentic AI Fraud Ring Detection
 * Hackwell 2.0 - Team Graph Guardians
 */

document.addEventListener("DOMContentLoaded", () => {
  const state = {
    graph: { nodes: [], edges: [] },
    rings: [],
    stats: {},
    agentLogs: [],
    auditLogs: [],
    selectedRing: null,
    filter: "all"
  };

  // Tooltip element
  const tooltip = document.getElementById("graph-tooltip");

  // Initialize Canvas Renderer
  const renderer = new GraphRenderer("graph-canvas", {
    onNodeClick: (node) => {
      // If node belongs to a ring, select and open ring modal
      if (node.ringId) {
        const ring = state.rings.find(r => r.id === node.ringId || (r.nodes && r.nodes.includes(node.id)));
        if (ring) {
          openRingModal(ring);
          renderer.selectRing(ring.id);
        }
      }
    },
    onNodeHover: (node, rawX, rawY) => {
      if (!node) {
        tooltip.style.opacity = "0";
        return;
      }

      let extra = "";
      if (node.type === "ACCOUNT") {
        extra = `<div><strong>Balance:</strong> ₹${(node.balance || 0).toLocaleString("en-IN")}</div>`;
      } else if (node.type === "DEVICE") {
        extra = `<div><strong>Fingerprint:</strong> ${node.fingerprint || "N/A"}</div>`;
      } else if (node.type === "IP") {
        extra = `<div><strong>VPN/Proxy:</strong> ${node.vpn ? "🚨 Detected" : "Clean"}</div><div><strong>Geo:</strong> ${node.geo || "N/A"}</div>`;
      }

      tooltip.innerHTML = `
        <div style="font-weight:700; color:#00f0ff; margin-bottom:4px;">${node.id}</div>
        <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">${node.label || ""}</div>
        <div style="font-size:11px;"><strong>Type:</strong> ${node.type}</div>
        ${extra}
        ${node.ringId ? `<div style="color:#ff3366; font-size:11px; margin-top:4px;">⚠️ Ring: ${node.ringId}</div>` : ""}
      `;
      tooltip.style.left = `${rawX + 16}px`;
      tooltip.style.top = `${rawY - 20}px`;
      tooltip.style.opacity = "1";
    }
  });

  // UI Elements
  const btnRunPipeline = document.getElementById("btn-run-pipeline");
  const btnResetData = document.getElementById("btn-reset-data");
  const ringsContainer = document.getElementById("rings-list-container");
  const filterChips = document.querySelectorAll(".filter-chip");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // Metrics elements
  const elThreatRings = document.getElementById("metric-threat-rings");
  const elEntities = document.getElementById("metric-entities");
  const elEdges = document.getElementById("metric-edges");
  const elFraudVolume = document.getElementById("metric-fraud-volume");
  const elFrozenRings = document.getElementById("metric-frozen-rings");
  const elTotalRings = document.getElementById("metric-total-rings");
  const elRingCountBadge = document.getElementById("ring-count-badge");
  const elLogsContainer = document.getElementById("agent-logs-container");
  const elAuditContainer = document.getElementById("audit-trail-container");
  const elPipelineBadge = document.getElementById("pipeline-status-badge");

  // Canvas Controls
  document.getElementById("btn-zoom-in").addEventListener("click", () => renderer.zoomIn());
  document.getElementById("btn-zoom-out").addEventListener("click", () => renderer.zoomOut());
  document.getElementById("btn-reset-view").addEventListener("click", () => renderer.resetView());
  const btnHighlight = document.getElementById("btn-highlight-all");
  btnHighlight.addEventListener("click", () => {
    const active = renderer.toggleHighlightThreats();
    btnHighlight.classList.toggle("active", active);
  });

  // Modal elements
  const ringModal = document.getElementById("ring-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const modalRingTitle = document.getElementById("modal-ring-title");
  const modalRingMeta = document.getElementById("modal-ring-meta");
  const modalScore = document.getElementById("modal-score");
  const modalThreatBadge = document.getElementById("modal-threat-badge");
  const modalVolume = document.getElementById("modal-volume");
  const modalEntitiesCount = document.getElementById("modal-entities-count");
  const modalStatus = document.getElementById("modal-status");
  const modalAiExplanation = document.getElementById("modal-ai-explanation");
  const modalIndicators = document.getElementById("modal-indicators");
  const modalNodesList = document.getElementById("modal-nodes-list");

  const btnActionFreeze = document.getElementById("btn-action-freeze");
  const btnActionFlag = document.getElementById("btn-action-flag");
  const btnActionDismiss = document.getElementById("btn-action-dismiss");
  const btnExportDossier = document.getElementById("btn-export-dossier");

  // Tabs switching
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");
    });
  });

  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.filter = chip.getAttribute("data-filter");
      renderRingsList();
    });
  });

  // Modal close
  btnCloseModal.addEventListener("click", () => {
    ringModal.classList.add("hidden");
  });
  ringModal.addEventListener("click", (e) => {
    if (e.target === ringModal) ringModal.classList.add("hidden");
  });

  // Fetch full data from server
  async function loadData() {
    try {
      const [graphRes, ringsRes, statsRes, logsRes] = await Promise.all([
        fetch("/api/graph").then(r => r.json()),
        fetch("/api/rings").then(r => r.json()),
        fetch("/api/stats").then(r => r.json()),
        fetch("/api/logs").then(r => r.json())
      ]);

      if (graphRes.success) {
        state.graph = graphRes.graph;
        renderer.setData(state.graph.nodes, state.graph.edges);
      }

      if (ringsRes.success) {
        state.rings = ringsRes.rings;
        renderRingsList();
      }

      if (statsRes.success) {
        state.stats = statsRes.metrics;
        renderKPIs();
      }

      if (logsRes.success) {
        state.agentLogs = logsRes.agentLogs || [];
        state.auditLogs = logsRes.auditTrail || [];
        renderLogs();
        renderAudit();
      }
    } catch (err) {
      console.error("Error loading API data:", err);
    }
  }

  function renderKPIs() {
    const s = state.stats;
    if (!s) return;
    if (elThreatRings) elThreatRings.textContent = s.activeThreatCount || 0;
    if (elEntities) elEntities.textContent = s.totalEntities || 0;
    if (elEdges) elEdges.textContent = s.totalEdges || 0;
    if (elFraudVolume) elFraudVolume.textContent = `₹${(s.totalFraudVolumeProtected || 0).toLocaleString("en-IN")}`;
    if (elFrozenRings) elFrozenRings.textContent = s.frozenRingsCount || 0;
    if (elTotalRings) elTotalRings.textContent = s.detectedRingsCount || 0;
    if (elRingCountBadge) elRingCountBadge.textContent = `${s.detectedRingsCount || 0} Rings`;
  }

  function renderRingsList() {
    ringsContainer.innerHTML = "";

    let list = state.rings;
    if (state.filter === "CRITICAL") {
      list = list.filter(r => r.threatLevel === "CRITICAL");
    } else if (state.filter === "HIGH") {
      list = list.filter(r => r.threatLevel === "HIGH");
    } else if (state.filter === "FROZEN") {
      list = list.filter(r => r.status === "FROZEN");
    }

    if (list.length === 0) {
      ringsContainer.innerHTML = `<div style="color:#64748b; font-size:12px; text-align:center; padding:20px;">No rings match this filter</div>`;
      return;
    }

    list.forEach(ring => {
      const card = document.createElement("div");
      card.className = `ring-card ${state.selectedRing && state.selectedRing.id === ring.id ? "selected" : ""}`;
      
      const badgeClass = ring.threatLevel === "CRITICAL" ? "badge-red" : "badge-amber";
      const statusBadge = ring.status === "FROZEN" 
        ? `<span class="kpi-badge badge-green">FROZEN / CONTAINED</span>`
        : `<span class="kpi-badge ${badgeClass}">${ring.threatLevel} (${ring.riskScore})</span>`;

      card.innerHTML = `
        <div class="ring-card-header">
          <div class="ring-name">${ring.name}</div>
          ${statusBadge}
        </div>
        <div class="ring-archetype">${ring.archetype}</div>
        <div class="ring-metrics-row">
          <span>👥 ${ring.nodes.length} Nodes</span>
          <span>₹${(ring.exposedVolume || 0).toLocaleString("en-IN")}</span>
          <span>${ring.cyclesDetected > 0 ? "🔄 Cycle Loop" : "⚡ Multi-Hop"}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        document.querySelectorAll(".ring-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        openRingModal(ring);
        renderer.selectRing(ring.id);
      });

      ringsContainer.appendChild(card);
    });
  }

  function openRingModal(ring) {
    state.selectedRing = ring;
    modalRingTitle.textContent = ring.name;
    modalRingMeta.textContent = `ID: ${ring.id} • Archetype: ${ring.archetype} • Detected: ${new Date(ring.detectedAt).toLocaleTimeString()}`;
    modalScore.textContent = ring.riskScore;
    modalThreatBadge.textContent = `${ring.threatLevel} THREAT`;
    modalVolume.textContent = `₹${(ring.exposedVolume || 0).toLocaleString("en-IN")}`;
    modalEntitiesCount.textContent = `${ring.nodes.length} Connected Entities`;
    modalStatus.textContent = ring.status || "TRIAGED";

    modalAiExplanation.textContent = ring.aiExplanation;

    // Indicators
    modalIndicators.innerHTML = "";
    (ring.indicators || []).forEach(ind => {
      const li = document.createElement("li");
      li.textContent = ind;
      modalIndicators.appendChild(li);
    });

    // Nodes
    modalNodesList.innerHTML = "";
    (ring.nodes || []).forEach(nodeId => {
      const chip = document.createElement("div");
      chip.className = `node-chip ${ring.status === "FROZEN" ? "frozen" : ""}`;
      chip.innerHTML = `<span>${nodeId.startsWith("ACC") ? "💳" : (nodeId.startsWith("DEV") ? "📱" : "🌐")}</span> ${nodeId}`;
      modalNodesList.appendChild(chip);
    });

    ringModal.classList.remove("hidden");
  }

  // Handle Analyst Actions
  async function performAnalystAction(action, note) {
    if (!state.selectedRing) return;
    try {
      const res = await fetch(`/api/rings/${state.selectedRing.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note, actor: "ANALYST_HUMAN_IN_THE_LOOP" })
      }).then(r => r.json());

      if (res.success) {
        state.selectedRing = res.ring;
        await loadData();
        openRingModal(res.ring);
        alert(`Action Success: Ring status updated to ${action}. Audit log recorded.`);
      }
    } catch (e) {
      alert("Error executing action: " + e.message);
    }
  }

  btnActionFreeze.addEventListener("click", () => {
    performAnalystAction("FROZEN", "Human Analyst confirmed coordinated fraud. All linked accounts frozen.");
  });

  btnActionFlag.addEventListener("click", () => {
    performAnalystAction("FLAGGED", "Escalated for law enforcement forensic dossier review.");
  });

  btnActionDismiss.addEventListener("click", () => {
    performAnalystAction("DISMISSED", "Analyst confirmed legitimate commercial clustering.");
  });

  btnExportDossier.addEventListener("click", () => {
    if (!state.selectedRing) return;
    const dossierStr = JSON.stringify(state.selectedRing, null, 2);
    const blob = new Blob([dossierStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Forensic_Dossier_${state.selectedRing.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  function renderLogs() {
    elLogsContainer.innerHTML = "";
    state.agentLogs.slice(0, 30).forEach(log => {
      const div = document.createElement("div");
      div.className = "log-entry";
      const time = new Date(log.timestamp).toLocaleTimeString();
      div.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-agent">[${log.agentName}]:</span>
        <span>${log.summary}</span>
      `;
      elLogsContainer.appendChild(div);
    });
  }

  function renderAudit() {
    elAuditContainer.innerHTML = "";
    state.auditLogs.slice(0, 30).forEach(entry => {
      const div = document.createElement("div");
      div.className = "audit-item";
      const time = new Date(entry.timestamp).toLocaleTimeString();
      div.innerHTML = `
        <div class="audit-item-header">
          <span class="audit-actor">${entry.actor}</span>
          <span class="audit-time">${time}</span>
        </div>
        <div class="audit-action">${entry.action}</div>
      `;
      elAuditContainer.appendChild(div);
    });
  }

  // Trigger Autonomous Agent Pipeline Button
  btnRunPipeline.addEventListener("click", async () => {
    elPipelineBadge.textContent = "Running...";
    elPipelineBadge.className = "badge badge-amber";
    btnRunPipeline.disabled = true;

    // Animate through stepper items
    const stepItems = [
      document.getElementById("step-agent-1"),
      document.getElementById("step-agent-2"),
      document.getElementById("step-agent-3"),
      document.getElementById("step-agent-4"),
      document.getElementById("step-agent-5")
    ];

    for (let i = 0; i < stepItems.length; i++) {
      stepItems.forEach(s => s.classList.remove("active"));
      stepItems[i].classList.add("active");
      await new Promise(r => setTimeout(r, 180));
    }

    try {
      const res = await fetch("/api/pipeline/run", { method: "POST" }).then(r => r.json());
      if (res.success) {
        await loadData();
        elPipelineBadge.textContent = "Completed";
        elPipelineBadge.className = "badge badge-green";
      }
    } catch (e) {
      console.error(e);
      elPipelineBadge.textContent = "Error";
      elPipelineBadge.className = "badge badge-red";
    } finally {
      btnRunPipeline.disabled = false;
      setTimeout(() => {
        stepItems.forEach(s => s.classList.remove("active"));
      }, 1000);
    }
  });

  // Reset Data Button
  btnResetData.addEventListener("click", async () => {
    if (confirm("Reset graph back to Hackwell 2.0 baseline seeds?")) {
      await fetch("/api/reset", { method: "POST" });
      await loadData();
      alert("Baseline seed graph restored.");
    }
  });

  // Simulator Form Submission
  const simForm = document.getElementById("sim-form");
  simForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const from = document.getElementById("sim-from").value.trim();
    const to = document.getElementById("sim-to").value.trim();
    const amount = document.getElementById("sim-amount").value.trim();
    const deviceId = document.getElementById("sim-device").value.trim();

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, amount, deviceId, triggerPipeline: true })
      }).then(r => r.json());

      if (res.success) {
        await loadData();
        alert(`Transaction ${res.transaction.id} injected! Autonomous pipeline re-evaluated.`);
      }
    } catch (e) {
      alert("Injection error: " + e.message);
    }
  });

  // Presets for quick demo
  document.getElementById("preset-circular").addEventListener("click", () => {
    document.getElementById("sim-from").value = "ACC-105";
    document.getElementById("sim-to").value = "ACC-101";
    document.getElementById("sim-amount").value = "85000";
    document.getElementById("sim-device").value = "DEV-901";
  });

  document.getElementById("preset-farm").addEventListener("click", () => {
    document.getElementById("sim-from").value = `ACC-BOT-${Math.floor(Math.random() * 900) + 100}`;
    document.getElementById("sim-to").value = "ACC-206";
    document.getElementById("sim-amount").value = "2500";
    document.getElementById("sim-device").value = "DEV-FARM-X";
  });

  document.getElementById("preset-clean").addEventListener("click", () => {
    document.getElementById("sim-from").value = "ACC-901";
    document.getElementById("sim-to").value = "ACC-903";
    document.getElementById("sim-amount").value = "1450";
    document.getElementById("sim-device").value = "DEV-MAC-SAFE";
  });

  // Initial load
  loadData();
});
