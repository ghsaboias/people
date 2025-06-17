class NetworkGraph {
  constructor(canvasId, initialData = null) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.entities = {};
    this.relationships = [];
    this.nodes = [];
    this.selectedNode = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.animationId = null;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this.setupCanvas();
    this.setupEventListeners();
    if (initialData) {
      this.loadData(initialData);
    } else {
      // Start with an empty graph when no external data is provided
      this.updateUI();
    }
    this.startAnimation();
  }

  setupCanvas() {
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  setupEventListeners() {
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.canvas.addEventListener("wheel", (e) => this.onWheel(e));
    this.canvas.addEventListener("click", (e) => this.onClick(e));
  }

  loadData(data) {
    if (!data) return;

    // Convert new structure to internal entities format
    this.entities = {};

    // Add people
    if (data.people) {
      Object.keys(data.people).forEach((id) => {
        this.entities[id] = {
          ...data.people[id],
          type: "person",
        };
      });
    }

    // Add companies
    if (data.companies) {
      Object.keys(data.companies).forEach((id) => {
        this.entities[id] = {
          ...data.companies[id],
          type: "company",
        };
      });
    }

    this.relationships = data.relationships || [];
    this.generateNodes();
    this.updateUI();
  }

  generateNodes() {
    this.nodes = [];
    Object.keys(this.entities).forEach((id) => {
      const entity = this.entities[id];
      this.nodes.push({
        id: id,
        ...entity,
        x: Math.random() * (this.canvas.width - 200) + 100,
        y: Math.random() * (this.canvas.height - 200) + 100,
        vx: 0,
        vy: 0,
        radius: entity.type === "person" ? 25 : 20,
      });
    });
  }

  addEntity(name, type) {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    if (this.entities[id]) return false;

    this.entities[id] = { name, type };
    this.nodes.push({
      id: id,
      name: name,
      type: type,
      x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: this.canvas.height / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      radius: type === "person" ? 25 : 20,
    });

    this.updateUI();
    return true;
  }

  addRelationship(fromId, toId, type) {
    if (!this.entities[fromId] || !this.entities[toId]) return false;

    // Check if relationship already exists
    const exists = this.relationships.some(
      (r) =>
        (r.from === fromId && r.to === toId) ||
        (r.from === toId && r.to === fromId)
    );

    if (exists) return false;

    this.relationships.push({ from: fromId, to: toId, type });
    this.updateUI();
    return true;
  }

  updateUI() {
    this.updateEntityDropdowns();
    this.updateEntityList();
    this.updateStats();
  }

  updateEntityDropdowns() {
    const fromSelect = document.getElementById("fromEntity");
    const toSelect = document.getElementById("toEntity");

    [fromSelect, toSelect].forEach((select) => {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Select...</option>';
      Object.keys(this.entities).forEach((id) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = this.entities[id].name;
        select.appendChild(option);
      });
      select.value = currentValue;
    });
  }

  updateEntityList() {
    const container = document.getElementById("entityListContainer");
    container.innerHTML = "";

    Object.keys(this.entities).forEach((id) => {
      const entity = this.entities[id];
      const div = document.createElement("div");
      div.className = "entity-item";
      div.innerHTML = `
                    <span>${entity.name}</span>
                    <span class="entity-type type-${entity.type}">${entity.type}</span>
                `;
      div.addEventListener("click", () => this.focusOnEntity(id));
      container.appendChild(div);
    });
  }

  updateStats() {
    document.getElementById("entityCount").textContent = Object.keys(
      this.entities
    ).length;
    document.getElementById("connectionCount").textContent =
      this.relationships.length;
  }

  focusOnEntity(id) {
    const node = this.nodes.find((n) => n.id === id);
    if (node) {
      this.camera.x = -node.x + this.canvas.width / 2;
      this.camera.y = -node.y + this.canvas.height / 2;
    }
  }

  simulate() {
    const nodes = this.nodes;
    const relationships = this.relationships;

    // Apply forces
    nodes.forEach((node) => {
      node.vx *= 0.9; // Damping
      node.vy *= 0.9;
    });

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const force = 1000 / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }
    }

    // Attraction for connected nodes
    relationships.forEach((rel) => {
      const nodeA = nodes.find((n) => n.id === rel.from);
      const nodeB = nodes.find((n) => n.id === rel.to);

      if (nodeA && nodeB) {
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetDistance = 150;

        if (distance > 0) {
          const force = (distance - targetDistance) * 0.01;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodeA.vx += fx;
          nodeA.vy += fy;
          nodeB.vx -= fx;
          nodeB.vy -= fy;
        }
      }
    });

    // Update positions
    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    // Draw relationships
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    this.relationships.forEach((rel) => {
      const nodeA = this.nodes.find((n) => n.id === rel.from);
      const nodeB = this.nodes.find((n) => n.id === rel.to);

      if (nodeA && nodeB) {
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.stroke();

        // Draw relationship label
        const midX = (nodeA.x + nodeB.x) / 2;
        const midY = (nodeA.y + nodeB.y) / 2;
        ctx.fillStyle = "#666";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(rel.type, midX, midY - 5);
      }
    });

    // Draw nodes
    this.nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

      if (node.type === "person") {
        ctx.fillStyle = "#4a90e2";
      } else if (node.type === "fund") {
        ctx.fillStyle = "#e67e22";
      } else {
        ctx.fillStyle = "#7ed321"; // company or other
      }

      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw name
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.name, node.x, node.y + node.radius + 15);
    });

    ctx.restore();
  }

  startAnimation() {
    const animate = () => {
      this.simulate();
      this.render();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  getMousePosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.camera.x) / this.camera.zoom,
      y: (e.clientY - rect.top - this.camera.y) / this.camera.zoom,
    };
  }

  getNodeAt(x, y) {
    return this.nodes.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return dx * dx + dy * dy <= node.radius * node.radius;
    });
  }

  onMouseDown(e) {
    const pos = this.getMousePosition(e);
    const node = this.getNodeAt(pos.x, pos.y);

    if (node) {
      this.selectedNode = node;
      this.isDragging = true;
      this.dragOffset.x = pos.x - node.x;
      this.dragOffset.y = pos.y - node.y;
    } else {
      // Begin panning
      this.isPanning = true;
      this.panStart.x = e.clientX;
      this.panStart.y = e.clientY;
    }
  }

  onMouseMove(e) {
    if (this.isDragging && this.selectedNode) {
      const pos = this.getMousePosition(e);
      this.selectedNode.x = pos.x - this.dragOffset.x;
      this.selectedNode.y = pos.y - this.dragOffset.y;
      this.selectedNode.vx = 0;
      this.selectedNode.vy = 0;
    } else if (this.isPanning) {
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      this.camera.x += dx;
      this.camera.y += dy;
      this.panStart.x = e.clientX;
      this.panStart.y = e.clientY;
    }
  }

  onMouseUp(e) {
    this.isDragging = false;
    this.selectedNode = null;
    this.isPanning = false;
  }

  onClick(e) {
    const pos = this.getMousePosition(e);
    const node = this.getNodeAt(pos.x, pos.y);

    if (node) {
      this.showNodeInfo(node);
    } else {
      this.hideNodeInfo();
    }
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.camera.zoom *= zoomFactor;
    this.camera.zoom = Math.max(0.1, Math.min(3, this.camera.zoom));
  }

  showNodeInfo(node) {
    const panel = document.getElementById("infoPanel");
    const title = document.getElementById("infoTitle");
    const content = document.getElementById("infoContent");

    title.textContent = node.name;

    const connections = this.relationships
      .filter((r) => r.from === node.id || r.to === node.id)
      .map((r) => {
        const otherId = r.from === node.id ? r.to : r.from;
        const otherName = this.entities[otherId].name;
        return `${r.type} ${otherName}`;
      });

    content.innerHTML = `
                <div><strong>Type:</strong> ${node.type}</div>
                <div><strong>Connections:</strong> ${connections.length}</div>
                <div style="margin-top: 10px;">${connections
                  .map((c) => `<div>• ${c}</div>`)
                  .join("")}</div>
            `;

    panel.style.display = "block";
  }

  hideNodeInfo() {
    document.getElementById("infoPanel").style.display = "none";
  }

  reset() {
    this.entities = {};
    this.relationships = [];
    this.nodes = [];
    this.updateUI();
  }

  center() {
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.zoom = 1;
  }
}

