/**
 * High-Performance Interactive HTML5 Canvas Graph Renderer
 * Force-Directed Physics, Animated Money-Flow Particles, Cyberpunk Glow & Selection Highlighting
 * Hackwell 2.0 - Team Graph Guardians
 */

class GraphRenderer {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.options = Object.assign({
      onNodeClick: null,
      onNodeHover: null
    }, options);

    this.nodes = [];
    this.edges = [];
    this.nodeMap = new Map();

    // Camera & Transform
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;

    // Interaction State
    this.isDraggingCanvas = false;
    this.draggedNode = null;
    this.hoveredNode = null;
    this.selectedRingId = null;
    this.selectedNodeId = null;
    this.highlightThreats = true;

    this.lastMousePos = { x: 0, y: 0 };
    this.particles = [];
    this.animationFrame = null;

    this.initEvents();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  setData(nodes, edges) {
    this.nodeMap.clear();

    // Preserve existing positions if possible, or initialize around center
    this.nodes = nodes.map((n, idx) => {
      const existing = this.nodeMap.get(n.id);
      const angle = (idx / nodes.length) * 2 * Math.PI;
      const radius = 120 + (idx % 3) * 60;

      const nodeObj = {
        ...n,
        x: existing ? existing.x : this.width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: existing ? existing.y : this.height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: n.type === "ACCOUNT" ? 18 : (n.type === "DEVICE" ? 16 : 14)
      };

      this.nodeMap.set(n.id, nodeObj);
      return nodeObj;
    });

    this.edges = edges.map(e => ({
      ...e,
      sourceNode: this.nodeMap.get(e.source),
      targetNode: this.nodeMap.get(e.target)
    })).filter(e => e.sourceNode && e.targetNode);

    // Initialize animation particles on transaction edges
    this.particles = [];
    this.edges.forEach((edge, idx) => {
      if (edge.type === "TRANSACTION") {
        this.particles.push({
          edge,
          progress: Math.random(),
          speed: 0.006 + Math.random() * 0.006
        });
      }
    });

    if (!this.animationFrame) {
      this.animate();
    }
  }

