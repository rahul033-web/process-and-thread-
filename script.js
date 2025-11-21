
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = k => {
  const v = localStorage.getItem(k);
  return v ? JSON.parse(v) : null;
};

// ---------- Process list state (scheduler page) ----------
let processes = load('processList') || [];
let nextPid = processes.length ? Math.max(...processes.map(p=>p.pidNum))+1 : 1;

// ---------- Helpers ----------
function makePid(n){ return 'P' + n; }

// ---------- Scheduler Page: DOM refs & initial render ----------
const addBtn = document.getElementById('addBtn');
const runBtn = document.getElementById('runBtn');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');

function updateTable(){
  const tbody = document.querySelector('#processTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  processes.forEach(p => {
    tbody.innerHTML += `<tr>
      <td>${p.pid}</td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td>${p.priority === null ? '-' : p.priority}</td>
      <td>${p.waiting != null ? p.waiting : '-'}</td>
      <td>${p.tat != null ? p.tat : '-'}</td>
    </tr>`;
  });
}

// initialize table on load if scheduler page
if(document.querySelector('#processTable')) updateTable();

// ---------- Add process ----------
if(addBtn){
  addBtn.addEventListener('click', ()=>{
    const a = document.getElementById('arrival').value;
    const b = document.getElementById('burst').value;
    const pr = document.getElementById('priority').value;

    if(a === '' || b === '') { alert('Arrival and Burst required'); return; }
    const arrival = parseInt(a,10), burst = parseInt(b,10);
    if(Number.isNaN(arrival) || Number.isNaN(burst) || arrival < 0 || burst <= 0){
      alert('Enter valid numbers (arrival >=0, burst > 0)');
      return;
    }

    const proc = {
      pid: makePid(nextPid),
      pidNum: nextPid,
      arrival,
      burst,
      priority: pr.trim() === '' ? null : parseInt(pr,10),
      waiting: null,
      tat: null
    };
    nextPid++;
    processes.push(proc);
    save('processList', processes);
    updateTable();

    // clear inputs
    document.getElementById('arrival').value = '';
    document.getElementById('burst').value = '';
    document.getElementById('priority').value = '';
  });
}

// ---------- Clear & Reset ----------
if(clearBtn){
  clearBtn.addEventListener('click', ()=>{
    processes = [];
    nextPid = 1;
    save('processList', processes);
    updateTable();
  });
}
if(resetBtn){
  resetBtn.addEventListener('click', ()=>{
    if(confirm('Reset ALL saved data?')){
      localStorage.clear();
      processes = [];
      nextPid = 1;
      updateTable();
    }
  });
}

// ---------- Show/hide quantum ----------
function toggleQuantum(){
  const algo = document.getElementById('algorithm').value;
  const qDiv = document.getElementById('quantumDiv');
  if(algo === 'rr') qDiv.style.display = 'block';
  else qDiv.style.display = 'none';
}
// attach if select exists
const algoSelect = document.getElementById('algorithm');
if(algoSelect) algoSelect.addEventListener('change', toggleQuantum);

// ---------- Run scheduler (navigate to output) ----------
if(runBtn){
  runBtn.addEventListener('click', ()=>{
    processes = processes.filter(p=>p && typeof p.arrival === 'number'); // sanity
    if(processes.length === 0){ alert('Add at least one process'); return; }
    const algo = document.getElementById('algorithm').value;
    if(!algo){ alert('Choose an algorithm'); return; }
    let quantum = null;
    if(algo === 'rr'){
      const q = document.getElementById('quantum').value;
      if(!q || isNaN(parseInt(q,10)) || parseInt(q,10) <= 0){ alert('Enter valid quantum for Round Robin'); return; }
      quantum = parseInt(q,10);
    }
    // persist
    save('processList', processes);
    save('algorithm', algo);
    save('quantum', quantum);
    // go
    window.location.href = 'output.html';
  });
}

