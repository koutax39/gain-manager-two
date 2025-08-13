// ===== ユーティリティ =====
const z2 = n => String(n).padStart(2, "0");
const dateKey = (y, m, d) => `records-${y}-${z2(m)}-${z2(d)}`;

// ===== ユーザー管理 =====
const USER_KEY = "user-list";
let users = (JSON.parse(localStorage.getItem(USER_KEY)) || ["YUNE", "KIKO"])
  .filter(u => (u ?? "").trim() !== "");

function saveUsers(){ localStorage.setItem(USER_KEY, JSON.stringify(users)); }
function renderUsers(){
  // select
  const sel = document.getElementById("user-select");
  if (sel){
    sel.innerHTML = "";
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u; opt.textContent = u;
      sel.appendChild(opt);
    });
  }
  // editable list
  const list = document.getElementById("user-list");
  if (list){
    list.innerHTML = "";
    users.forEach((u, i) => {
      const li = document.createElement("li");
      li.className = "user-list-item";

      const input = document.createElement("input");
      input.className="user-input";
      input.value = u;

      const save = document.createElement("button");
      save.textContent = "保存";
      save.className = "user-save-btn";

      const del = document.createElement("button");
      del.textContent = "削除";
      del.className = "user-delete-btn";

      save.onclick = () => {
        users[i] = input.value.trim();
        users = users.filter(x=>x);
        saveUsers(); renderUsers(); updateSummary();
      };
      del.onclick = () => {
        if(confirm(`${u} を削除しますか？`)){
          users.splice(i,1);
          saveUsers(); renderUsers(); updateSummary();
        }
      };
      li.append(input, save, del);
      list.appendChild(li);
    });
  }
}

