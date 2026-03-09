

let quizState = {
  category: null,
  level: null,
  questions: [],
  currentQuestion: 0,
  score: 0,
  correct: 0,
  wrong: 0,
  timeLeft: 0,
  totalTime: 0,
  startTime: 0,
  timerId: null,
  answered: false,
  finished: false,
  ispaused: false,
};

function generateQuestion(category, min, max) {
  let num1, num2, answer, operator, question;
  num1 = Math.floor(Math.random() * (max - min + 1)) + min;
  num2 = Math.floor(Math.random() * (max - min + 1)) + min;

  switch (category) {
    case "addition":
      operator = "+";
      answer = num1 + num2;
      break;
    case "subtraction":
      if (num1 < num2) [num1, num2] = [num2, num1];
      operator = "-";
      answer = num1 - num2;
      break;
    case "multiplication":
      num1 = Math.floor(Math.random() * (Math.min(max, 30) - min + 1)) + min;
      num2 = Math.floor(Math.random() * (Math.min(max, 30) - min + 1)) + min;
      operator = "×";
      answer = num1 * num2;
      break;
    case "division":
      num2 = Math.max(1, Math.floor(Math.random() * Math.min(max, 20)) + 1);
      answer = Math.floor(Math.random() * (max - min + 1)) + min;
      num1 = num2 * answer;
      operator = "÷";
      break;
  }

  question = `${num1} ${operator} ${num2}`;
  return { num1, num2, operator, answer, question };
}

function startQuiz(category, levelNum) {
  const dl = DIFFICULTY_LEVELS[levelNum - 1];
  const [min, max] = dl.range;

  quizState = {
    category,
    level: levelNum,
    questions: [],
    currentQuestion: 0,
    score: 0,
    correct: 0,
    wrong: 0,
    timeLeft: dl.totalTime,
    totalTime: dl.totalTime,
    startTime: Date.now(),
    timerId: null,
    answered: false,
    finished: false,
    ispaused: false
  };

  for (let i = 0; i < dl.questions; i++) {
    quizState.questions.push(generateQuestion(category, min, max));
  }

  renderQuizGame();
  startTimer();
}

