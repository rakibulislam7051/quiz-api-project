/**
 * QuizGemini Application Logic
 * Pure ES6 Javascript
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  let appState = {
    apiKey: '',
    topic: '',
    numQuestions: 5,
    difficulty: 'Easy',
    questions: [],
    currentQuestionIndex: 0,
    selectedOption: null,
    userAnswers: [], // Stores exact string chosen
    loaderInterval: null,
    timerInterval: null,
    timeLeft: 30
  };

  // --- DOM SELECTORS ---
  // Screens
  const screens = {
    apiKey: document.getElementById('screen-api-key'),
    dashboard: document.getElementById('screen-dashboard'),
    loading: document.getElementById('screen-loading'),
    quiz: document.getElementById('screen-quiz'),
    results: document.getElementById('screen-results')
  };

  // Header components
  const headerApiBadge = document.getElementById('header-api-badge');
  const btnChangeKey = document.getElementById('btn-change-key');

  // Screen 1: API Key Selectors
  const apiKeyForm = document.getElementById('api-key-form');
  const apiKeyInput = document.getElementById('api-key-input');
  const btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
  const apiKeyError = document.getElementById('api-key-error');

  // Screen 2: Dashboard Selectors
  const quizTopicInput = document.getElementById('quiz-topic');
  const quizQuestionsSelect = document.getElementById('quiz-questions-count');
  const btnDiffs = document.querySelectorAll('.btn-diff');
  const suggestionTags = document.querySelectorAll('.suggestion-tag');
  const btnGenerateQuiz = document.getElementById('btn-generate-quiz');
  const dashboardError = document.getElementById('dashboard-error');
  const dashboardErrorText = document.getElementById('dashboard-error-text');

  // Screen 3: Loader Selectors
  const loaderStatusText = document.getElementById('loader-status');

  // Screen 4: Quiz Playing Selectors
  const quizBadgeTopic = document.getElementById('quiz-badge-topic');
  const quizBadgeDifficulty = document.getElementById('quiz-badge-difficulty');
  const quizQuestionIndexLabel = document.getElementById('quiz-question-index-label');
  const quizProgressPercentage = document.getElementById('quiz-progress-percentage');
  const quizProgressFill = document.getElementById('quiz-progress-fill');
  const quizTimerBox = document.getElementById('quiz-timer-box');
  const quizTimerText = document.getElementById('quiz-timer-text');
  const quizTimerFill = document.getElementById('quiz-timer-fill');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsContainer = document.getElementById('quiz-options-container');
  const btnNextQuestion = document.getElementById('btn-next-question');

  // Screen 5: Results Selectors
  const scoreRingIndicator = document.getElementById('score-ring-indicator');
  const scoreTextCorrect = document.getElementById('score-text-correct');
  const scoreTextTotal = document.getElementById('score-text-total');
  const scoreVerdictText = document.getElementById('score-verdict');
  const scorePercentageText = document.getElementById('score-percentage-text');
  const correctionListContainer = document.getElementById('correction-list');
  const btnRestartQuiz = document.getElementById('btn-restart-quiz');

  // --- INITIALIZATION ---
  function init() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      appState.apiKey = savedKey;
      showScreen('dashboard');
    } else {
      showScreen('apiKey');
    }
  }

  // --- SCREEN ROUTER / STATE TRANSITION ---
  function showScreen(screenKey) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
      screen.classList.add('hidden');
    });

    // Show selected screen
    if (screens[screenKey]) {
      screens[screenKey].classList.remove('hidden');
    }

    // Toggle header badge visibility based on screen and API key status
    if (appState.apiKey && screenKey !== 'apiKey') {
      headerApiBadge.classList.remove('hidden');
    } else {
      headerApiBadge.classList.add('hidden');
    }
  }

  // --- SCREEN 1: API KEY LOGIC ---
  // Toggle password input visibility
  btnToggleKeyVisibility.addEventListener('click', () => {
    const currentType = apiKeyInput.getAttribute('type');
    const eyeIcon = btnToggleKeyVisibility.querySelector('.eye-icon');
    
    if (currentType === 'password') {
      apiKeyInput.setAttribute('type', 'text');
      // Switch icon to slashed or outline (we reuse inline visual tags simply)
      btnToggleKeyVisibility.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
          <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
          <line x1="2" x2="22" y1="2" y2="22"/>
        </svg>
      `;
    } else {
      apiKeyInput.setAttribute('type', 'password');
      btnToggleKeyVisibility.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
    }
  });

  // Save API Key
  apiKeyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const keyVal = apiKeyInput.value.trim();

    if (!keyVal) {
      apiKeyError.classList.remove('hidden');
      return;
    }

    apiKeyError.classList.add('hidden');
    appState.apiKey = keyVal;
    localStorage.setItem('gemini_api_key', keyVal);
    
    // Clear input
    apiKeyInput.value = '';
    
    showScreen('dashboard');
  });

  // Clear / Change API Key
  btnChangeKey.addEventListener('click', () => {
    stopTimer();
    localStorage.removeItem('gemini_api_key');
    appState.apiKey = '';
    showScreen('apiKey');
  });

  // --- SCREEN 2: DASHBOARD LOGIC ---
  // Topic suggestion clicks
  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      quizTopicInput.value = tag.textContent;
      dashboardError.classList.add('hidden');
    });
  });

  // Difficulty selection clicks
  btnDiffs.forEach(btn => {
    btn.addEventListener('click', () => {
      btnDiffs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.difficulty = btn.getAttribute('data-difficulty');
    });
  });

  // Click handler to Generate Quiz
  btnGenerateQuiz.addEventListener('click', async () => {
    const topic = quizTopicInput.value.trim();
    const count = parseInt(quizQuestionsSelect.value, 10);

    if (!topic) {
      dashboardErrorText.textContent = "Please enter a quiz topic.";
      dashboardError.classList.remove('hidden');
      return;
    }

    dashboardError.classList.add('hidden');
    appState.topic = topic;
    appState.numQuestions = count;

    // Start generating process
    await fetchQuizFromGemini();
  });

  // --- SCREEN 3: LOADER DYNAMICS ---
  function startLoaderAnimation() {
    const loaderQuotes = [
      "Consulting the Gemini knowledge base...",
      "Formulating challenging questions...",
      "Weaving multiple choice options...",
      "Double-checking technical correctness...",
      "Polishing the quiz layout..."
    ];
    let quoteIndex = 0;
    
    loaderStatusText.textContent = loaderQuotes[0];
    
    appState.loaderInterval = setInterval(() => {
      quoteIndex = (quoteIndex + 1) % loaderQuotes.length;
      loaderStatusText.textContent = loaderQuotes[quoteIndex];
    }, 2000);
  }

  function stopLoaderAnimation() {
    if (appState.loaderInterval) {
      clearInterval(appState.loaderInterval);
      appState.loaderInterval = null;
    }
  }

  // --- GEMINI API fetch CALL ---
  async function fetchQuizFromGemini() {
    showScreen('loading');
    startLoaderAnimation();

    const promptText = `Generate a high-quality, highly engaging multiple-choice quiz about "${appState.topic}".
Difficulty level: ${appState.difficulty}
Number of questions: ${appState.numQuestions}

Guidelines for questions:
1. Provide exactly ${appState.numQuestions} diverse and challenging multiple-choice questions.
2. Every question must have exactly 4 distinct and plausible options.
3. The "correctAnswer" field must exactly match one of the items present inside the "options" array.
4. Keep the subject depth appropriate for a ${appState.difficulty} level audience.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${appState.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                questions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      question: { type: "STRING" },
                      options: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      correctAnswer: { type: "STRING" }
                    },
                    required: ["question", "options", "correctAnswer"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = `Request failed: ${response.status} ${response.statusText}`;
        if (errorData.error && errorData.error.message) {
          errMsg = errorData.error.message;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
        throw new Error("No response candidates returned. Your API key might be invalid, or the request was blocked.");
      }

      const responseText = data.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(responseText);

      if (!parsedData.questions || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
        throw new Error("The AI response didn't return any structured questions. Please try again.");
      }

      // Quiz structure successfully acquired
      appState.questions = parsedData.questions;
      appState.currentQuestionIndex = 0;
      appState.userAnswers = [];
      
      stopLoaderAnimation();
      startQuiz();

    } catch (error) {
      console.error(error);
      stopLoaderAnimation();
      
      // Route back to dashboard and output beautiful feedback
      showScreen('dashboard');
      
      let friendlyMessage = error.message;
      if (error.message.includes('API key not valid')) {
        friendlyMessage = "Invalid Gemini API Key. Click 'Change Key' at the top to update your credentials.";
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        friendlyMessage = "Network error. Please check your internet connection and try again.";
      }
      
      dashboardErrorText.textContent = friendlyMessage;
      dashboardError.classList.remove('hidden');
    }
  }

  // --- SCREEN 4: QUIZ ENGINE LOGIC ---
  function startQuiz() {
    // Populate header stats
    quizBadgeTopic.textContent = appState.topic;
    quizBadgeDifficulty.textContent = appState.difficulty;
    
    // Select styling class for difficulty badge
    quizBadgeDifficulty.className = 'tag-badge text-capitalize';
    if (appState.difficulty === 'Easy') {
      quizBadgeDifficulty.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else if (appState.difficulty === 'Medium') {
      quizBadgeDifficulty.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    } else {
      quizBadgeDifficulty.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    }

    loadQuestion();
    showScreen('quiz');
  }

  function loadQuestion() {
    // Reset timer state first before displaying next question
    stopTimer();

    const totalQ = appState.questions.length;
    const currentQ = appState.questions[appState.currentQuestionIndex];
    
    // Reset selected element tracking
    appState.selectedOption = null;

    // Update Progress bar details
    const percentage = Math.round(((appState.currentQuestionIndex) / totalQ) * 100);
    quizQuestionIndexLabel.textContent = `Question ${appState.currentQuestionIndex + 1} of ${totalQ}`;
    quizProgressPercentage.textContent = `${percentage}%`;
    quizProgressFill.style.width = `${percentage}%`;

    // Populate question text
    quizQuestionText.textContent = currentQ.question;

    // Reset and render option grids
    quizOptionsContainer.innerHTML = '';
    
    // Generate Option items
    const letters = ['A', 'B', 'C', 'D'];
    currentQ.options.forEach((optText, idx) => {
      const optLetter = letters[idx] || '•';
      
      const optBtn = document.createElement('button');
      optBtn.className = 'option-btn';
      optBtn.innerHTML = `
        <span class="option-letter">${optLetter}</span>
        <span class="option-content"></span>
      `;
      
      // Prevent XSS while setting text content
      optBtn.querySelector('.option-content').textContent = optText;

      // Click select event
      optBtn.addEventListener('click', () => selectOption(optBtn, optText));
      
      quizOptionsContainer.appendChild(optBtn);
    });

    // Disable Next Button initially
    btnNextQuestion.disabled = true;
    
    // Label updates (Next vs Finish)
    if (appState.currentQuestionIndex === totalQ - 1) {
      btnNextQuestion.querySelector('span').textContent = 'Finish Quiz';
    } else {
      btnNextQuestion.querySelector('span').textContent = 'Next Question';
    }

    // Start 30s Countdown timer for the loaded question
    startTimer();
  }

  // --- COUNTDOWN TIMER LOGIC ---
  function startTimer() {
    stopTimer();
    appState.timeLeft = 30;
    
    // Reset visuals instantly without transition delay
    quizTimerBox.classList.remove('warning');
    quizTimerFill.style.transition = 'none';
    quizTimerFill.style.width = '100%';
    quizTimerText.textContent = '30s';
    
    // Force a paint/reflow to apply the transition bypass instantly
    void quizTimerFill.offsetWidth;
    
    // Re-enable smooth transition for tick decreases
    quizTimerFill.style.transition = 'width 1s linear, background var(--transition-fast)';

    appState.timerInterval = setInterval(() => {
      appState.timeLeft--;
      
      // Update text display
      quizTimerText.textContent = `${appState.timeLeft}s`;
      
      // Shrink fill bar
      const fillPercentage = (appState.timeLeft / 30) * 100;
      quizTimerFill.style.width = `${fillPercentage}%`;
      
      // Add red pulse/glow at 10s or less
      if (appState.timeLeft <= 10) {
        quizTimerBox.classList.add('warning');
      } else {
        quizTimerBox.classList.remove('warning');
      }
      
      // Automatically advance at 0s
      if (appState.timeLeft <= 0) {
        handleTimerEnd();
      }
    }, 1000);
  }

  function stopTimer() {
    if (appState.timerInterval) {
      clearInterval(appState.timerInterval);
      appState.timerInterval = null;
    }
  }

  function handleTimerEnd() {
    stopTimer();
    
    // Auto-advance logic: if a user selected something, use it; otherwise push "Unanswered"
    const finalAnswer = appState.selectedOption !== null ? appState.selectedOption : "Unanswered";
    appState.userAnswers.push(finalAnswer);
    
    const totalQ = appState.questions.length;
    if (appState.currentQuestionIndex < totalQ - 1) {
      appState.currentQuestionIndex++;
      loadQuestion();
    } else {
      finishQuiz();
    }
  }

  function selectOption(btnElement, textVal) {
    // Remove selected state from all button elements
    const allBtns = quizOptionsContainer.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.classList.remove('selected'));

    // Highlight clicked element
    btnElement.classList.add('selected');

    // Store state
    appState.selectedOption = textVal;

    // Enable next action
    btnNextQuestion.disabled = false;
  }

  // Next / Submit Button event
  btnNextQuestion.addEventListener('click', () => {
    if (appState.selectedOption === null) return;

    // Stop timer before advancing
    stopTimer();

    // Save answer
    appState.userAnswers.push(appState.selectedOption);

    // Navigate or complete
    if (appState.currentQuestionIndex < appState.questions.length - 1) {
      appState.currentQuestionIndex++;
      loadQuestion();
    } else {
      finishQuiz();
    }
  });

  // --- SCREEN 5: RESULTS SCREEN LOGIC ---
  function finishQuiz() {
    // Ensure timer is completely deactivated
    stopTimer();

    const totalQ = appState.questions.length;
    let score = 0;

    // Calculate score count
    appState.questions.forEach((q, idx) => {
      const userAns = appState.userAnswers[idx];
      // exact case match comparison
      if (userAns === q.correctAnswer) {
        score++;
      }
    });

    // Show Results
    showScreen('results');

    // Load static values
    scoreTextCorrect.textContent = score;
    scoreTextTotal.textContent = totalQ;

    // Feedbacks & verdicts
    const accuracy = Math.round((score / totalQ) * 100);
    scorePercentageText.textContent = `You answered ${accuracy}% of the questions correctly.`;

    let verdict = "Keep practicing!";
    if (accuracy === 100) {
      verdict = "Perfect score! Outstanding!";
    } else if (accuracy >= 80) {
      verdict = "Excellent job! Well done!";
    } else if (accuracy >= 50) {
      verdict = "Good effort! Practice makes perfect.";
    }
    scoreVerdictText.textContent = verdict;

    // Dynamic Ring sweep animation
    const circleCircumference = 439.8; // 2 * pi * r (70)
    const strokeOffset = circleCircumference - (score / totalQ) * circleCircumference;
    
    // Set immediate reset to start animation fresh
    scoreRingIndicator.style.strokeDashoffset = circleCircumference;
    
    setTimeout(() => {
      scoreRingIndicator.style.strokeDashoffset = strokeOffset;
    }, 150);

    // Build breakdown correction list
    correctionListContainer.innerHTML = '';
    
    appState.questions.forEach((q, idx) => {
      const userAns = appState.userAnswers[idx];
      const isCorrect = userAns === q.correctAnswer;
      
      const correctionCard = document.createElement('div');
      correctionCard.className = `correction-card ${isCorrect ? 'status-correct' : 'status-incorrect'}`;
      
      // Inline SVGs for checkmark and cross marks
      const badgeIcon = isCorrect 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="status-badge-icon correct"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="status-badge-icon incorrect"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`;
      
      correctionCard.innerHTML = `
        <div class="correction-q-header">
          ${badgeIcon}
          <span class="correction-question"></span>
        </div>
        <div class="correction-answers">
          <div class="correction-row">
            <span class="row-label">Your Selection</span>
            <span class="row-val selected-val"></span>
          </div>
          ${!isCorrect ? `
          <div class="correction-row">
            <span class="row-label">Correct Answer</span>
            <span class="row-val correct"></span>
          </div>
          ` : ''}
        </div>
      `;

      // Safe text insertions
      correctionCard.querySelector('.correction-question').textContent = `Question ${idx + 1}: ${q.question}`;
      
      const selectedValNode = correctionCard.querySelector('.selected-val');
      selectedValNode.textContent = userAns;
      selectedValNode.classList.add(isCorrect ? 'correct' : 'incorrect');

      if (!isCorrect) {
        correctionCard.querySelector('.row-val.correct').textContent = q.correctAnswer;
      }

      correctionListContainer.appendChild(correctionCard);
    });

    // Animate list items entering sequential
    const cards = correctionListContainer.querySelectorAll('.correction-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      card.style.transition = `all 0.3s ease ${i * 0.1}s`;
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50);
    });
  }

  // Restart Quiz Event Handler
  btnRestartQuiz.addEventListener('click', () => {
    // Deactivate running intervals
    stopTimer();

    // Revert state variables to settings, keeping API active
    appState.questions = [];
    appState.currentQuestionIndex = 0;
    appState.userAnswers = [];
    appState.selectedOption = null;

    showScreen('dashboard');
  });

  // Call initial loader check
  init();
});