// Global functions for UI
let graph;

function addEntity() {
  const name = document.getElementById("entityName").value.trim();
  const type = document.getElementById("entityType").value;

  if (name) {
    if (graph.addEntity(name, type)) {
      document.getElementById("entityName").value = "";
    } else {
      alert("Entity already exists");
    }
  }
}

function addRelationship() {
  const from = document.getElementById("fromEntity").value;
  const to = document.getElementById("toEntity").value;
  const type = document.getElementById("relType").value;

  if (from && to && from !== to) {
    if (graph.addRelationship(from, to, type)) {
      document.getElementById("fromEntity").value = "";
      document.getElementById("toEntity").value = "";
    } else {
      alert("Relationship already exists");
    }
  }
}

function resetGraph() {
  graph.reset();
}

function centerGraph() {
  graph.center();
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("collapsed");
  // Recalculate canvas size after layout change
  if (typeof graph !== "undefined" && graph) {
    graph.resizeCanvas();
  }
}

// Initialize
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("data/graph.json");
    const data = await res.json();
    graph = new NetworkGraph("networkCanvas", data);
  } catch (err) {
    console.error(
      "Could not load external data; starting with an empty graph.",
      err
    );
    graph = new NetworkGraph("networkCanvas");
  }
});

// Handle Enter key
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    if (e.target.id === "entityName") {
      addEntity();
    }
  }
});
