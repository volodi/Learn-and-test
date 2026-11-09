const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxt9Jhs3dFk0N-oH2Q2LMOgXBsEQJrwZrCkIHYWT79hniNp6nHbxssX_OzC7SqIkMPW/exec";
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let studentData = {};
let selectedAnswerIndex = null;
let isTestFinished = false; 

const loginScreen = document.getElementById('login-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const questionTracker = document.getElementById('question-tracker');
const startBtn = document.getElementById('start-btn');

async function loadQuestionsData() {
    try {
        const response = await fetch('questions/questions.json');
        if (!response.ok) throw new Error('Помилка завантаження');
        
        questions = await response.json();
        
        startBtn.disabled = false;
        startBtn.innerText = "Почати тест";
    } catch (error) {
        console.error("Помилка:", error);
        startBtn.innerText = "Помилка завантаження тестів";
    }
}

window.onload = loadQuestionsData;

function startTest() {
    const name = document.getElementById('student-name').value.trim();
    const studentClass = document.getElementById('student-class').value.trim();

    if (!name || !studentClass) {
        alert("Будь ласка, введіть своє ПІБ та клас.");
        return;
    }

    studentData = { name, class: studentClass };
    loginScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    }

    // ОНОВЛЕНИЙ АНТИЧИТ: додано window.blur
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageClose);
    window.addEventListener("blur", handleWindowBlur); // Ловить клік поза сайтом (бічна панель)

    loadQuestion();
}

// 1. Якщо згорнув вкладку
function handleVisibilityChange() {
    if (document.hidden && !isTestFinished && !quizScreen.classList.contains('hidden')) {
        alert("Порушення правил! Ви згорнули вкладку. Тест завершено достроково.");
        showResults("Порушення (згорнув вкладку)");
    }
}

// 2. Якщо клікнув у бічну панель (Gemini/ChatGPT), інше вікно або адресний рядок
function handleWindowBlur() {
    if (!isTestFinished && !quizScreen.classList.contains('hidden')) {
        alert("Порушення правил! Ви клікнули поза межами сторінки тесту. Тест завершено достроково.");
        showResults("Порушення (клік поза екраном)");
    }
}

function handleBeforeUnload(e) {
    if (!isTestFinished && !quizScreen.classList.contains('hidden')) {
        e.preventDefault();
        e.returnValue = "Ви впевнені? Тест буде перервано!";
    }
}

function handlePageClose() {
    if (!isTestFinished && !quizScreen.classList.contains('hidden')) {
        isTestFinished = true;
        sendDataToSheet(`${score} (Закрив сайт на ${currentQuestionIndex + 1} питанні)`);
    }
}

function loadQuestion() {
    nextBtn.classList.add('hidden');
    optionsContainer.innerHTML = '';
    selectedAnswerIndex = null;
    
    const currentQ = questions[currentQuestionIndex];
    questionText.innerText = currentQ.question;
    questionTracker.innerText = `Питання ${currentQuestionIndex + 1} з ${questions.length}`;

    currentQ.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.className = "w-full text-left p-4 border border-gray-200 rounded hover:bg-gray-100 transition focus:outline-none";
        btn.onclick = () => selectOption(btn, index);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(selectedBtn, selectedIndex) {
    const buttons = optionsContainer.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.classList.remove('bg-blue-100', 'border-blue-500', 'border-2');
        btn.classList.add('border-gray-200');
    });

    selectedBtn.classList.remove('border-gray-200');
    selectedBtn.classList.add('bg-blue-100', 'border-blue-500', 'border-2');
    
    selectedAnswerIndex = selectedIndex;
    nextBtn.classList.remove('hidden');
}

function nextQuestion() {
    const currentQ = questions[currentQuestionIndex];
    if (selectedAnswerIndex === currentQ.correct) {
        score++;
    }

    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showResults("Завершено");
    }
}

function sendDataToSheet(finalScoreText) {
    fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: studentData.name,
            class: studentData.class,
            score: finalScoreText,
            total: questions.length
        })
    }).catch(err => console.error("Помилка відправки", err));
}

function showResults(reason) {
    isTestFinished = true;

    // Вимикаємо всі слухачі
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("pagehide", handlePageClose);
    window.removeEventListener("blur", handleWindowBlur);
    
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
    }

    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    document.getElementById('student-result-info').innerText = `${studentData.name} (${studentData.class} клас)`;
    const scoreElement = document.getElementById('score');

    if (reason === "Завершено") {
        scoreElement.innerText = `${score} / ${questions.length}`;
        sendDataToSheet(score);
        
        const successMsg = document.createElement('p');
        successMsg.className = "text-green-600 font-semibold mt-4";
        successMsg.innerText = "✓ Результат успішно збережено!";
        resultScreen.appendChild(successMsg);
    } else {
        scoreElement.innerText = `${score} / ${questions.length} (Достроково)`;
        scoreElement.classList.remove('text-blue-600');
        scoreElement.classList.add('text-red-600');
        
        const errorMsg = document.createElement('p');
        errorMsg.className = "text-red-600 font-semibold mt-4";
        errorMsg.innerText = "✗ Тест було перервано через порушення. Звіт відправлено.";
        resultScreen.appendChild(errorMsg);
        
        sendDataToSheet(`${score} (${reason})`);
    }
}