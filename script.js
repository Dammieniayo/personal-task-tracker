/**
 * Personal Task Tracker
 * Pure HTML, CSS, and JavaScript implementation.
 * Persists all data to browser localStorage.
 */

(function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEY = 'personal_task_tracker_tasks';
  const THEME_STORAGE_KEY = 'personal_task_tracker_theme';

  // Application State
  const state = {
    tasks: [],
    filter: 'all', // 'all' | 'pending' | 'completed'
    searchQuery: '',
    sortBy: 'dueDateAsc',
    editingTaskId: null,
    deletingTaskId: null,
  };

  // DOM Elements
  const elements = {
    // Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // Export & Import
    exportTasksBtn: document.getElementById('exportTasksBtn'),
    importTasksBtn: document.getElementById('importTasksBtn'),
    importFileInput: document.getElementById('importFileInput'),

    // Stats
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    statCompleted: document.getElementById('statCompleted'),
    statOverdue: document.getElementById('statOverdue'),
    statOverdueCard: document.getElementById('statOverdueCard'),
    statPercent: document.getElementById('statPercent'),
    progressBarFill: document.getElementById('progressBarFill'),

    // Filter counts
    countAll: document.getElementById('countAll'),
    countPending: document.getElementById('countPending'),
    countCompleted: document.getElementById('countCompleted'),

    // Controls
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    sortSelect: document.getElementById('sortSelect'),
    resultsSummary: document.getElementById('resultsSummary'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),

    // List & Empty State
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateActionBtn: document.getElementById('emptyStateActionBtn'),
    emptyStateActionText: document.getElementById('emptyStateActionText'),
    loadSampleTasksBtn: document.getElementById('loadSampleTasksBtn'),

    // Add / Edit Modal
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    taskModal: document.getElementById('taskModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    taskForm: document.getElementById('taskForm'),
    modalTitle: document.getElementById('modalTitle'),
    saveTaskBtn: document.getElementById('saveTaskBtn'),
    taskIdInput: document.getElementById('taskIdInput'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskPriorityInput: document.getElementById('taskPriorityInput'),
    titleError: document.getElementById('titleError'),
    dueDateError: document.getElementById('dueDateError'),

    // Delete Confirmation Modal
    confirmModal: document.getElementById('confirmModal'),
    confirmTaskTitle: document.getElementById('confirmTaskTitle'),
    cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
    deleteTaskConfirmBtn: document.getElementById('deleteTaskConfirmBtn'),

    // Toast Notification
    toastNotification: document.getElementById('toastNotification'),
  };

  // ==========================================================================
  // Helper Utilities
  // ==========================================================================

  /**
   * Escape HTML characters to prevent XSS injection.
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get today's local date string formatted as YYYY-MM-DD.
   */
  function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if a task is overdue (pending and due date < today).
   */
  function isTaskOverdue(task) {
    if (!task || task.completed || !task.dueDate) return false;
    const todayStr = getTodayString();
    return task.dueDate < todayStr;
  }

  /**
   * Format date for user display (e.g., "Nov 15, 2026").
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Relative labels for Today & Tomorrow
    const todayStr = getTodayString();
    if (dateStr === todayStr) {
      return 'Today';
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    if (dateStr === tomorrowStr) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Show a temporary toast message.
   */
  let toastTimer = null;
  function showToast(message) {
    if (!elements.toastNotification) return;
    elements.toastNotification.textContent = message;
    elements.toastNotification.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toastNotification.classList.remove('show');
    }, 2800);
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    showToast(`Switched to ${nextTheme} mode`);
  }

  // ==========================================================================
  // LocalStorage Management
  // ==========================================================================

  function loadTasksFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading tasks from localStorage:', err);
    }
    return [];
  }

  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (err) {
      console.error('Error saving tasks to localStorage:', err);
      showToast('Warning: Unable to save to localStorage.');
    }
  }

  // ==========================================================================
  // Task CRUD Operations
  // ==========================================================================

  function addTask({ title, description, dueDate, priority }) {
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate,
      priority: priority, // 'Low' | 'Medium' | 'High'
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.tasks.unshift(newTask);
    saveTasksToStorage();
    render();
    showToast('Task added successfully!');
  }

  function updateTask(id, { title, description, dueDate, priority }) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    task.title = title.trim();
    task.description = description.trim();
    task.dueDate = dueDate;
    task.priority = priority;
    task.updatedAt = new Date().toISOString();

    saveTasksToStorage();
    render();
    showToast('Task updated successfully!');
  }

  function toggleTaskCompletion(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();

    saveTasksToStorage();
    render();

    const statusMsg = task.completed ? 'Task marked as completed!' : 'Task marked as pending.';
    showToast(statusMsg);
  }

  function deleteTask(id) {
    const initialLength = state.tasks.length;
    state.tasks = state.tasks.filter((t) => t.id !== id);

    if (state.tasks.length < initialLength) {
      saveTasksToStorage();
      render();
      showToast('Task deleted successfully.');
    }
  }

  function clearCompletedTasks() {
    const completedCount = state.tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    if (window.confirm(`Are you sure you want to remove all ${completedCount} completed task(s)?`)) {
      state.tasks = state.tasks.filter((t) => !t.completed);
      saveTasksToStorage();
      render();
      showToast(`Removed ${completedCount} completed task(s).`);
    }
  }

  // ==========================================================================
  // Sample Tasks Generation
  // ==========================================================================

  function loadSampleTasks() {
    const today = new Date();
    
    // Yesterday (Overdue)
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

    // Today
    const todayStr = getTodayString();

    // In 3 Days
    const future = new Date(today);
    future.setDate(future.getDate() + 3);
    const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;

    const sampleTasks = [
      {
        id: 'task_sample_1',
        title: 'Submit quarterly budget proposal',
        description: 'Review departmental expenses with finance and send the revised draft.',
        dueDate: yestStr,
        priority: 'High',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task_sample_2',
        title: 'Team sync & sprint retrospective',
        description: 'Discuss sprint deliverables, blockers, and set action items for next week.',
        dueDate: todayStr,
        priority: 'Medium',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task_sample_3',
        title: 'Prepare product presentation slides',
        description: 'Create slide deck for Thursday stakeholder demo.',
        dueDate: futureStr,
        priority: 'Low',
        completed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    state.tasks = sampleTasks;
    saveTasksToStorage();
    render();
    showToast('Loaded 3 sample tasks!');
  }

  // ==========================================================================
  // Export & Import Data
  // ==========================================================================

  function exportTasksJSON() {
    if (state.tasks.length === 0) {
      showToast('No tasks to export.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `task-tracker-backup-${getTodayString()}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Tasks backup exported!');
  }

  function handleImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          // Merge or replace
          const validTasks = importedData.filter((t) => t && t.title && typeof t.title === 'string');
          if (validTasks.length === 0) {
            showToast('No valid tasks found in file.');
            return;
          }

          state.tasks = validTasks;
          saveTasksToStorage();
          render();
          showToast(`Successfully imported ${validTasks.length} tasks!`);
        } else {
          showToast('Invalid file structure. Expected JSON array.');
        }
      } catch (err) {
        console.error('Import parse error:', err);
        showToast('Error parsing JSON backup file.');
      }
      elements.importFileInput.value = '';
    };
    reader.readAsText(file);
  }

  // ==========================================================================
  // Filtering, Searching & Sorting
  // ==========================================================================

  function getProcessedTasks() {
    // 1. Filter by Status (All / Pending / Completed)
    let filtered = state.tasks.filter((task) => {
      if (state.filter === 'completed') return task.completed;
      if (state.filter === 'pending') return !task.completed;
      return true; // 'all'
    });

    // 2. Search by Title
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.trim().toLowerCase();
      filtered = filtered.filter((task) => task.title.toLowerCase().includes(q));
    }

    // 3. Sort Tasks
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };

    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'dueDateAsc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);

        case 'dueDateDesc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return b.dueDate.localeCompare(a.dueDate);

        case 'priorityHigh':
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);

        case 'priorityLow':
          return (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);

        case 'titleAsc':
          return a.title.localeCompare(b.title);

        case 'createdDesc':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }

  // ==========================================================================
  // Statistics Update
  // ==========================================================================

  function updateStatistics() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const overdue = state.tasks.filter((t) => isTaskOverdue(t)).length;

    // Update Top Counters
    elements.statTotal.textContent = total;
    elements.statCompleted.textContent = completed;
    elements.statPending.textContent = pending;
    elements.statOverdue.textContent = overdue;

    // Highlight Overdue Stat Card if > 0
    if (overdue > 0) {
      elements.statOverdueCard.classList.add('has-overdue');
    } else {
      elements.statOverdueCard.classList.remove('has-overdue');
    }

    // Progress Bar & Percentage
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    elements.statPercent.textContent = `${percentage}%`;
    elements.progressBarFill.style.width = `${percentage}%`;

    // Filter Tab Count Badges
    elements.countAll.textContent = total;
    elements.countPending.textContent = pending;
    elements.countCompleted.textContent = completed;

    // Clear completed button visibility
    if (elements.clearCompletedBtn) {
      elements.clearCompletedBtn.style.display = completed > 0 ? 'inline-block' : 'none';
    }
  }

  // ==========================================================================
  // Render Task Cards & Empty States
  // ==========================================================================

  function renderTaskCard(task) {
    const isOverdue = isTaskOverdue(task);
    const overdueClass = isOverdue ? 'is-overdue' : '';
    const completedClass = task.completed ? 'is-completed' : '';
    const displayDate = task.dueDate ? formatDisplayDate(task.dueDate) : 'No due date';
    const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;

    // Overdue Badge HTML
    const overdueBadgeHTML = isOverdue
      ? `<span class="badge badge-overdue" title="Due date has passed">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Overdue
        </span>`
      : '';

    // Description HTML (only if provided)
    const descHTML = task.description
      ? `<p class="task-desc">${escapeHTML(task.description)}</p>`
      : '';

    return `
      <article class="task-card ${completedClass} ${overdueClass}" data-id="${task.id}" role="listitem">
        <!-- Checkbox Toggle -->
        <div class="task-check-wrap">
          <button 
            type="button" 
            class="task-checkbox-btn" 
            data-action="toggle" 
            aria-label="${task.completed ? 'Mark task as pending' : 'Mark task as completed'}"
            title="${task.completed ? 'Mark as pending' : 'Mark as completed'}"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>

        <!-- Task Details -->
        <div class="task-content">
          <h3 class="task-title">${escapeHTML(task.title)}</h3>
          ${descHTML}
          <div class="task-meta-row">
            <!-- Priority Badge -->
            <span class="badge ${priorityClass}">
              ${task.priority} Priority
            </span>

            <!-- Due Date Badge -->
            <span class="badge badge-due-date">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${displayDate}
            </span>

            <!-- Status Badge -->
            <span class="badge ${task.completed ? 'badge-status-completed' : 'badge-status-pending'}">
              ${task.completed ? 'Completed' : 'Pending'}
            </span>

            <!-- Overdue Badge (if overdue) -->
            ${overdueBadgeHTML}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="task-actions">
          <button 
            type="button" 
            class="icon-btn btn-edit" 
            data-action="edit" 
            aria-label="Edit task" 
            title="Edit task"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button 
            type="button" 
            class="icon-btn btn-delete" 
            data-action="delete" 
            aria-label="Delete task" 
            title="Delete task"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </article>
    `;
  }

  function render() {
    updateStatistics();

    const processedTasks = getProcessedTasks();
    const hasAnyTasks = state.tasks.length > 0;
    const hasMatchingTasks = processedTasks.length > 0;

    // Update Results Summary Text
    if (!hasAnyTasks) {
      elements.resultsSummary.textContent = 'No tasks in tracker';
    } else if (state.searchQuery.trim() !== '') {
      elements.resultsSummary.textContent = `Found ${processedTasks.length} ${
        processedTasks.length === 1 ? 'task' : 'tasks'
      } matching "${state.searchQuery}"`;
    } else if (state.filter === 'completed') {
      elements.resultsSummary.textContent = `Showing ${processedTasks.length} completed ${
        processedTasks.length === 1 ? 'task' : 'tasks'
      }`;
    } else if (state.filter === 'pending') {
      elements.resultsSummary.textContent = `Showing ${processedTasks.length} pending ${
        processedTasks.length === 1 ? 'task' : 'tasks'
      }`;
    } else {
      elements.resultsSummary.textContent = `Showing all ${processedTasks.length} ${
        processedTasks.length === 1 ? 'task' : 'tasks'
      }`;
    }

    // Render Cards or Empty State
    if (hasMatchingTasks) {
      elements.emptyState.style.display = 'none';
      elements.taskList.style.display = 'flex';
      elements.taskList.innerHTML = processedTasks.map(renderTaskCard).join('');
    } else {
      elements.taskList.innerHTML = '';
      elements.taskList.style.display = 'none';
      elements.emptyState.style.display = 'flex';

      if (!hasAnyTasks) {
        // Global empty state: User has 0 tasks
        elements.emptyStateTitle.textContent = 'No tasks yet!';
        elements.emptyStateDesc.textContent =
          "Your task list is completely clear. Add your first task or load samples to test all features!";
        elements.emptyStateActionText.textContent = 'Add Your First Task';
        elements.loadSampleTasksBtn.style.display = 'inline-flex';
        elements.emptyStateActionBtn.onclick = () => openTaskModal();
      } else {
        // Filter or search empty state
        elements.emptyStateTitle.textContent = 'No matching tasks found';
        elements.emptyStateDesc.textContent =
          'We couldn\'t find any tasks matching your active filters or search terms. Try clearing them to see all your tasks.';
        elements.emptyStateActionText.textContent = 'Clear Search & Filters';
        elements.loadSampleTasksBtn.style.display = 'none';
        elements.emptyStateActionBtn.onclick = () => {
          clearSearchAndFilters();
        };
      }
    }
  }

  function clearSearchAndFilters() {
    state.searchQuery = '';
    state.filter = 'all';
    elements.searchInput.value = '';
    elements.clearSearchBtn.style.display = 'none';

    elements.filterTabs.forEach((tab) => {
      const isAll = tab.dataset.filter === 'all';
      tab.classList.toggle('active', isAll);
      tab.setAttribute('aria-selected', isAll ? 'true' : 'false');
    });

    render();
  }

  // ==========================================================================
  // Modal Management: Add & Edit Task
  // ==========================================================================

  function openTaskModal(taskIdToEdit = null) {
    clearFormErrors();

    if (taskIdToEdit) {
      // Edit mode
      const task = state.tasks.find((t) => t.id === taskIdToEdit);
      if (!task) return;

      state.editingTaskId = task.id;
      elements.modalTitle.textContent = 'Edit Task';
      elements.saveTaskBtn.textContent = 'Save Changes';

      elements.taskIdInput.value = task.id;
      elements.taskTitleInput.value = task.title;
      elements.taskDescInput.value = task.description || '';
      elements.taskDueDateInput.value = task.dueDate || '';
      elements.taskPriorityInput.value = task.priority || 'Medium';
    } else {
      // Add mode
      state.editingTaskId = null;
      elements.modalTitle.textContent = 'Add New Task';
      elements.saveTaskBtn.textContent = 'Add Task';

      elements.taskForm.reset();
      elements.taskIdInput.value = '';
      elements.taskDueDateInput.value = getTodayString();
      elements.taskPriorityInput.value = 'Medium';
    }

    elements.taskModal.classList.add('active');
    elements.taskModal.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      elements.taskTitleInput.focus();
    }, 100);
  }

  function closeTaskModal() {
    elements.taskModal.classList.remove('active');
    elements.taskModal.setAttribute('aria-hidden', 'true');
    clearFormErrors();
    state.editingTaskId = null;
  }

  function clearFormErrors() {
    const formGroups = elements.taskForm.querySelectorAll('.form-group');
    formGroups.forEach((group) => group.classList.remove('has-error'));
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();
    clearFormErrors();

    const title = elements.taskTitleInput.value.trim();
    const description = elements.taskDescInput.value.trim();
    const dueDate = elements.taskDueDateInput.value;
    const priority = elements.taskPriorityInput.value;

    let hasError = false;

    if (!title) {
      elements.titleError.closest('.form-group').classList.add('has-error');
      hasError = true;
    }

    if (!dueDate) {
      elements.dueDateError.closest('.form-group').classList.add('has-error');
      hasError = true;
    }

    if (hasError) return;

    if (state.editingTaskId) {
      updateTask(state.editingTaskId, { title, description, dueDate, priority });
    } else {
      addTask({ title, description, dueDate, priority });
    }

    closeTaskModal();
  }

  // ==========================================================================
  // Modal Management: Delete Confirmation
  // ==========================================================================

  function openDeleteConfirmModal(taskId) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    state.deletingTaskId = taskId;
    elements.confirmTaskTitle.textContent = `"${task.title}"`;

    elements.confirmModal.classList.add('active');
    elements.confirmModal.setAttribute('aria-hidden', 'false');
    elements.deleteTaskConfirmBtn.focus();
  }

  function closeDeleteConfirmModal() {
    elements.confirmModal.classList.remove('active');
    elements.confirmModal.setAttribute('aria-hidden', 'true');
    state.deletingTaskId = null;
  }

  function handleConfirmDelete() {
    if (state.deletingTaskId) {
      deleteTask(state.deletingTaskId);
      closeDeleteConfirmModal();
    }
  }

  // ==========================================================================
  // Event Listeners Setup
  // ==========================================================================

  function setupEventListeners() {
    // Theme Toggle
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Export & Import
    if (elements.exportTasksBtn) {
      elements.exportTasksBtn.addEventListener('click', exportTasksJSON);
    }
    if (elements.importTasksBtn) {
      elements.importTasksBtn.addEventListener('click', () => {
        elements.importFileInput.click();
      });
    }
    if (elements.importFileInput) {
      elements.importFileInput.addEventListener('change', handleImportFile);
    }

    // Clear completed tasks
    if (elements.clearCompletedBtn) {
      elements.clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    }

    // Load sample tasks
    if (elements.loadSampleTasksBtn) {
      elements.loadSampleTasksBtn.addEventListener('click', loadSampleTasks);
    }

    // Open Add Modal
    elements.openAddModalBtn.addEventListener('click', () => openTaskModal());

    // Close Modals via Close & Cancel buttons
    elements.closeModalBtn.addEventListener('click', closeTaskModal);
    elements.cancelModalBtn.addEventListener('click', closeTaskModal);

    elements.cancelConfirmBtn.addEventListener('click', closeDeleteConfirmModal);
    elements.deleteTaskConfirmBtn.addEventListener('click', handleConfirmDelete);

    // Close on Backdrop Click
    elements.taskModal.addEventListener('click', (e) => {
      if (e.target === elements.taskModal) {
        closeTaskModal();
      }
    });

    elements.confirmModal.addEventListener('click', (e) => {
      if (e.target === elements.confirmModal) {
        closeDeleteConfirmModal();
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape closes open modals
      if (e.key === 'Escape') {
        if (elements.taskModal.classList.contains('active')) {
          closeTaskModal();
        }
        if (elements.confirmModal.classList.contains('active')) {
          closeDeleteConfirmModal();
        }
      }

      // Quick shortcut: '/' to focus search (when not currently in an input)
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        elements.searchInput.focus();
      }

      // Quick shortcut: 'n' or 'N' to open add task modal (when not currently typing)
      if ((e.key === 'n' || e.key === 'N') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        if (!elements.taskModal.classList.contains('active') && !elements.confirmModal.classList.contains('active')) {
          e.preventDefault();
          openTaskModal();
        }
      }
    });

    // Form Submit
    elements.taskForm.addEventListener('submit', handleTaskFormSubmit);

    // Live search input
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      elements.clearSearchBtn.style.display = state.searchQuery ? 'flex' : 'none';
      render();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.style.display = 'none';
      elements.searchInput.focus();
      render();
    });

    // Filter Tabs
    elements.filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        elements.filterTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        state.filter = tab.dataset.filter;
        render();
      });
    });

    // Sort Dropdown
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      render();
    });

    // Delegated Clicks on Task List
    elements.taskList.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;

      const card = actionBtn.closest('.task-card');
      if (!card) return;

      const taskId = card.dataset.id;
      const action = actionBtn.dataset.action;

      if (action === 'toggle') {
        toggleTaskCompletion(taskId);
      } else if (action === 'edit') {
        openTaskModal(taskId);
      } else if (action === 'delete') {
        openDeleteConfirmModal(taskId);
      }
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    initTheme();
    state.tasks = loadTasksFromStorage();
    setupEventListeners();
    render();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
