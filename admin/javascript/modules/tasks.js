// ============================================
// TASKS MANAGEMENT MODULE
// ============================================
// Handles all task-related operations including CRUD, quiz questions, and task type handlers

import { showAlert, showFormAlert, clearFormAlerts, showTableLoading, confirmAction } from './utils.js';

// Global state
let currentTasks = [];
let currentEditingTaskId = null;

/**
 * Load and display tasks
 */
export async function loadTasks() {
    console.log('Tasks.loadTasks() called');
    try {
        console.log('Showing table loading...');
        showTableLoading('tasksTableBody');
        
        const response = await fetch('api/tasks.php', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            currentTasks = data.data || [];
            displayTasks(currentTasks);
        } else {
            showAlert(data.message || 'Failed to load tasks', 'error');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showAlert('Failed to load tasks', 'error');
    }
}

/**
 * Display tasks in table
 */
export function displayTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;

    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">No tasks found</td></tr>';
        return;
    }

    tbody.innerHTML = tasks.map(task => `
        <tr>
            <td>${task.id}</td>
            <td>${task.attraction_name || 'N/A'}</td>
            <td>${task.name}</td>
            <td>
                <span class="badge badge-${getTaskTypeBadgeColor(task.type)}">
                    ${formatTaskType(task.type)}
                </span>
            </td>
            <td>${task.points || 0} pts</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="Tasks.editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="Tasks.deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Apply task filters
 */
export function applyTaskFilters() {
    const attractionFilter = document.getElementById('taskAttractionFilter')?.value || '';
    const typeFilter = document.getElementById('taskTypeFilter')?.value || '';
    const searchQuery = document.getElementById('taskSearch')?.value.toLowerCase() || '';

    let filtered = currentTasks;

    if (attractionFilter) {
        filtered = filtered.filter(task => task.attraction_id == attractionFilter);
    }

    if (typeFilter) {
        filtered = filtered.filter(task => task.type === typeFilter);
    }

    if (searchQuery) {
        filtered = filtered.filter(task => 
            task.name.toLowerCase().includes(searchQuery) ||
            task.description?.toLowerCase().includes(searchQuery)
        );
    }

    displayTasks(filtered);
}

/**
 * Clear task filters
 */
export function clearTaskFilters() {
    document.getElementById('taskAttractionFilter').value = '';
    document.getElementById('taskTypeFilter').value = '';
    document.getElementById('taskSearch').value = '';
    displayTasks(currentTasks);
}

/**
 * Open task modal for create/edit
 */
export async function openTaskModal(id = null) {
    currentEditingTaskId = id;
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const title = document.getElementById('taskModalTitle');

    if (!modal || !form) return;

    form.reset();
    clearFormAlerts(form);

    if (id) {
        title.textContent = 'Edit Task';
        await loadTaskData(id);
    } else {
        title.textContent = 'Add New Task';
        // Hide all task-specific sections
        hideAllTaskTypeSections();
    }

    modal.style.display = 'flex';
}

/**
 * Load task data for editing
 */
async function loadTaskData(id) {
    try {
        const response = await fetch(`api/tasks.php?id=${id}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            const task = data.data;
            
            // Fill basic fields
            document.getElementById('taskAttraction').value = task.attraction_id;
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskType').value = task.type;
            document.getElementById('taskPoints').value = task.points || 0;
            document.getElementById('taskGuide').value = task.guide || '';
            
            // Trigger type change to show relevant section
            handleTaskTypeChange();
            
            // Load type-specific data
            if ((task.type === 'quiz' || task.type === 'riddle' || task.type === 'observation_match') && task.questions) {
                loadQuizQuestions(task.questions);
            } else if (task.type === 'count_confirm' && task.task_config) {
                loadCountConfirmData(task.task_config);
            } else if (task.type === 'direction' && task.questions) {
                loadDirectionData(task.questions);
            }
        }
    } catch (error) {
        console.error('Error loading task data:', error);
        showAlert('Failed to load task data', 'error');
    }
}

/**
 * Close task modal
 */
export function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    currentEditingTaskId = null;
}

/**
 * Handle task type change - show/hide relevant sections
 */
export function handleTaskTypeChange() {
    const taskType = document.getElementById('taskType')?.value;
    
    hideAllTaskTypeSections();
    
    switch(taskType) {
        case 'quiz':
        case 'riddle':
        case 'observation_match':
            document.getElementById('quizQuestionsSection')?.style.setProperty('display', 'block');
            break;
        case 'count_confirm':
            document.getElementById('countConfirmSection')?.style.setProperty('display', 'block');
            break;
        case 'direction':
            document.getElementById('directionSection')?.style.setProperty('display', 'block');
            break;
        case 'checkin':
            document.getElementById('qrActionsContainer')?.style.setProperty('display', 'block');
            break;
    }
}

/**
 * Hide all task-type specific sections
 */
function hideAllTaskTypeSections() {
    const sections = [
        'quizQuestionsSection',
        'countConfirmSection', 
        'directionSection',
        'qrActionsContainer'
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = 'none';
    });
}

/**
 * Handle task form submission
 */
