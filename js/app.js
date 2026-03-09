

let currentUser = null;
let currentPage = "dashboard";
let sidebarOpen = true;
let userStats = {
  totalScore: 0,
  currentStreak: 0,
  quizzesCompleted: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  accuracy: 0,
};
let userActivities = [];
let userSettings = { sound_enabled: 1, notifications: 1, difficulty: "normal" };


document.addEventListener("DOMContentLoaded", async () => {
  await checkSession();
  renderHeaderRight();
  navigateTo("dashboard");
});

async function checkSession() {
  const res = await apiCheckSession();
  if (res.loggedIn) {
    currentUser = res.user;
    await loadUserData();
  }
}

async function loadUserData() {
  const [statsRes, actRes, settRes] = await Promise.all([
    apiGetStats(),
    apiGetActivities(),
    apiGetSettings(),
  ]);
  if (statsRes.success) userStats = statsRes.stats;
  if (actRes.success) userActivities = actRes.activities;
  if (settRes.success && settRes.settings) userSettings = settRes.settings;
}


async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");

  if (!username || !password) {
    errEl.textContent = "All fields required";
    return;
  }

  const res = await apiLogin(username, password);
  if (res.success) {
    currentUser = res.user;
    await loadUserData();
    closeModal("login-modal");
    renderHeaderRight();
    navigateTo("dashboard");
  } else {
    errEl.textContent = res.message || "Login failed";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  const errEl = document.getElementById('register-error');
  const upperCase = document.getElementById('upperCase');
  const lowerCase = document.getElementById('lowerCase');
  const number = document.getElementById('number');
  const specialChar = document.getElementById('specialChar');

  const containSpecialChar = /[!@#$%^&*(),.?":{}|<>~`_+=\\[\];'-]/;
  const containUpperCase = /[A-Z]/;
  const containLowerCase = /[a-z]/;
  const containNumber = /[0-9]/;

  const upperToggle = containUpperCase.test(password);
  const lowerToggle = containLowerCase.test(password);
  const numToggle = containNumber.test(password);
  const specialCharToggle = containSpecialChar.test(password);

  upperCase.classList.toggle("error", !upperToggle);
  lowerCase.classList.toggle("error", !lowerToggle);
  number.classList.toggle("error", !numToggle);
  specialChar.classList.toggle("error", !specialCharToggle);

  if(!upperToggle || !lowerToggle || !numToggle || !specialCharToggle){
    
    setTimeout(() => {
    upperCase.classList.remove("error");
    lowerCase.classList.remove("error");
    number.classList.remove("error", !numToggle);
    specialChar.classList.remove("error");   
    }, 1000);
    
    return;
  }
  const userRes = await checkUsername(username);
  
  if(password != confirm){
    errEl.style.display = 'block'
    errEl.textContent = "Password not match"
    return;
  }else if(userRes.exists){
    errEl.style.display = 'block';
    errEl.textContent = "Username Exists";
    return;
  }

  const res = await apiRegister(username, email, password, confirm);
  if (res.success) {
    closeModal("register-modal");
  } else {
    errEl.style.display = 'block';
    errEl.textContent = res.message || "Registration failed";
  }
}

async function handleLogout() {
  await apiLogout();
  currentUser = null;
  userStats = {
    totalScore: 0,
    currentStreak: 0,
    quizzesCompleted: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    accuracy: 0,
  };
  userActivities = [];
  renderHeaderRight();
  navigateTo("dashboard");
}

const visibility = document.querySelectorAll('.visibility');

visibility.forEach(eye => {
    const inputId = eye.dataset.id; 
    const input = document.getElementById(inputId);

    eye.addEventListener('click', () => {
        const isHidden = eye.classList.contains('fa-eye-slash');

        eye.classList.toggle('fa-eye-slash', !isHidden);
        eye.classList.toggle('fa-eye', isHidden);

        input.type = isHidden ? 'text' : 'password';
    });
});

// ===== HEADER =====
function renderHeaderRight() {
  const el = document.getElementById("header-right");
  if (currentUser) {
    const avatar = currentUser.avatar || "avatar1";
    const avatarObj = AVATARS.find((a) => a.id === avatar) || AVATARS[0];
    el.innerHTML = `
            <div class="profile-btn" onclick="toggleProfileMenu()">
                <span class="profile-avatar">${avatarObj.emoji}</span>
                <span class="profile-name">${currentUser.username}</span>
            </div>
            <div id="profile-menu" style="display:none; position:absolute; top: 60px; right: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px; min-width: 160px; z-index: 101;">
                <a class="nav-link" onclick="openModal('avatar-modal'); renderAvatarGrid(); toggleProfileMenu()"><span class="nav-icon">🎨</span> Change Avatar</a>
                <a class="nav-link" onclick="handleLogout()"><span class="nav-icon">🚪</span> Logout</a>
            </div>
        `;
  } else {
    el.innerHTML = `
            <button class="btn btn-outline btn-sm" onclick="openModal('login-modal')">Login</button>
            <button class="btn btn-primary btn-sm" onclick="openModal('register-modal')">Register</button>
        `;
  }
}

function toggleProfileMenu() {
  const m = document.getElementById("profile-menu");
  if (m) m.style.display = m.style.display === "none" ? "block" : "none";
}

// ===== SIDEBAR =====
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  const sb = document.getElementById("sidebar");
  if (sidebarOpen) {
    sb.classList.remove("collapsed");
    sb.classList.remove("mobile-open");
    document.body.classList.remove("sidebar-collapsed");
  } else {
    sb.classList.add("collapsed");
    document.body.classList.add("sidebar-collapsed");
  }

  if (window.innerWidth <= 480) {
    sb.classList.toggle("mobile-open");
  }
}

