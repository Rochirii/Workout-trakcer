const STORAGE_KEY = "daily-system-v1";
const todayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const stats = [
  { key: "strength", label: "Strength", short: "STR" },
  { key: "core", label: "Core", short: "CORE" },
  { key: "stamina", label: "Stamina", short: "STA" },
  { key: "agility", label: "Agility", short: "AGI" },
  { key: "discipline", label: "Discipline", short: "WILL" }
];

const exercisePools = {
  balanced: [
    ["Push-ups", "strength", 10, "Clean reps, chest near floor"],
    ["Crunches", "core", 16, "Slow up, slow down"],
    ["Bodyweight squats", "stamina", 18, "Knees track over toes"],
    ["Plank", "core", 30, "Seconds"],
    ["Marching lunges", "agility", 12, "Each side counts"]
  ],
  strength: [
    ["Push-ups", "strength", 12, "Strict form"],
    ["Pike push-ups", "strength", 7, "Shoulders forward"],
    ["Squats", "strength", 20, "Controlled depth"],
    ["Wall sit", "stamina", 35, "Seconds"]
  ],
  core: [
    ["Crunches", "core", 18, "Ribs to hips"],
    ["Leg raises", "core", 9, "Low back steady"],
    ["Plank", "core", 35, "Seconds"],
    ["Mountain climbers", "stamina", 20, "Total reps"]
  ],
  stamina: [
    ["Fast squats", "stamina", 24, "Smooth rhythm"],
    ["High knees", "stamina", 30, "Seconds"],
    ["Step-back lunges", "agility", 14, "Total reps"],
    ["Plank jacks", "stamina", 16, "Total reps"]
  ],
  mobility: [
    ["Deep squat hold", "agility", 35, "Seconds"],
    ["Hip bridges", "core", 16, "Squeeze at top"],
    ["World's greatest stretch", "agility", 5, "Each side"],
    ["Shoulder taps", "core", 16, "No hip sway"]
  ]
};

const jumpingMoves = [
  ["Jumping jacks", "stamina", 35, "Total reps"],
  ["Burpees", "stamina", 6, "Controlled pace"],
  ["Jump squats", "strength", 8, "Land quietly"]
];

const defaultState = {
  name: "Rookie Hunter",
  fitness: "beginner",
  allowJumping: false,
  mode: "balanced",
  level: 1,
  xp: 0,
  streak: 0,
  lastClaimed: null,
  questDate: null,
  quest: [],
  completed: {},
  statValues: {
    strength: 8,
    core: 8,
    stamina: 8,
    agility: 8,
    discipline: 8
  },
  history: []
};

let state = loadState();