export async function handleTaskSubmit(e) {
    e.preventDefault();

    const form = e.target;
    clearFormAlerts(form);

    const type = document.getElementById('taskType')?.value;
    const attractionId = document.getElementById('taskAttraction')?.value;
    const name = document.getElementById('taskName')?.value;
    const description = document.getElementById('taskDescription')?.value;
    const points = document.getElementById('taskPoints')?.value;
    const guide = document.getElementById('taskGuide')?.value;

    if (!type || !attractionId || !name) {
        showFormAlert(form, 'Please fill in all required fields', 'error');
        return;
    }

    const taskData = {
        attraction_id: attractionId,
        name: name,
        description: description,
        type: type,
        points: points || 0,
        guide: guide || ''
    };

    // Add type-specific data
    if (type === 'quiz' || type === 'riddle') {
        const quizData = collectQuizData();
        if (!quizData) {
            showFormAlert(form, type === 'riddle' ? 'Please add the riddle question and options' : 'Please add at least one quiz question', 'error');
            return;
        }
        taskData.questions = quizData.questions;
        taskData.options = quizData.options;
        
    } else if (type === 'count_confirm') {
        const targetObject = document.getElementById('countTargetObject')?.value;
        const correctCount = document.getElementById('countCorrectCount')?.value;
        const tolerance = document.getElementById('countTolerance')?.value || 0;
        
        if (!targetObject || !correctCount) {
            showFormAlert(form, 'Please fill in all Count & Confirm fields', 'error');
            return;
        }
        
        taskData.task_config = JSON.stringify({
            target_object: targetObject,
            correct_count: parseInt(correctCount),
            tolerance: parseInt(tolerance)
        });
        
    } else if (type === 'direction') {
        const question = document.getElementById('directionQuestion')?.value;
        const correctDirection = document.getElementById('directionCorrect')?.value;
        
        if (!question || !correctDirection) {
            showFormAlert(form, 'Please fill in all Direction & Orientation fields', 'error');
            return;
        }
        
        const allDirections = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
        
        const questionData = {
            question_text: question,
            question_order: 1
        };
        
        const optionsData = allDirections.map((dir, index) => ({
            option_text: dir,
            is_correct: dir === correctDirection ? 1 : 0,
            option_order: index + 1
        }));
        
        taskData.questions = [questionData];
        taskData.options = optionsData;
    }

    try {
        const url = currentEditingTaskId 
            ? `api/tasks.php?id=${currentEditingTaskId}` 
            : 'api/tasks.php';
            
        const method = currentEditingTaskId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (data.success) {
            showAlert(currentEditingTaskId ? 'Task updated successfully' : 'Task created successfully', 'success');
            closeTaskModal();
            loadTasks();
        } else {
            showFormAlert(form, data.message || 'Failed to save task', 'error');
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showFormAlert(form, 'Failed to save task', 'error');
    }
}

/**
 * Edit task
 */
export function editTask(id) {
    openTaskModal(id);
}

/**
 * Delete task
 */
export async function deleteTask(id) {
    if (!confirmAction('Are you sure you want to delete this task? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`api/tasks.php?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Task deleted successfully', 'success');
            loadTasks();
        } else {
            showAlert(data.message || 'Failed to delete task', 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showAlert('Failed to delete task', 'error');
    }
}

/**
 * Add quiz question
 */
export function addQuizQuestion() {
    const container = document.getElementById('quizQuestionsList');
    if (!container) return;

    const questionNum = container.children.length + 1;
    const questionId = `question_${Date.now()}`;

    const questionHTML = `
        <div class="quiz-question" id="${questionId}" data-question-num="${questionNum}">
            <h5>Question ${questionNum}</h5>
            <input type="text" class="question-text" placeholder="Enter question" required>
            <div class="quiz-options">
                ${createOptionHTML(questionId, 1)}
                ${createOptionHTML(questionId, 2)}
            </div>
            <button type="button" onclick="Tasks.addQuizOption('${questionId}')" class="btn btn-sm">
                <i class="fas fa-plus"></i> Add Option
            </button>
            <button type="button" onclick="Tasks.removeQuizQuestion('${questionId}')" class="btn btn-sm btn-danger">
                <i class="fas fa-trash"></i> Remove Question
            </button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', questionHTML);
}

/**
 * Remove quiz question
 */
export function removeQuizQuestion(questionId) {
    const question = document.getElementById(questionId);
    if (question) {
        question.remove();
        renumberQuizQuestions();
    }
}

/**
 * Add quiz option
 */
export function addQuizOption(questionId) {
    const question = document.getElementById(questionId);
    if (!question) return;

    const optionsContainer = question.querySelector('.quiz-options');
    const optionNum = optionsContainer.children.length + 1;

    optionsContainer.insertAdjacentHTML('beforeend', createOptionHTML(questionId, optionNum));
}

/**
 * Remove quiz option
 */
export function removeQuizOption(questionId, optionId) {
    const option = document.getElementById(optionId);
    if (option) {
        option.remove();
    }
}

/**
 * Create option HTML
 */
function createOptionHTML(questionId, optionNum) {
    const optionId = `${questionId}_option_${optionNum}`;
    return `
        <div class="quiz-option" id="${optionId}">
            <input type="text" class="option-text" placeholder="Option ${optionNum}" required>
            <label>
                <input type="radio" name="${questionId}_correct" value="${optionNum}">
                Correct
            </label>
            <button type="button" onclick="Tasks.removeQuizOption('${questionId}', '${optionId}')" class="btn btn-sm btn-danger">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

/**
 * Renumber quiz questions
 */
function renumberQuizQuestions() {
    const questions = document.querySelectorAll('.quiz-question');
    questions.forEach((q, index) => {
        q.querySelector('h5').textContent = `Question ${index + 1}`;
        q.setAttribute('data-question-num', index + 1);
    });
}

/**
 * Collect quiz data from form
 */
function collectQuizData() {
    const questions = [];
    const options = [];
    let questionOrder = 1;
    let globalOptionOrder = 1;

    const questionElements = document.querySelectorAll('.quiz-question');
    
    if (questionElements.length === 0) {
        return null;
    }

    questionElements.forEach(questionEl => {
        const questionText = questionEl.querySelector('.question-text')?.value;
        if (!questionText) return;

        questions.push({
            question_text: questionText,
            question_order: questionOrder
        });

        const optionElements = questionEl.querySelectorAll('.quiz-option');
        const correctRadio = questionEl.querySelector('input[type="radio"]:checked');

        optionElements.forEach((optionEl, optionIndex) => {
            const optionText = optionEl.querySelector('.option-text')?.value;
            if (!optionText) return;

            const isCorrect = correctRadio && correctRadio.value == (optionIndex + 1);

            options.push({
                question_order: questionOrder,
                option_text: optionText,
                is_correct: isCorrect ? 1 : 0,
                option_order: globalOptionOrder++
            });
        });

        questionOrder++;
    });

    return { questions, options };
}

/**
 * Load quiz questions for editing
 */
function loadQuizQuestions(questions) {
    const container = document.getElementById('quizQuestionsList');
    if (!container) return;

    container.innerHTML = '';

    questions.forEach((question, qIndex) => {
        const questionId = `question_${Date.now()}_${qIndex}`;
        const questionHTML = `
            <div class="quiz-question" id="${questionId}" data-question-num="${qIndex + 1}">
                <h5>Question ${qIndex + 1}</h5>
                <input type="text" class="question-text" placeholder="Enter question" value="${question.question_text}" required>
                <div class="quiz-options">
                    ${question.options.map((opt, oIndex) => `
                        <div class="quiz-option" id="${questionId}_option_${oIndex + 1}">
                            <input type="text" class="option-text" placeholder="Option ${oIndex + 1}" value="${opt.option_text}" required>
                            <label>
                                <input type="radio" name="${questionId}_correct" value="${oIndex + 1}" ${opt.is_correct ? 'checked' : ''}>
                                Correct
                            </label>
                            <button type="button" onclick="Tasks.removeQuizOption('${questionId}', '${questionId}_option_${oIndex + 1}')" class="btn btn-sm btn-danger">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" onclick="Tasks.addQuizOption('${questionId}')" class="btn btn-sm">
                    <i class="fas fa-plus"></i> Add Option
                </button>
                <button type="button" onclick="Tasks.removeQuizQuestion('${questionId}')" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i> Remove Question
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', questionHTML);
    });
}

/**
 * Load count & confirm data for editing
 */
function loadCountConfirmData(config) {
    const configObj = typeof config === 'string' ? JSON.parse(config) : config;
    document.getElementById('countTargetObject').value = configObj.target_object || '';
    document.getElementById('countCorrectCount').value = configObj.correct_count || '';
    document.getElementById('countTolerance').value = configObj.tolerance || 0;
}

/**
 * Load direction data for editing
 */
function loadDirectionData(questions) {
    if (questions && questions.length > 0) {
        const question = questions[0];
        document.getElementById('directionQuestion').value = question.question_text || '';
        
        // Find correct option
        const correctOption = question.options?.find(opt => opt.is_correct);
        if (correctOption) {
            document.getElementById('directionCorrect').value = correctOption.option_text;
        }
    }
}

/**
 * Helper functions
 */
function getTaskTypeBadgeColor(type) {
    const colors = {
        'quiz': 'warning',
        'photo': 'info',
        'checkin': 'success',
        'count_confirm': 'primary',
        'direction': 'purple',
        'riddle': 'danger'
    };
    return colors[type] || 'secondary';
}

function formatTaskType(type) {
    const labels = {
        'quiz': 'Quiz',
        'photo': 'Photo',
        'checkin': 'Check-in',
        'count_confirm': 'Count & Confirm',
        'direction': 'Direction & Orientation',
        'riddle': 'Riddle / Puzzle'
    };
    return labels[type] || type;
}

// Export all functions
export default {
    loadTasks,
    displayTasks,
    applyTaskFilters,
    clearTaskFilters,
    openTaskModal,
    closeTaskModal,
    handleTaskTypeChange,
    handleTaskSubmit,
    editTask,
    deleteTask,
    addQuizQuestion,
    removeQuizQuestion,
    addQuizOption,
    removeQuizOption
};
