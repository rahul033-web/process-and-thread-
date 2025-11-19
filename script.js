// --- CPU Scheduling Simulator (All Algorithms) ---

let processes = [];
let pidCount = 1;

document.getElementById("addBtn").addEventListener("click", addProcess);
document.getElementById("runBtn").addEventListener("click", runScheduler);
document.getElementById("clearBtn").addEventListener("click", clearTable);
document.getElementById("resetBtn").addEventListener("click", resetAll);

function addProcess() {
  const arrival = parseInt(document.getElementById("arrival").value);
  const burst = parseInt(document.getElementById("burst").value);
  const priority = parseInt(document.getElementById("priority").value || 0);

  if (isNaN(arrival) || isNaN(burst)) {
    alert("Please enter valid Arrival and Burst time.");
    return;
  }

  const pid = "P" + pidCount++;
  processes.push({ pid, arrival, burst, priority });
  renderTable();
}

function renderTable(results = null) {
  const tbody = document.querySelector("#processTable tbody");
  tbody.innerHTML = "";

  processes.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.pid}</td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td>${p.priority || "-"}</td>
      <td>${results ? results.waiting[i] : 0}</td>
      <td>${results ? results.turnaround[i] : 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

function runScheduler() {
  if (processes.length === 0) {
    alert("Please add some processes first.");
    return;
  }

  const algo = document.getElementById("algorithm").value;
  const quantum = parseInt(document.getElementById("quantum").value) || 2;

  let result;
  switch (algo) {
    case "fcfs":
      result = fcfs(processes);
      break;
    case "sjf":
      result = sjf(processes);
      break;
    case "srtf":
      result = srtf(processes);
      break;
    case "priority":
      result = priorityScheduling(processes);
      break;
    case "rr":
      result = roundRobin(processes, quantum);
      break;
  }

  renderTable(result);
  renderGantt(result.gantt);
  showAverages(result.waiting, result.turnaround);
}

// --- FCFS ---
function fcfs(procs) {
  let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
  let time = 0, gantt = [];
  let waiting = [], turnaround = [];

  arr.forEach(p => {
    if (time < p.arrival) time = p.arrival;
    let start = time;
    time += p.burst;
    gantt.push({ pid: p.pid, start, end: time });
    turnaround.push(time - p.arrival);
    waiting.push(turnaround[turnaround.length - 1] - p.burst);
  });

  return { gantt, waiting, turnaround };
}

// --- SJF (Non-preemptive) ---
function sjf(procs) {
  let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
  let completed = [];
  let time = 0, gantt = [], waiting = [], turnaround = [];

  while (completed.length < arr.length) {
    let available = arr.filter(p => !completed.includes(p) && p.arrival <= time);
    if (available.length === 0) { time++; continue; }

    available.sort((a, b) => a.burst - b.burst);
    let current = available[0];
    let start = time;
    time += current.burst;
    gantt.push({ pid: current.pid, start, end: time });
    turnaround.push(time - current.arrival);
    waiting.push(turnaround[turnaround.length - 1] - current.burst);
    completed.push(current);
  }

  return { gantt, waiting, turnaround };
}

// --- SRTF (Preemptive SJF) ---
function srtf(procs) {
  let arr = [...procs].map(p => ({ ...p, rem: p.burst }));
  let completed = 0, time = 0, gantt = [];
  let waiting = new Array(arr.length).fill(0);
  let turnaround = new Array(arr.length).fill(0);
  let lastPid = null;

  while (completed < arr.length) {
    let available = arr.filter(p => p.arrival <= time && p.rem > 0);
    if (available.length === 0) { time++; continue; }

    available.sort((a, b) => a.rem - b.rem);
    let current = available[0];

    if (lastPid !== current.pid) {
      if (lastPid !== null) gantt[gantt.length - 1].end = time;
      gantt.push({ pid: current.pid, start: time, end: time + 1 });
      lastPid = current.pid;
    } else gantt[gantt.length - 1].end++;

    current.rem--;
    time++;

    if (current.rem === 0) {
      completed++;
      let t = arr.find(p => p.pid === current.pid);
      turnaround[arr.indexOf(t)] = time - t.arrival;
      waiting[arr.indexOf(t)] = turnaround[arr.indexOf(t)] - t.burst;
    }
  }

  return { gantt, waiting, turnaround };
}

// --- Priority Scheduling (Non-preemptive) ---
function priorityScheduling(procs) {
  let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
  let completed = [];
  let time = 0, gantt = [], waiting = [], turnaround = [];

  while (completed.length < arr.length) {
    let available = arr.filter(p => !completed.includes(p) && p.arrival <= time);
    if (available.length === 0) { time++; continue; }

    available.sort((a, b) => a.priority - b.priority);
    let current = available[0];
    let start = time;
    time += current.burst;
    gantt.push({ pid: current.pid, start, end: time });
    turnaround.push(time - current.arrival);
    waiting.push(turnaround[turnaround.length - 1] - current.burst);
    completed.push(current);
  }

  return { gantt, waiting, turnaround };
}

// --- Round Robin ---
function roundRobin(procs, quantum) {
  let arr = [...procs].map(p => ({ ...p, rem: p.burst }));
  let time = 0, queue = [], gantt = [];
  let waiting = new Array(arr.length).fill(0);
  let turnaround = new Array(arr.length).fill(0);

  arr.sort((a, b) => a.arrival - b.arrival);
  queue.push(arr[0]);
  let idx = 1;

  while (queue.length > 0) {
    let current = queue.shift();
    if (time < current.arrival) time = current.arrival;
    let start = time;

    let exec = Math.min(quantum, current.rem);
    time += exec;
    current.rem -= exec;
    gantt.push({ pid: current.pid, start, end: time });

    // Add new arrivals
    for (; idx < arr.length && arr[idx].arrival <= time; idx++) {
      queue.push(arr[idx]);
    }

    if (current.rem > 0) {
      queue.push(current);
    } else {
      let i = arr.findIndex(p => p.pid === current.pid);
      turnaround[i] = time - current.arrival;
      waiting[i] = turnaround[i] - current.burst;
    }
  }

  return { gantt, waiting, turnaround };
}

// --- Gantt Chart Renderer ---
function renderGantt(gantt) {
  const div = document.getElementById("gantt");
  div.innerHTML = "";
  gantt.forEach(seg => {
    const el = document.createElement("div");
    el.className = "segment";
    el.style.background = `hsl(${Math.random() * 360}, 70%, 50%)`;
    el.textContent = `${seg.pid} ${seg.start}–${seg.end}`;
    div.appendChild(el);
  });
}

// --- Average Times ---
function showAverages(wait, tat) {
  const avgW = (wait.reduce((a, b) => a + b, 0) / wait.length).toFixed(2);
  const avgT = (tat.reduce((a, b) => a + b, 0) / tat.length).toFixed(2);
  document.getElementById("results").innerHTML =
    `<strong>Average Waiting Time:</strong> ${avgW} | <strong>Average Turnaround Time:</strong> ${avgT}`;
}

// --- Clear / Reset ---
function clearTable() {
  processes = [];
  pidCount = 1;
  document.querySelector("#processTable tbody").innerHTML = "";
  document.getElementById("gantt").innerHTML = "";
  document.getElementById("results").innerHTML = "";
}

function resetAll() {
  clearTable();
  document.getElementById("arrival").value = "";
  document.getElementById("burst").value = "";
  document.getElementById("priority").value = "";
  document.getElementById("quantum").value = "";
}