const els = {
  rank: document.querySelector("#rankLabel"),
  level: document.querySelector("#levelLabel"),
  streak: document.querySelector("#streakLabel"),
  xpLabel: document.querySelector("#xpLabel"),
  xpFill: document.querySelector("#xpFill"),
  focus: document.querySelector("#focusLabel"),
  questTitle: document.querySelector("#questTitle"),
  difficulty: document.querySelector("#difficultyLabel"),
  questList: document.querySelector("#questList"),
  claim: document.querySelector("#claimButton"),
  stats: document.querySelector("#statGrid"),
  history: document.querySelector("#historyList"),
  hunterName: document.querySelector("#hunterName"),
  mode: document.querySelector("#trainingMode"),
  settings: document.querySelector("#settingsDialog"),
  settingsButton: document.querySelector("#settingsButton"),
  resetDay: document.querySelector("#resetDayButton"),
  nameInput: document.querySelector("#nameInput"),
  fitnessInput: document.querySelector("#fitnessInput"),
  jumpInput: document.querySelector("#jumpInput"),
  saveSettings: document.querySelector("#saveSettingsButton")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneDefaultState();
  try {
    return { ...cloneDefaultState(), ...JSON.parse(saved) };
  } catch {
    return cloneDefaultState();
  }
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `quest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function ensureQuest(force = false) {
  const today = todayKey();
  if (!force && state.questDate === today && state.quest.length) return;

  const random = seededRandom(`${today}-${state.level}-${state.mode}-${Date.now()}`);
  const pool = [...exercisePools[state.mode], ...exercisePools.balanced];
  if (state.allowJumping) pool.push(...jumpingMoves);

  const scale = state.fitness === "advanced" ? 1.55 : state.fitness === "active" ? 1.25 : 1;
  const levelBoost = 1 + Math.min(0.75, (state.level - 1) * 0.035);
  const questCount = Math.min(5, 3 + Math.floor(state.level / 6));
  const picked = [];

  while (picked.length < questCount) {
    const item = pool[Math.floor(random() * pool.length)];
    if (!picked.find((entry) => entry.name === item[0])) {
      const base = item[2];
      const target = Math.max(5, Math.round(base * scale * levelBoost));
      picked.push({
        id: createId(),
        name: item[0],
        stat: item[1],
        target,
        note: item[3],
        exp: 18 + Math.round(target / 3)
      });
    }
  }

  state.questDate = today;
  state.quest = picked;
  state.completed = {};
  saveState();
}

function xpNeeded() {
  return 100 + (state.level - 1) * 26;
}

function rankForLevel(level) {
  if (level >= 50) return "S";
  if (level >= 36) return "A";
  if (level >= 24) return "B";
  if (level >= 14) return "C";
  if (level >= 7) return "D";
  return "E";
}

function completeQuest(id) {
  state.completed[id] = !state.completed[id];
  saveState();
  render();
}

function claimRewards() {
  const allDone = state.quest.every((item) => state.completed[item.id]);
  if (!allDone || state.lastClaimed === todayKey()) return;

  let gained = 35;
  state.quest.forEach((item) => {
    gained += item.exp;
    state.statValues[item.stat] += 2;
  });
  state.statValues.discipline += 3;
  state.xp += gained;

  while (state.xp >= xpNeeded()) {
    state.xp -= xpNeeded();
    state.level += 1;
    stats.forEach((stat) => {
      state.statValues[stat.key] += 1;
    });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const priorDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  state.streak = state.lastClaimed === priorDate ? state.streak + 1 : 1;
  state.lastClaimed = todayKey();
  state.history.unshift({
    date: state.lastClaimed,
    exp: gained,
    title: `${state.mode[0].toUpperCase()}${state.mode.slice(1)} Quest`
  });
  state.history = state.history.slice(0, 7);
  saveState();
  render();
}

function render() {
  ensureQuest();
  const needed = xpNeeded();
  const allDone = state.quest.every((item) => state.completed[item.id]);
  const claimed = state.lastClaimed === todayKey();

  els.rank.textContent = rankForLevel(state.level);
  els.level.textContent = state.level;
  els.streak.textContent = state.streak;
  els.xpLabel.textContent = `${state.xp} / ${needed} EXP`;
  els.xpFill.style.width = `${Math.min(100, (state.xp / needed) * 100)}%`;
  els.focus.textContent = `${state.mode[0].toUpperCase()}${state.mode.slice(1)}`;
  els.hunterName.textContent = state.name;
  els.questTitle.textContent = claimed ? "Quest Cleared" : "Daily Training";
  els.difficulty.textContent = state.level > 12 ? "Hard" : state.level > 5 ? "Normal+" : "Normal";
  els.mode.value = state.mode;
  els.claim.disabled = !allDone || claimed;
  els.claim.lastChild.textContent = claimed ? " Rewards Claimed" : " Claim Rewards";

  els.questList.innerHTML = "";
  state.quest.forEach((item) => {
    const row = document.createElement("article");
    row.className = `quest-item ${state.completed[item.id] ? "done" : ""}`;
    row.innerHTML = `
      <button class="check-button" type="button" aria-label="Toggle ${item.name}">✓</button>
      <div>
        <div class="quest-name">${item.name}</div>
        <div class="quest-meta">${item.note} · +${item.exp} EXP · ${item.stat.toUpperCase()}</div>
      </div>
      <div class="rep-count">${item.target}</div>
    `;
    row.querySelector("button").addEventListener("click", () => completeQuest(item.id));
    els.questList.appendChild(row);
  });

  els.stats.innerHTML = "";
  stats.forEach((stat) => {
    const value = state.statValues[stat.key];
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <div class="stat-row">
        <span class="label">${stat.short}</span>
        <strong>${value}</strong>
      </div>
      <div class="stat-track" aria-label="${stat.label} stat progress">
        <div class="stat-fill" style="width: ${Math.min(100, value)}%"></div>
      </div>
    `;
    els.stats.appendChild(card);
  });

  els.history.innerHTML = state.history.length
    ? state.history.map((item) => `<div class="history-item"><strong>${item.title}</strong><span>+${item.exp} EXP</span></div>`).join("")
    : `<div class="history-item"><strong>No clears yet</strong><span>Today waits</span></div>`;
}

els.claim.addEventListener("click", claimRewards);
els.resetDay.addEventListener("click", () => {
  ensureQuest(true);
  render();
});
els.mode.addEventListener("change", (event) => {
  state.mode = event.target.value;
  ensureQuest(true);
  render();
});
els.settingsButton.addEventListener("click", () => {
  els.nameInput.value = state.name;
  els.fitnessInput.value = state.fitness;
  els.jumpInput.checked = state.allowJumping;
  els.settings.showModal();
});
els.saveSettings.addEventListener("click", () => {
  state.name = els.nameInput.value.trim() || "Rookie Hunter";
  state.fitness = els.fitnessInput.value;
  state.allowJumping = els.jumpInput.checked;
  ensureQuest(true);
  saveState();
  render();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js");
}

render();