function startTimer() {
  if(quizState.finished) return;


  if (quizState.timerId) clearInterval(quizState.timerId);

  quizState.timerId = setInterval(() => {
    if (quizState.ispaused) return;
    quizState.timeLeft--;
    updateTimerDisplay();
    if (quizState.timeLeft <= 0) {
      clearInterval(quizState.timerId);
      finishQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById("quiz-timer");
  if (!el) return;
  const mins = Math.floor(quizState.timeLeft / 60);
  const secs = quizState.timeLeft % 60;
  el.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
  el.className = "quiz-timer";
  if (quizState.timeLeft <= 10) el.classList.add("danger");
  else if (quizState.timeLeft <= 30) el.classList.add("warning");
}

function submitAnswer(selectedValue) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.currentQuestion];
  const buttons = document.querySelectorAll(".choiceBtn");

  buttons.forEach((btn) => {
    const value = parseInt(btn.textContent);
    btn.disabled = true;

    if (value === q.answer) {
      btn.classList.add("correct");
    } else if (value === selectedValue) {
      btn.classList.add("wrong");
    }
  });

  if (selectedValue === q.answer) {
    quizState.correct++;
    quizState.score += 10;
  } else {
    quizState.wrong++;
  }

  setTimeout(() => {
    quizState.currentQuestion++;
    quizState.answered = false;

    if (quizState.currentQuestion >= quizState.questions.length) {
      finishQuiz();
    } else {
      renderQuizQuestion();
    }
  }, 250);
}

function finishQuiz() {

  if (quizState.finished) return;
  quizState.finished = true;

  if (quizState.timerId) clearInterval(quizState.timerId);
  const timeTaken = Math.round((Date.now() - quizState.startTime) / 1000);
  const timeRemaining = Math.max(0, quizState.totalTime - timeTaken);


  const timeBonus = Math.round((timeRemaining / quizState.totalTime) * 50);
  quizState.score += timeBonus;

  const accuracy =
    quizState.correct + quizState.wrong > 0
      ? Math.round(
          (quizState.correct / (quizState.correct + quizState.wrong)) * 100,
        )
      : 0;


  if (currentUser) {
    apiUpdateStats(
      quizState.score,
      quizState.correct,
      quizState.wrong,
      timeTaken,
      quizState.totalTime,
    );
    apiSaveActivity(
      quizState.category,
      quizState.level,
      quizState.score,
      accuracy,
      timeTaken,
      quizState.totalTime,
    );
    checkAndUnlockAchievements(
      quizState.score,
      quizState.correct,
      quizState.wrong,
      timeTaken,
      quizState.totalTime,
      accuracy,
      quizState.category,
    );
  }

  renderQuizResults(
    quizState.score,
    quizState.correct,
    quizState.wrong,
    timeTaken,
    quizState.totalTime,
    timeBonus,
    accuracy,
  );
}

function quitQuiz() {
  if (quizState.timerId) {
        clearInterval(quizState.timerId);
        quizState.timerId = null;
    }


    quizState.answered = false;
    quizState.finished = false;


    navigateTo("quizzes");
}



function renderQuizGame() {
  const main = document.getElementById("main-content");
  const dl = DIFFICULTY_LEVELS[quizState.level - 1];
  main.innerHTML = `
        <div class="quiz-container fade-in">
            <div class="quiz-header">
                <div>
                    <span class="quiz-category-label">${CATEGORIES[quizState.category].name}</span>
                    <span class="quiz-level-label" id="quizLevelLabel"> level ${quizState.level} - ${dl.name}</span>
                </div>
                <div id="quiz-timer" class="quiz-timer">${formatTime(quizState.timeLeft)}</div>
                <div class="quiz-score-display">Score: <span id="quiz-score">${quizState.score}</span></div>
            </div>
            <div class="quiz-progress-bar">
                <div id="quiz-progress-fill" class="quiz-progress-fill" style="width: 0%"></div>
            </div>
            <div id="quiz-question-area"></div>
            <div class="quiz-actions">                
                <button id="quitBtn" class="quitBtn onclick="quitQuiz()"><i class="fa-solid fa-xmark"></i> Quit  Quiz</button>               
            </div>
        </div>

         <!-- Quit confirmation modal -->
        <div id="quitModal" class="modal">
          <div class="modal-content">
            <h3>Are you sure you want to quit the quiz?</h3>
            <div class="modal-actions">
              <button id="confirmQuit" class="confirm-btn">Yes, Quit</button>
              <button id="cancelQuit" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
    `;

  const quitBtn = document.getElementById("quitBtn");
  const quitModal = document.getElementById("quitModal");
  const confirmQuit = document.getElementById("confirmQuit");
  const cancelQuit = document.getElementById("cancelQuit");

  // Show modal when quit button clicked
  quitBtn.addEventListener("click", () => {
    quizState.ispaused = true;
    quitModal.style.display = "flex";
    
  });

  // Confirm quitting
  confirmQuit.addEventListener("click", () => {
    quitModal.style.display = "none";
    quitQuiz();
  });

  // Cancel quitting
  cancelQuit.addEventListener("click", () => {
    quizState.ispaused = false;
    quitModal.style.display = "none";
    
  });

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const area = document.getElementById("quiz-question-area");
  const q = quizState.questions[quizState.currentQuestion];
  const total = quizState.questions.length;

  const progressFill = document.getElementById("quiz-progress-fill");
  if (!progressFill) return;   // stop if quiz UI is gone

  const progress = (quizState.currentQuestion / total) * 100;
  document.getElementById("quiz-progress-fill").style.width = progress + "%";
  document.getElementById("quiz-score").textContent = quizState.score;

  const choices = generateChoices(q.answer);

  area.innerHTML = `
    <p class="quiz-question-label">
      Question ${quizState.currentQuestion + 1} of ${total}
    </p>
    <div class="quiz-question">${q.question} = ?</div>
    <div class="quiz-choices">
      ${choices
        .map(
          (choice) => `
            <button 
              class="choiceBtn" 
              onclick="submitAnswer(${choice})"
              style="margin:8px; min-width:120px;">
              ${choice}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function generateChoices(correctAnswer) {
  const choices = new Set();
  choices.add(correctAnswer);

  while (choices.size < 4) {

    let offset = Math.floor(Math.random() * 10) + 1;

    let wrong = Math.random() < 0.5 ? correctAnswer + offset : correctAnswer - offset;


    if (wrong > 0 && wrong !== correctAnswer) {
      choices.add(wrong);
    }
  }

  return shuffleArray([...choices]);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderQuizResults(
  score,
  correct,
  wrong,
  timeTaken,
  totalTime,
  timeBonus,
  accuracy,
) {
  const main = document.getElementById("main-content");
  main.innerHTML = `
        <div class="results-container fade-in">
            <h1 class="page-title">Quiz Complete!</h1>
            <div class="results-score">${score}</div>
            <p style="color: var(--text-muted); margin-bottom: 24px;">points earned (includes ${timeBonus} speed bonus)</p>
            <div class="results-grid">
                <div class="card card-flat results-stat">
                    <div class="results-stat-label">Correct</div>
                    <div class="results-stat-value" style="color: var(--success);">${correct}</div>
                </div>
                <div class="card card-flat results-stat">
                    <div class="results-stat-label">Wrong</div>
                    <div class="results-stat-value" style="color: var(--danger);">${wrong}</div>
                </div>
                <div class="card card-flat results-stat">
                    <div class="results-stat-label">Accuracy</div>
                    <div class="results-stat-value">${accuracy}%</div>
                </div>
                <div class="card card-flat results-stat">
                    <div class="results-stat-label">Time</div>
                    <div class="results-stat-value">${timeTaken}s</div>
                </div>
            </div>
            <div class="results-actions">
                <button class="btn btn-primary btn-lg" onclick="startQuiz('${quizState.category}', ${quizState.level})">Play Again</button>
                <button class="btn btn-outline btn-lg" onclick="navigateTo('quizzes')">Back to Quizzes</button>
            </div>
        </div>
    `;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