// ===== NAVIGATION =====
function navigateTo(page) {
  currentPage = page;
  
  if (quizState.timerId) {
    clearInterval(quizState.timerId);
    quizState.timerId = null;
  }

  document.querySelectorAll(".nav-link[data-page]").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  if (window.innerWidth <= 480) {
    document.getElementById("sidebar").classList.remove("mobile-open");
  }

  const main = document.getElementById("main-content");
  switch (page) {
    case "dashboard":
      renderDashboard(main);
      break;
    case "quizzes":
      renderQuizCategories(main);
      break;
    case "leaderboard":
      renderLeaderboard(main);
      break;
    case "achievements":
      renderAchievements(main);
      break;
    case "settings":
      renderSettings(main);
      break;
    default:
      renderDashboard(main);
  }
}


function openModal(id) {

   if (id === "login-modal") {
    document.getElementById("login-form").reset();
    document.getElementById("login-error").textContent = "";
  }

  // Reset register form
  if (id === "register-modal") {
    document.getElementById("register-form").reset();
    document.getElementById("register-error").textContent = "";
    if(document.getElementById('upperCase').classList.contains('show')){
      document.getElementById('upperCase').classList.remove('show');
    }
    if(document.getElementById('lowerCase').classList.contains('show')){
      document.getElementById('lowerCase').classList.remove('show');
    }
    if(document.getElementById('number').classList.contains('show')){
      document.getElementById('number').classList.remove('show');
    }
    if(document.getElementById('specialChar').classList.contains('show')){
      document.getElementById('specialChar').classList.remove('show');
    }
  }
  document.getElementById(id).style.display = "flex";

}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

const regPassword = document.getElementById("reg-password");
const containLabel = document.getElementById('containLabel');
const upperCase = document.getElementById('upperCase');
const lowerCase = document.getElementById('lowerCase');
const number = document.getElementById('number');
const specialChar = document.getElementById('specialChar');

