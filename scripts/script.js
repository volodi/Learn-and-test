// Firebase Config (розкоментувати і заповнити за потреби)
/*
const firebaseConfig = {
    apiKey: "ВАШ_API_KEY",
    authDomain: "ВАШ_ПРОЕКТ.firebaseapp.com",
    projectId: "ВАШ_ПРОЕКТ",
    storageBucket: "ВАШ_ПРОЕКТ.appspot.com",
    messagingSenderId: "ВАШ_ID",
    appId: "ВАШ_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
*/

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let studentData = {};

// Отримуємо елементи DOM
const loginScreen = document.getElementById('login-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const questionTracker = document.getElementById('question-tracker');
const startBtn = document.getElementById('start-btn');

// Асинхронне завантаження питань з JSON
async function loadQuestionsData() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error('Помилка завантаження');
        
        questions = await response.json();
        
        // Активуємо кнопку старту після успішного завантаження
        startBtn.disabled = false;
        startBtn.innerText = "Почати тест";
    } catch (error) {
        console.error("Помилка:", error);
        startBtn.innerText = "Помилка завантаження тестів";
        alert("Не вдалося знайти файл questions.json. Переконайтесь, що він лежить у тій самій папці.");
    }
}

// Викликаємо функцію при старті сторінки
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
    loadQuestion();
}

function loadQuestion() {
    nextBtn.classList.add('hidden');
    optionsContainer.innerHTML = '';
    
    const currentQ = questions[currentQuestionIndex];
    questionText.innerText = currentQ.question;
    questionTracker.innerText = `Питання ${currentQuestionIndex + 1} з ${questions.length}`;

    currentQ.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.className = "w-full text-left p-4 border border-gray-200 rounded hover:bg-blue-50 transition focus:outline-none";
        btn.onclick = () => selectOption(btn, index, currentQ.correct);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(selectedBtn, selectedIndex, correctIndex) {
    const buttons = optionsContainer.querySelectorAll('button');
    // Блокуємо всі кнопки після вибору
    buttons.forEach(btn => btn.disabled = true); 

    if (selectedIndex === correctIndex) {
        selectedBtn.classList.add('bg-green-100', 'border-green-500');
        score++;
    } else {
        selectedBtn.classList.add('bg-red-100', 'border-red-500');
        // Підсвічуємо правильну відповідь, якщо учень помилився
        buttons[correctIndex].classList.add('bg-green-100', 'border-green-500');
    }

    // Показуємо кнопку переходу до наступного питання
    nextBtn.classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    document.getElementById('student-result-info').innerText = `${studentData.name} (${studentData.class} клас)`;
    document.getElementById('score').innerText = `${score} / ${questions.length}`;

    // Запис у Firebase (якщо налаштовано)
    /*
    if (typeof db !== 'undefined') {
        db.collection("student_results").add({
            name: studentData.name,
            class: studentData.class,
            score: score,
            total: questions.length,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log("Результат збережено!");
        }).catch((error) => {
            console.error("Помилка збереження: ", error);
        });
    }
    */
}