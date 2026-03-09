

async function apiPost(endpoint, data) {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    try {
        const res = await fetch(API_BASE + endpoint, { method: 'POST', body: formData, credentials: 'same-origin' });
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return { success: false, message: 'Network error' };
    }
}

async function apiGet(endpoint) {
    try {
        const res = await fetch(API_BASE + endpoint, { credentials: 'same-origin' });
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return { success: false, message: 'Network error' };
    }
}


async function apiLogin(username, password) {
    return apiPost('Login.php', { username, password });
}

async function apiRegister(username, email, password, confirmPass) {
    return apiPost('Register.php', { regUsername: username, email, regPass: password, confirmPass });
}

async function apiLogout() {
    return apiGet('Logout.php');
}

async function apiCheckSession() {
    return apiGet('CheckSession.php');
}


async function apiGetStats() {
    return apiGet('GetStats.php');
}

async function apiUpdateStats(score, correct, wrong, timeTaken, timeLimit) {
    return apiPost('UpdateStats.php', { score, correct, wrong, time_taken: timeTaken, time_limit: timeLimit });
}


async function apiGetActivities() {
    return apiGet('GetActivities.php');
}

async function apiSaveActivity(category, level, score, accuracy, timeTaken, timeLimit) {
    return apiPost('SaveActivity.php', { category, level, score, accuracy, time_taken: timeTaken, time_limit: timeLimit });
}


async function apiGetLeaderboard() {
    return apiGet('GetLeaderboard.php');
}


async function apiGetAchievements() {
    return apiGet('GetAchievements.php');
}

async function apiUnlockAchievement(achievementId) {
    return apiPost('UnlockAchievement.php', { achievement_id: achievementId });
}


async function apiGetSettings() {
    return apiGet('GetSettings.php');
}

async function apiUpdateSettings(settings) {
    return apiPost('UpdateSettings.php', settings);
}


async function apiUpdateAvatar(avatar) {
    return apiPost('UpdateAvatar.php', { avatar });
}

async function checkUsername(username){
    return apiPost('checkUsername.php', {username});
}