// ===== タスク管理 =====
const TASKS_KEY = "task-list";
const DEFAULT_TASKS = [
  { name: "トイレ掃除", amount: 100 },
  { name: "食器洗い", amount: 100 },
  { name: "ゴミ集め", amount: 10 },
  { name: "乾燥機に入れる", amount: 100 },
  { name: "洗濯物たたむ", amount: 50 },
  { name: "掃除機", amount: 50 },
  { name: "靴ならべ", amount: 30 },
  { name: "テーブル拭き", amount: 30 },
  { name: "本を読む", amount: 500 },
  { name: "テスト100点小学生", amount: 500 },
  { name: "平均点合格中学生", amount: 1000 },
  { name: "テスト勉強1ページ", amount: 50 },
  { name: "携帯の使いすぎ", amount: -100 },
];
let tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || "null");
if (!Array.isArray(tasks) || tasks.length === 0) {
  tasks = DEFAULT_TASKS.slice();
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
function saveTasks(){
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
function renderTaskSelect(){
  const sel = document.getElementById("task-select");
  if (!sel) return;
  sel.innerHTML = "";
  tasks.forEach(t=>{
    const opt = document.createElement("option");
    opt.value = t.name;
    opt.dataset.amount = String(t.amount);
    opt.textContent = `${t.name}（${t.amount}円）`;
    sel.appendChild(opt);
  });
}
function renderTaskEditor(){
  const list = document.getElementById("task-list");
  if (!list) return;
  list.innerHTML = "";
  tasks.forEach((t, idx)=>{
    const li = document.createElement("li");
    li.className = "task-list-item";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = t.name;
    nameInput.className = "task-input-name";

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.value = String(t.amount);
    amountInput.className = "task-input-amount";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "更新";

    const delBtn = document.createElement("button");
    delBtn.textContent = "削除";

    saveBtn.onclick = () => {
      const newName = nameInput.value.trim();
      const newAmount = Number(amountInput.value);
      if (!newName || Number.isNaN(newAmount)) {
        alert("タスク名と金額を正しく入力してください");
        return;
      }
      tasks[idx] = { name: newName, amount: newAmount };
      saveTasks();
      renderTaskEditor();
      renderTaskSelect();
    };
    delBtn.onclick = () => {
      if (confirm(`「${t.name}」を削除しますか？`)){
        tasks.splice(idx,1);
        saveTasks();
        renderTaskEditor();
        renderTaskSelect();
      }
    };

    li.append(nameInput, amountInput, saveBtn, delBtn);
    list.appendChild(li);
  });
}

// ===== カレンダー =====
let currentDate = new Date();
let selectedDate = null;

function renderCalendar(date){
  const cal = document.getElementById("calendar");
  const monthYear = document.getElementById("month-year");
  const y = date.getFullYear(), m = date.getMonth() + 1;
  cal.innerHTML = "";
  monthYear.textContent = `${y}年${m}月`;

  // 曜日ヘッダ
  ["日","月","火","水","木","金","土"].forEach(d=>{
    const hd=document.createElement("div"); hd.className="day-header"; hd.textContent=d; cal.appendChild(hd);
  });

  const firstDay = new Date(y, m-1, 1).getDay();
  const lastDate = new Date(y, m, 0).getDate();

  for(let i=0;i<firstDay;i++){ cal.appendChild(document.createElement("div")); }

  for(let d=1; d<=lastDate; d++){
    const cell = document.createElement("div");
    cell.className = "day";
    cell.textContent = d;

    // その日の登録があるユーザー色をうっすら付与
    const recs = JSON.parse(localStorage.getItem(dateKey(y,m,d)) || "[]");
    const firstUser = recs[0]?.user;
    if (firstUser){
      const idx = Math.max(0, users.indexOf(firstUser)) % 3;
      cell.classList.add(`user-color-${idx}`);
    }

    cell.onclick = () => {
      selectedDate = { y, m, d };
      document.getElementById("selected-date").textContent = `${y}/${m}/${d} の記録`;
      document.getElementById("input-form").style.display = "block";
      document.getElementById("count-label").textContent = "1";
      renderHistory(y,m,d);
    };

    cal.appendChild(cell);
  }

  // 月のサマリーを更新
  updateSummary();
}

// ===== 記録の追加 =====
document.getElementById("increase").onclick = () => {
  const el = document.getElementById("count-label");
  el.textContent = String(Number(el.textContent)+1);
};
document.getElementById("decrease").onclick = () => {
  const el = document.getElementById("count-label");
  const n = Math.max(1, Number(el.textContent)-1);
  el.textContent = String(n);
};
document.getElementById("add-record").onclick = () => {
  if (!selectedDate){ alert("日付を選んでください"); return; }
  const user = document.getElementById("user-select").value;
  const opt = document.getElementById("task-select").selectedOptions[0];
  const task = opt.value;
  const amount = Number(opt.dataset.amount);
  const count = Number(document.getElementById("count-label").textContent);
  const total = amount * count;

  const key = dateKey(selectedDate.y, selectedDate.m, selectedDate.d);
  const recs = JSON.parse(localStorage.getItem(key) || "[]");
  recs.push({ user, task, amount, count, total });
  localStorage.setItem(key, JSON.stringify(recs));

  alert(`✅ ${selectedDate.y}/${selectedDate.m}/${selectedDate.d} に ${user} さんが「${task}」×${count}（${total}円）`);
  document.getElementById("input-form").style.display = "none";
  renderHistory(selectedDate.y, selectedDate.m, selectedDate.d);
  updateSummary();
};

// ===== 履歴表示（削除対応） =====
function renderHistory(y,m,d){
  const key = dateKey(y,m,d);
  const recs = JSON.parse(localStorage.getItem(key) || "[]");
  const section = document.getElementById("history-section");
  const title = document.getElementById("history-title");
  const list = document.getElementById("history-list");
  list.innerHTML = "";
  if (recs.length === 0){ section.style.display="none"; return; }
  title.textContent = `${y}/${m}/${d} の履歴`;

  recs.forEach((r,i)=>{
    const li = document.createElement("li");
    const text = `#${i+1}：${r.user} さんが ${r.task} を ${r.count}回（${r.total}円）`;
    const span = document.createElement("span");
    span.textContent = text;

    const del = document.createElement("button");
    del.textContent = "削除";
    del.onclick = () => {
      if (confirm(`${text} を削除しますか？`)){
        const arr = JSON.parse(localStorage.getItem(key) || "[]");
        arr.splice(i,1);
        localStorage.setItem(key, JSON.stringify(arr));
        renderHistory(y,m,d);
        updateSummary();
        // カレンダーの色も更新
        renderCalendar(currentDate);
      }
    };

    li.append(span, del);
    list.appendChild(li);
  });
  section.style.display="block";
}

// ===== サマリー（月表示中の月で集計） =====
function updateSummary(){
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth()+1;
  const totals = Object.fromEntries(users.map(u=>[u,0]));

  // 月内の全日を走査（1〜31）
  for(let d=1; d<=31; d++){
    const recs = JSON.parse(localStorage.getItem(dateKey(y,m,d)) || "[]");
    recs.forEach(r=>{
      if (totals.hasOwnProperty(r.user)){ totals[r.user] += r.total || 0; }
    });
  }

  const ul = document.getElementById("monthly-summary-list");
  ul.innerHTML = "";
  let i = 0, grand = 0;
  for (const u of users){
    const li = document.createElement("li");
    li.textContent = `${u}: ${totals[u]}円`;
    li.style.listStyle = "none";
    li.classList.add(`user-color-${i%3}`);
    ul.appendChild(li);
    grand += totals[u];
    i++;
  }
  document.getElementById("total-amount").textContent = `合計：${grand}円`;
}

// ===== 月移動・UI初期化 =====
document.getElementById("prev-month").onclick = () => {
  currentDate.setMonth(currentDate.getMonth()-1);
  renderCalendar(currentDate);
  document.getElementById("input-form").style.display = "none";
};
document.getElementById("next-month").onclick = () => {
  currentDate.setMonth(currentDate.getMonth()+1);
  renderCalendar(currentDate);
  document.getElementById("input-form").style.display = "none";
};

document.getElementById("toggle-user-settings").onclick = () => {
  const el = document.getElementById("user-settings");
  el.style.display = (el.style.display === "block") ? "none" : "block";
};
document.getElementById("toggle-task-settings").onclick = () => {
  const el = document.getElementById("task-settings");
  el.style.display = (el.style.display === "block") ? "none" : "block";
  if (el.style.display === "block"){
    renderTaskEditor();
  }
};
document.getElementById("add-user-button").onclick = () => {
  const name = document.getElementById("new-user-name").value.trim();
  if (!name) return;
  if (users.includes(name)) { alert("すでに存在します"); return; }
  users.push(name);
  saveUsers(); renderUsers(); updateSummary();
  document.getElementById("new-user-name").value = "";
};
document.getElementById("add-task-button").onclick = () => {
  const name = document.getElementById("new-task-name").value.trim();
  const amount = Number(document.getElementById("new-task-amount").value);
  if (!name || Number.isNaN(amount)){
    alert("タスク名と金額を正しく入力してください");
    return;
  }
  if (tasks.some(t=>t.name === name)){
    if (!confirm("同名のタスクがあります。上書きしますか？")) return;
    tasks = tasks.map(t => t.name === name ? { name, amount } : t);
  } else {
    tasks.push({ name, amount });
  }
  saveTasks();
  renderTaskEditor();
  renderTaskSelect();
  document.getElementById("new-task-name").value = "";
  document.getElementById("new-task-amount").value = "";
};

// 初期化
renderUsers();
renderTaskSelect();
renderCalendar(currentDate);
updateSummary();