regPassword.addEventListener("input", () => {
  const containSpecialChar = /[!@#$%^&*(),.?":{}|<>~`_+=\\[\];'-]/;
  const containUpperCase = /[A-Z]/;
  const containLowerCase = /[a-z]/;
  const containNumber = /[0-9]/; 

  upperCase.classList.toggle("show", containUpperCase.test(regPassword.value));
  lowerCase.classList.toggle("show", containLowerCase.test(regPassword.value));
  number.classList.toggle("show", containNumber.test(regPassword.value));
  specialChar.classList.toggle("show", containSpecialChar.test(regPassword.value));
});

// ===== DASHBOARD =====
function renderDashboard(main) {
  console.log(userActivities.length);
  const welcome = currentUser
    ? `Welcome back, ${currentUser.username}!`
    : "Welcome to MathQuest!";
  main.innerHTML = `
        <div class="fade-in">
            <h1 class="page-title">${welcome}</h1>
            <div class="stats-grid">
                <div class="card stat-card">
                    <i class="fa-solid fa-star stat-icon"></i>
                    <div>
                        <div class="stat-label">Total Score</div>
                        <div class="stat-value">${userStats.totalScore}</div>
                    </div>
                </div>
                <div class="card stat-card">
                    <i class="fa-solid fa-fire stat-icon"></i>
                    <div>
                        <div class="stat-label">Current Streak</div>
                        <div class="stat-value">${userStats.currentStreak}</div>
                    </div>
                </div>
                <div class="card stat-card">
                    <i class="fa-solid fa-circle-check stat-icon"></i>
                    <div>
                        <div class="stat-label">Quizzes Completed</div>
                        <div class="stat-value">${userStats.quizzesCompleted}</div>
                    </div>
                </div>
                <div class="card stat-card">
                    <i class="fa-solid fa-chart-line stat-icon"></i>
                    <div>
                        <div class="stat-label">Accuracy</div>
                        <div class="stat-value">${userStats.accuracy}%</div>
                    </div>
                </div>
            </div>
            <div class="card">
                <h2 style="margin-bottom: 16px;">Recent Activity</h2>
                ${
                  userActivities.length === 0
                    ? '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">No recent activity. Start a quiz to see your progress!</div></div>'
                    : `<div class="activity-list">${userActivities
                        .map(
                          (a) => `
                        <div class="activity-item">
                            <span class="activity-icon">${(CATEGORIES[a.category] || {}).icon || "🧮"}</span>
                            <div class="activity-info">
                                <div class="activity-title">${a.category} - Level ${a.level}</div>
                                <div class="activity-meta">Score: ${a.score} | Accuracy: ${a.accuracy}%${a.time_taken ? " | Time: " + a.time_taken + "s" : ""}</div>
                            </div>
                            <span class="activity-time">${timeAgo(a.timestamp)}</span>
                        </div>
                    `,
                        )
                        .join("")}</div>`
                }
            </div>
        </div>
    `;
}

// ===== QUIZ CATEGORIES =====
function renderQuizCategories(main) {
  let add = "addition";
  let sub = "subtraction";
  let mult = "multiplication";
  let div = "division"

  main.innerHTML = `
        <div class="fade-in">
            <h1 class="page-title">Choose a Category</h1>
            <!--categories-->
            <div class="quiz-categories">
                <!--addition-->
                <div class="category-card" data-category="addition">
                    <div class="category-icon"><i class="fa-solid fa-plus"></i></div>
                    <h3>Addition</h3>
                    <p>Master the art of adding numbers</p>
                    <button class="start-btn" onclick= selectCategory('${add}')>Start Quiz</button>
                </div>

                <!--Subtraction-->
                <div class="category-card" data-category="subtraction">
                    <div class="category-icon"><i class="fa-solid fa-minus"></i></div>
                    <h3>Subtraction</h3>
                    <p>Perfect your subtracting skills</p>
                    <button class="start-btn" onclick= selectCategory('${sub}')>Start Quiz</button>
                </div>

                <!--Multiplication-->
                <div class="category-card" data-category="multiplication">
                    <div class="category-icon"><i class="fa-solid fa-xmark"></i></div>
                    <h3>Multiplication</h3>
                    <p>Multiply your way to victory</p>
                    <button class="start-btn" onclick= selectCategory('${mult}')>Start Quiz</button>
                </div>

                <!--Division-->
                <div class="category-card" data-category="division">
                    <div class="category-icon" ><i class="fa-solid fa-divide"></i></div>
                    <h3>Division</h3>
                    <p>Divide and conquer the challenges</p>
                    <button class="start-btn" onclick= selectCategory('${div}')>Start Quiz</button>
                </div>
            </div>

            
        </div>
    `;
}

let selectedCategory = null;

function selectCategory(cat) {
  selectedCategory = cat;
  renderDifficultySelect(document.getElementById("main-content"));
}

function renderDifficultySelect(main) {
  const cat = CATEGORIES[selectedCategory];
  main.innerHTML = `
        <div class="fade-in">
            <h1 class="page-title">${cat.icon} ${cat.name} - Select Difficulty</h1>
            <button class="btn btn-ghost" onclick="navigateTo('quizzes')" style="margin-bottom: 20px;">← Back to Categories</button>
            <div class="difficulty-grid">
                ${DIFFICULTY_LEVELS.map(
                  (dl) => `
                    <div class="difficulty-level" onclick="startQuiz('${selectedCategory}', ${dl.level})">
                        <div class="flip-inner">
                          <div class="flip-front">
                              <div class="difficulty-number">Level ${dl.level}</div>
                          </div>
                          <div class="flip-back">
                              <div class="difficulty-name">${dl.name}</div>
                              <div class="difficulty-info">${dl.questions} questions · ${formatTime(dl.totalTime)} total</div>
                          </div>
                        </div>
                    </div>

                    
                `,
                ).join("")}
            </div>
        </div>
    `;
}

// ===== LEADERBOARD =====
async function renderLeaderboard(main) {
  main.innerHTML =
    '<div class="fade-in"><h1 class="page-title">Leaderboard</h1><p style="color:var(--text-muted)">Loading...</p></div>';

  const res = await apiGetLeaderboard();
  const entries = res.success && res.leaderboard ? res.leaderboard : [];

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const medals = ["🥇", "🥈", "🥉"];

  main.innerHTML = `
        <div class="fade-in">
            <h1 class="page-title">Leaderboard</h1>
            ${
              top3.length > 0
                ? `
                <div class="podium">
                    ${top3
                      .map((e, i) => {
                        const av =
                          AVATARS.find((a) => a.id === e.avatar) || AVATARS[0];
                        return `<div class="podium-item podium-${i + 1}">
                            <div class="podium-rank">${medals[i]}</div>
                            <div class="podium-avatar">${av.emoji}</div>
                            <div class="podium-name">${e.username}</div>
                            <div class="podium-score">${e.total_score} pts</div>
                        </div>`;
                      })
                      .join("")}
                </div>
            `
                : ""
            }
            <div class="card card-flat">
                ${
                  entries.length === 0
                    ? '<div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">No leaderboard data yet. Complete quizzes to appear here!</div></div>'
                    : `
                    <table class="leaderboard-table">
                        <thead><tr><th>#</th><th>Player</th><th>Score</th><th>Quizzes</th><th>Accuracy</th></tr></thead>
                        <tbody>
                            ${entries
                              .map((e, i) => {
                                const av =
                                  AVATARS.find((a) => a.id === e.avatar) ||
                                  AVATARS[0];
                                return `<tr>
                                    <td><span class="rank-badge">${i + 1}</span></td>
                                    <td>${av.emoji} ${e.username}</td>
                                    <td>${e.total_score}</td>
                                    <td>${e.quizzes_completed}</td>
                                    <td>${e.accuracy}%</td>
                                </tr>`;
                              })
                              .join("")}
                        </tbody>
                    </table>
                `
                }
            </div>
        </div>
    `;
}

// ===== ACHIEVEMENTS =====
async function renderAchievements(main) {
  main.innerHTML =
    '<div class="fade-in"><h1 class="page-title">Achievements</h1><p style="color:var(--text-muted)">Loading...</p></div>';

  const res = await apiGetAchievements();
  const unlocked = res.success && res.achievements ? res.achievements : [];
  const unlockedIds = unlocked.map((a) => a.achievement_id);

  const total = DEFAULT_ACHIEVEMENTS.length;
  const done = unlockedIds.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (pct / 100) * circumference;

  main.innerHTML = `
        <div class="fade-in">
            <h1 class="page-title">Achievements</h1>
            <div class="achievements-header">
                <div class="achievements-donut">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" stroke-width="8"/>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" stroke-width="8"
                            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
                    </svg>
                    <div class="achievements-donut-text">${done}/${total}</div>
                </div>
                <div>
                    <h2>${pct}% Complete</h2>
                    <p style="color: var(--text-muted)">${done} of ${total} achievements unlocked</p>
                </div>
            </div>
            <div class="achievements-grid">
                ${DEFAULT_ACHIEVEMENTS.map((a) => {
                  const isUnlocked = unlockedIds.includes(a.id);
                  const uData = unlocked.find((u) => u.achievement_id === a.id);
                  return `<div class="card card-flat achievement-card ${isUnlocked ? "" : "locked"}">
                        <span class="achievement-icon">${a.icon}</span>
                        <div>
                            <div class="achievement-name">${a.name}</div>
                            <div class="achievement-desc">${a.description}</div>
                            ${isUnlocked && uData ? `<div class="achievement-unlocked">Unlocked ${timeAgo(uData.unlocked_at)}</div>` : ""}
                        </div>
                    </div>`;
                }).join("")}
            </div>
        </div>
    `;
}

async function checkAndUnlockAchievements(
  score,
  correct,
  wrong,
  timeTaken,
  totalTime,
  accuracy,
  category,
) {
  // Refresh stats
  const statsRes = await apiGetStats();
  if (statsRes.success) userStats = statsRes.stats;

  const achRes = await apiGetAchievements();
  const unlockedIds =
    achRes.success && achRes.achievements
      ? achRes.achievements.map((a) => a.achievement_id)
      : [];

  for (const a of DEFAULT_ACHIEVEMENTS) {
    if (unlockedIds.includes(a.id)) continue;
    let met = false;
    switch (a.requirementType) {
      case "quizzes_completed":
        met = userStats.quizzesCompleted >= a.requirementValue;
        break;
      case "total_score":
        met = userStats.totalScore >= a.requirementValue;
        break;
      case "current_streak":
        met = userStats.currentStreak >= a.requirementValue;
        break;
      case "perfect_quiz":
        met = accuracy === 100;
        break;
      case "speed_bonus":
        met = timeTaken <= totalTime * 0.5;
        break;
      case "addition_completed":
      case "subtraction_completed":
      case "multiplication_completed":
      case "division_completed":
       
        met = false; 
        break;
    }
    if (met) {
      await apiUnlockAchievement(a.id);
    }
  }
}

// ===== SETTINGS =====
async function renderSettings(main) {
  if (currentUser) {
    const res = await apiGetSettings();
    if (res.success && res.settings) userSettings = res.settings;
  }

  main.innerHTML = `
        <div class="fade-in">
            <h1 class="page-title">Settings</h1>
            ${
              currentUser
                ? `
                <div class="card settings-section">
                    <div class="settings-title">Profile</div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-label">Avatar</div>
                            <div class="settings-sublabel">Choose your profile avatar</div>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="openModal('avatar-modal'); renderAvatarGrid();">Change Avatar</button>
                    </div>
                </div>
                <div class="card settings-section">
                    <div class="settings-title">Preferences</div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-label">Sound Effects</div>
                            <div class="settings-sublabel">Enable sound effects during quizzes</div>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" ${userSettings.sound_enabled ? "checked" : ""} onchange="updateSetting('sound_enabled', this.checked ? 1 : 0)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-label">Light Mode</div>
                        </div>
                        <label class="toggle">
                            <input type="checkbox">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="card settings-section">
                    <div class="settings-title" style="color: var(--danger);">Danger Zone</div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-label">Reset Progress</div>
                            <div class="settings-sublabel">Delete all your stats and achievements</div>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="if(confirm('Are you sure? This cannot be undone!')) resetProgress()">Reset All</button>
                    </div>
                </div>
            `
                : '<div class="card"><div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-text">Please login to access settings</div></div></div>'
            }
        </div>
    `;
}

async function updateSetting(key, value) {
  const data = {};
  data[key] = value;
  userSettings[key] = value;
  await apiUpdateSettings(data);
  renderSettings(document.getElementById("main-content"));
}

async function resetProgress() {
  await apiPost("ResetProgress.php", {});
  userStats = {
    totalScore: 0,
    currentStreak: 0,
    quizzesCompleted: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    accuracy: 0,
  };
  userActivities = [];
  navigateTo("dashboard");
}

// ===== AVATAR =====
function renderAvatarGrid() {
  const grid = document.getElementById("avatar-grid");
  const currentAvatar = currentUser?.avatar || "avatar1";
  grid.innerHTML = AVATARS.map(
    (a) => `
        <div class="avatar-choice ${a.id === currentAvatar ? "selected" : ""}" onclick="selectAvatar('${a.id}')">
            <span class="avatar-choice-emoji">${a.emoji}</span>
            <span class="avatar-choice-label">${a.label}</span>
        </div>
    `,
  ).join("");
}

async function selectAvatar(avatarId) {
  const res = await apiUpdateAvatar(avatarId);
  if (res.success) {
    currentUser.avatar = avatarId;
    renderHeaderRight();
    closeModal("avatar-modal");
  }
}


function timeAgo(ts) {
  const ms = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(ms / 86400000) + "d ago";
}