// ---------- OUTPUT PAGE: scheduling algorithms & rendering ----------
function renderOutput(){
  const outTableBody = document.querySelector('#outputTable tbody');
  const ganttDiv = document.getElementById('gantt');
  const algo = load('algorithm') || 'fcfs';
  const quantum = load('quantum');
  let list = load('processList') || [];

  document.getElementById('algoOut').innerText = (algo || '').toUpperCase();
  document.getElementById('quantumOut').innerText = quantum || '-';

  if(!list.length){
    if(outTableBody) outTableBody.innerHTML = `<tr><td colspan="6">No processes found. Add processes on Scheduler page.</td></tr>`;
    return;
  }

  // deep clone list to avoid mutating stored data
  list = list.map(p => ({...p}));

  // Sort helper for stable order
  const byArrivalThenPid = (a,b) => a.arrival - b.arrival || a.pidNum - b.pidNum;

  let gantt = []; // {pid, start, end}

  // helper to reset waiting/tat before calculate
  list.forEach(p => { p.waiting = 0; p.tat = 0; });

  if(algo === 'fcfs'){
    list.sort(byArrivalThenPid);
    let t = 0;
    list.forEach(p=>{
      if(t < p.arrival) t = p.arrival;
      const start = t;
      const end = t + p.burst;
      gantt.push({pid: p.pid, start, end});
      p.waiting = start - p.arrival;
      p.tat = p.waiting + p.burst;
      t = end;
    });
  }
  else if(algo === 'sjf'){
    // non-preemptive SJF
    let t = 0;
    const done = new Set();
    while(done.size < list.length){
      const ready = list.filter(p => p.arrival <= t && !done.has(p.pid));
      if(ready.length === 0){
        t++;
        continue;
      }
      ready.sort((a,b)=> a.burst - b.burst || a.arrival - b.arrival);
      const p = ready[0];
      const start = t < p.arrival ? p.arrival : t;
      const end = start + p.burst;
      gantt.push({pid: p.pid, start, end});
      p.waiting = start - p.arrival;
      p.tat = p.waiting + p.burst;
      t = end;
      done.add(p.pid);
    }
  }
  else if(algo === 'priority'){
    // non-preemptive priority (lower value = higher priority). null priority => treated large
    let t = 0;
    const done = new Set();
    while(done.size < list.length){
      const ready = list.filter(p => p.arrival <= t && !done.has(p.pid));
      if(ready.length === 0){
        t++;
        continue;
      }
      ready.sort((a,b)=>{
        const pa = pPriorityVal(a), pb = pPriorityVal(b);
        return pa - pb || a.arrival - b.arrival;
      });
      const p = ready[0];
      const start = t < p.arrival ? p.arrival : t;
      const end = start + p.burst;
      gantt.push({pid: p.pid, start, end});
      p.waiting = start - p.arrival;
      p.tat = p.waiting + p.burst;
      t = end;
      done.add(p.pid);
    }

    function pPriorityVal(p){ return p.priority === null ? 1e9 : p.priority; }
  }
  else if(algo === 'rr'){
    // Round Robin (preemptive)
    const q = parseInt(quantum,10) || 1;
    let t = 0;
    const rem = {};
    list.forEach(p => rem[p.pid] = p.burst);
    const finished = new Set();
    const arrivalOrdered = [...list].sort(byArrivalThenPid);
    const queue = [];
    let idx = 0; // index in arrivalOrdered to push newly arrived
    while(finished.size < list.length){
      // enqueue arrived processes
      while(idx < arrivalOrdered.length && arrivalOrdered[idx].arrival <= t){
        if(!queue.includes(arrivalOrdered[idx].pid) && rem[arrivalOrdered[idx].pid] > 0) queue.push(arrivalOrdered[idx].pid);
        idx++;
      }
      if(queue.length === 0){
        // if nothing ready, advance time to next arrival
        if(idx < arrivalOrdered.length) t = arrivalOrdered[idx].arrival;
        else break;
        continue;
      }
      const pid = queue.shift();
      const proc = list.find(p => p.pid === pid);
      const exec = Math.min(q, rem[pid]);
      const start = t;
      const end = t + exec;
      gantt.push({pid, start, end});
      rem[pid] -= exec;
      t = end;
      // enqueue new arrivals that came during execution
      while(idx < arrivalOrdered.length && arrivalOrdered[idx].arrival <= t){
        if(!queue.includes(arrivalOrdered[idx].pid) && rem[arrivalOrdered[idx].pid] > 0) queue.push(arrivalOrdered[idx].pid);
        idx++;
      }
      if(rem[pid] > 0){
        queue.push(pid); // requeue
      } else {
        finished.add(pid);
      }
    }

    // compute waiting & tat using finish times
    list.forEach(p => {
      const runs = gantt.filter(g => g.pid === p.pid);
      const finish = runs[runs.length - 1].end;
      p.tat = finish - p.arrival;
      p.waiting = p.tat - p.burst;
    });
  }

  // write results table
  if(outTableBody){
    outTableBody.innerHTML = '';
    let totalWait = 0, totalTat = 0;
    list.forEach(p=>{
      outTableBody.innerHTML += `<tr>
        <td>${p.pid}</td>
        <td>${p.arrival}</td>
        <td>${p.burst}</td>
        <td>${p.priority === null ? '-' : p.priority}</td>
        <td>${p.waiting}</td>
        <td>${p.tat}</td>
      </tr>`;
      totalWait += p.waiting;
      totalTat += p.tat;
    });
    const avgW = (totalWait / list.length).toFixed(2);
    const avgT = (totalTat / list.length).toFixed(2);
    const avgDiv = document.getElementById('averages');
    if(avgDiv) avgDiv.innerText = `Average Waiting Time: ${avgW}    •    Average Turnaround Time: ${avgT}`;
  }

  // render Gantt chart (simple proportional widths)
  if(ganttDiv){
    ganttDiv.innerHTML = '';
    // find timeline min and max to scale
    const minStart = Math.min(...gantt.map(g=>g.start));
    const maxEnd = Math.max(...gantt.map(g=>g.end));
    const totalSpan = Math.max(1, maxEnd - minStart);
    const scalePxPerUnit = Math.min(60, Math.max(10, 520 / totalSpan)); // adjust width scaling
    gantt.forEach(seg=>{
      const w = (seg.end - seg.start) * scalePxPerUnit;
      const el = document.createElement('div');
      el.className = 'gantt-box';
      el.style.minWidth = (w)+'px';
      el.style.textAlign = 'center';
      el.style.padding = '8px 6px';
      el.innerHTML = `<div>${seg.pid}</div><div style="font-weight:600;font-size:0.8rem;color:rgba(0,0,0,0.6)">${seg.start}→${seg.end}</div>`;
      ganttDiv.appendChild(el);
    });
  }

  // also save the last run results for convenience (so user can revisit)
  save('lastGantt', gantt);
  save('lastList', list);
}

// expose renderOutput for onload
window.renderOutput = renderOutput;
window.toggleQuantum = toggleQuantum;