  initEvents() {
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.canvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - this.panX) / this.scale,
      y: (clientY - this.panY) / this.scale,
      rawX: clientX,
      rawY: clientY
    };
  }

  findNodeAt(x, y) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      const dx = n.x - x;
      const dy = n.y - y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        return n;
      }
    }
    return null;
  }

  onMouseDown(e) {
    const coords = this.getCanvasCoords(e);
    const clickedNode = this.findNodeAt(coords.x, coords.y);

    if (clickedNode) {
      this.draggedNode = clickedNode;
      this.selectedNodeId = clickedNode.id;
      if (this.options.onNodeClick) {
        this.options.onNodeClick(clickedNode);
      }
    } else {
      this.isDraggingCanvas = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    }
  }

  onMouseMove(e) {
    const coords = this.getCanvasCoords(e);

    if (this.draggedNode) {
      this.draggedNode.x = coords.x;
      this.draggedNode.y = coords.y;
      this.draggedNode.vx = 0;
      this.draggedNode.vy = 0;
    } else if (this.isDraggingCanvas) {
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.panX += dx;
      this.panY += dy;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    } else {
      // Hover detection
      const node = this.findNodeAt(coords.x, coords.y);
      if (node !== this.hoveredNode) {
        this.hoveredNode = node;
        if (this.options.onNodeHover) {
          this.options.onNodeHover(node, coords.rawX, coords.rawY);
        }
      }
    }
  }

  onMouseUp() {
    this.draggedNode = null;
    this.isDraggingCanvas = false;
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const coords = this.getCanvasCoords(e);

    const newScale = Math.max(0.3, Math.min(3.5, this.scale * zoomFactor));

    // Zoom centered towards mouse position
    this.panX = coords.rawX - (coords.rawX - this.panX) * (newScale / this.scale);
    this.panY = coords.rawY - (coords.rawY - this.panY) * (newScale / this.scale);
    this.scale = newScale;
  }

  zoomIn() {
    this.scale = Math.min(3.5, this.scale * 1.25);
  }

  zoomOut() {
    this.scale = Math.max(0.3, this.scale * 0.8);
  }

  resetView() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
  }

  selectRing(ringId) {
    this.selectedRingId = ringId;
  }

  toggleHighlightThreats() {
    this.highlightThreats = !this.highlightThreats;
    return this.highlightThreats;
  }

  // Physics Simulation Step
  updatePhysics() {
    const k = 0.04;
    const repulsion = 1800;
    const centerPull = 0.005;
    const damping = 0.84;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Repulsion between all nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        if (dist < 260) {
          const force = repulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (n1 !== this.draggedNode) { n1.vx -= fx; n1.vy -= fy; }
          if (n2 !== this.draggedNode) { n2.vx += fx; n2.vy += fy; }
        }
      }

      // Center gravity
      if (n1 !== this.draggedNode) {
        n1.vx += (centerX - n1.x) * centerPull;
        n1.vy += (centerY - n1.y) * centerPull;
      }
    }

    // Spring attraction along edges
    this.edges.forEach(e => {
      const n1 = e.sourceNode;
      const n2 = e.targetNode;
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desiredDist = e.type === "TRANSACTION" ? 110 : 80;
      const force = (dist - desiredDist) * k;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (n1 !== this.draggedNode) { n1.vx += fx; n1.vy += fy; }
      if (n2 !== this.draggedNode) { n2.vx -= fx; n2.vy -= fy; }
    });

    // Update positions
    this.nodes.forEach(n => {
      if (n !== this.draggedNode) {
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      }
    });

    // Update edge flow particles
    this.particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1) p.progress = 0;
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.scale, this.scale);

    // 1. Draw Edges
    this.edges.forEach(e => {
      const src = e.sourceNode;
      const tgt = e.targetNode;
      const isTxn = e.type === "TRANSACTION";
      const isRingSelected = this.selectedRingId && (src.ringId === this.selectedRingId && tgt.ringId === this.selectedRingId);

      this.ctx.beginPath();
      this.ctx.moveTo(src.x, src.y);
      this.ctx.lineTo(tgt.x, tgt.y);

      if (isTxn) {
        this.ctx.strokeStyle = isRingSelected ? "#ff3366" : "rgba(255, 51, 102, 0.4)";
        this.ctx.lineWidth = isRingSelected ? 2.5 : 1.5;
        this.ctx.setLineDash([]);
      } else {
        this.ctx.strokeStyle = isRingSelected ? "#00f0ff" : "rgba(100, 116, 139, 0.35)";
        this.ctx.lineWidth = isRingSelected ? 2 : 1.2;
        this.ctx.setLineDash([4, 4]);
      }
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw Edge Label if zoomed in
      if (this.scale > 0.8 && isTxn) {
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        this.ctx.font = "9px 'JetBrains Mono', monospace";
        this.ctx.fillStyle = isRingSelected ? "#ff3366" : "rgba(255, 255, 255, 0.6)";
        this.ctx.fillText(e.label, midX + 4, midY - 4);
      }
    });

    // 2. Draw Moving Particles along transaction lines
    this.particles.forEach(p => {
      const src = p.edge.sourceNode;
      const tgt = p.edge.targetNode;
      const px = src.x + (tgt.x - src.x) * p.progress;
      const py = src.y + (tgt.y - src.y) * p.progress;

      this.ctx.beginPath();
      this.ctx.arc(px, py, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = "#ff3366";
      this.ctx.shadowColor = "#ff3366";
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // 3. Draw Nodes
    const now = Date.now() / 600;
    this.nodes.forEach(n => {
      const isSelectedRing = this.selectedRingId && n.ringId === this.selectedRingId;
      const isSelectedNode = this.selectedNodeId === n.id;
      const isHovered = this.hoveredNode === n;
      const isThreat = n.ringId && (n.risk === "CRITICAL" || n.risk === "HIGH");

      // Draw Ring Highlight Pulse
      if (this.highlightThreats && isThreat) {
        const pulseSize = n.radius + 6 + Math.sin(now + n.x) * 3;
        this.ctx.beginPath();
        this.ctx.arc(n.x, n.y, pulseSize, 0, Math.PI * 2);
        this.ctx.strokeStyle = n.isFrozen ? "rgba(0, 230, 153, 0.5)" : "rgba(255, 51, 102, 0.5)";
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      }

      if (isSelectedRing || isSelectedNode) {
        this.ctx.beginPath();
        this.ctx.arc(n.x, n.y, n.radius + 8, 0, Math.PI * 2);
        this.ctx.strokeStyle = "#00f0ff";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      // Base Node Circle
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

      let fillColor = "#3b82f6"; // Account: blue
      if (n.type === "DEVICE") fillColor = "#ffb800"; // Device: orange
      else if (n.type === "IP") fillColor = "#a855f7"; // IP: purple
      else if (n.type === "IDENTITY" || n.type === "PHONE") fillColor = "#00e699"; // KYC: green

      if (n.isFrozen) fillColor = "#10b981"; // Neutralized/Frozen

      this.ctx.fillStyle = fillColor;
      this.ctx.shadowColor = fillColor;
      this.ctx.shadowBlur = isHovered || isSelectedRing ? 16 : 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Inner Icon / Type Mark
      this.ctx.font = "bold 9px 'JetBrains Mono', monospace";
      this.ctx.fillStyle = "#000";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      const typeText = n.type === "ACCOUNT" ? "ACC" : (n.type === "DEVICE" ? "DEV" : (n.type === "IP" ? "IP" : "ID"));
      this.ctx.fillText(typeText, n.x, n.y);

      // Node Label underneath
      this.ctx.font = "11px 'Inter', sans-serif";
      this.ctx.fillStyle = isSelectedRing || isHovered ? "#00f0ff" : "#cbd5e1";
      this.ctx.textAlign = "center";
      this.ctx.fillText(n.id, n.x, n.y + n.radius + 12);
    });

    this.ctx.restore();
  }

  animate() {
    this.updatePhysics();
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
}

window.GraphRenderer = GraphRenderer;
