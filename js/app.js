/* ==============================================
   EXPENSE & BUDGET VISUALIZER
   js/app.js
   CodingCamp 310826 — Tantrii01

   TABLE OF CONTENTS
   1.  Constants & DOM References
   2.  Local Storage Keys
   3.  State
   4.  --- LOCAL STORAGE LAYER ---
       loadTransactions()
       saveTransactions()
       loadLimit()
       saveLimit()
       loadTheme()
       saveTheme()
   5.  --- DATA LAYER ---
       addTransaction()
       deleteTransaction()
       getSortedTransactions()
       getCategoryTotals()
       getTotal()
   6.  --- RENDER LAYER ---
       renderList()
       renderTotal()
       renderChart()
       renderAll()
   7.  --- UI HELPERS ---
       showError()
       hideError()
       showLimitWarning()
       hideLimitWarning()
       applyTheme()
   8.  --- FORM VALIDATION ---
       validateForm()
   9.  --- EVENT HANDLERS ---
       handleFormSubmit()
       handleDeleteClick()
       handleSortChange()
       handleLimitChange()
       handleThemeToggle()
   10. --- INITIALISATION ---
       init()
=============================================== */


/* ==============================================
   1. CONSTANTS & DOM REFERENCES
   Cache every DOM element we need so we don't
   query the document repeatedly inside functions.
=============================================== */

const form          = document.getElementById('expense-form');
const inputName     = document.getElementById('item-name');
const inputAmount   = document.getElementById('amount');
const inputCategory = document.getElementById('category');
const errorBox      = document.getElementById('error-message');

const totalDisplay  = document.getElementById('total-amount');
const listEl        = document.getElementById('transaction-list');
const emptyMessage  = document.getElementById('empty-message');

const sortSelect    = document.getElementById('sort-select');

const limitInput    = document.getElementById('spending-limit');
const limitWarning  = document.getElementById('limit-warning');

const themeToggleBtn = document.getElementById('theme-toggle');
const htmlEl         = document.documentElement; // <html> element carries data-theme

// Chart.js canvas element
const chartCanvas   = document.getElementById('expense-chart');

// Fixed colors for each category — kept in sync with CSS variables
const CATEGORY_COLORS = {
  Food:      '#38a169',  // green
  Transport: '#3182ce',  // blue
  Fun:       '#dd6b20',  // orange
};

// The order in which categories appear in the chart
const CATEGORIES = ['Food', 'Transport', 'Fun'];


/* ==============================================
   2. LOCAL STORAGE KEYS
   Centralised so a typo in one place doesn't
   silently break persistence.
=============================================== */

const LS_EXPENSES = 'expenses';
const LS_LIMIT    = 'spendingLimit';
const LS_THEME    = 'theme';


/* ==============================================
   3. STATE
   Single source of truth for the application.
   All UI is derived from this state object.
=============================================== */

const state = {
  transactions: [],   // array of transaction objects
  limit: 0,           // spending limit (0 = not set)
  chart: null,        // Chart.js instance (created once in init)
};


/* ==============================================
   4. LOCAL STORAGE LAYER
   These functions read and write to localStorage.
   They are the only place the app touches storage.
=============================================== */

/**
 * Read the saved transactions array from localStorage.
 * Returns an empty array if nothing is saved yet.
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(LS_EXPENSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // If stored data is corrupt, start fresh
    return [];
  }
}

/**
 * Serialise the transactions array and write it to localStorage.
 * @param {Array} transactions
 */
function saveTransactions(transactions) {
  localStorage.setItem(LS_EXPENSES, JSON.stringify(transactions));
}

/**
 * Read the spending limit from localStorage.
 * Returns 0 if nothing is saved.
 */
function loadLimit() {
  const raw = localStorage.getItem(LS_LIMIT);
  return raw ? parseFloat(raw) : 0;
}

/**
 * Save the spending limit to localStorage.
 * @param {number} value
 */
function saveLimit(value) {
  localStorage.setItem(LS_LIMIT, String(value));
}

/**
 * Read the saved theme preference from localStorage.
 * Returns 'light' if nothing is saved.
 */
function loadTheme() {
  return localStorage.getItem(LS_THEME) || 'light';
}

/**
 * Save the active theme to localStorage.
 * @param {string} theme  'light' or 'dark'
 */
function saveTheme(theme) {
  localStorage.setItem(LS_THEME, theme);
}


/* ==============================================
   5. DATA LAYER
   Pure functions that create, remove, sort, and
   summarise transaction data. They never touch
   the DOM — that is the render layer's job.
=============================================== */

/**
 * Create a new transaction object and add it to state.
 * Persists to localStorage immediately.
 * @param {string} name
 * @param {number} amount
 * @param {string} category  'Food' | 'Transport' | 'Fun'
 */
function addTransaction(name, amount, category) {
  const transaction = {
    id:       Date.now(),                          // unique numeric ID
    name:     name.trim(),
    amount:   parseFloat(amount),
    category: category,
    date:     new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
  };

  state.transactions.push(transaction);
  saveTransactions(state.transactions);
}

/**
 * Remove the transaction with the given id from state.
 * Persists to localStorage immediately.
 * @param {number} id
 */
function deleteTransaction(id) {
  state.transactions = state.transactions.filter(
    (t) => t.id !== id
  );
  saveTransactions(state.transactions);
}

/**
 * Return a sorted copy of the transactions array based on
 * the current sort dropdown value. Never mutates state.transactions.
 * @returns {Array}
 */
function getSortedTransactions() {
  const sortValue = sortSelect.value;
  // Shallow copy so we don't sort the canonical array
  const copy = [...state.transactions];

  switch (sortValue) {
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount);
    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount);
    case 'category-az':
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    case 'default':
    default:
      // Newest first: highest id (timestamp) at the top
      return copy.sort((a, b) => b.id - a.id);
  }
}

/**
 * Sum up spending per category.
 * Returns an object keyed by category name.
 * @returns {{ Food: number, Transport: number, Fun: number }}
 */
function getCategoryTotals() {
  const totals = { Food: 0, Transport: 0, Fun: 0 };

  state.transactions.forEach((t) => {
    if (totals[t.category] !== undefined) {
      totals[t.category] += t.amount;
    }
  });

  return totals;
}

/**
 * Calculate the grand total of all transactions.
 * @returns {number}
 */
function getTotal() {
  return state.transactions.reduce((sum, t) => sum + t.amount, 0);
}


/* ==============================================
   6. RENDER LAYER
   Functions that update the DOM based on state.
   Each function has exactly one responsibility.
=============================================== */

/**
 * Build and inject the transaction list into the DOM.
 * Reads from getSortedTransactions() so the current
 * sort option is always respected.
 */
function renderList() {
  const sorted = getSortedTransactions();

  // Show or hide the empty-state message
  emptyMessage.hidden = sorted.length > 0;

  // Clear existing list items
  listEl.innerHTML = '';

  sorted.forEach((t) => {
    // Create the list item
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = t.id; // store id for delete lookup

    // Category CSS class (lowercase for the CSS rule)
    const categoryClass = 'category-' + t.category.toLowerCase();

    li.innerHTML = `
      <div class="transaction-details">
        <span class="transaction-name">${escapeHtml(t.name)}</span>
        <div class="transaction-meta">
          <span class="transaction-category ${categoryClass}">${t.category}</span>
          <span class="transaction-date">${t.date}</span>
        </div>
      </div>
      <div class="transaction-right">
        <span class="transaction-amount">$${t.amount.toFixed(2)}</span>
        <button
          class="btn btn-delete"
          data-id="${t.id}"
          aria-label="Delete ${escapeHtml(t.name)}"
        >Delete</button>
      </div>
    `;

    listEl.appendChild(li);
  });
}

/**
 * Recalculate the grand total and update the display.
 * Also checks the spending limit and shows/hides the warning.
 */
function renderTotal() {
  const total = getTotal();

  // Update the displayed total
  totalDisplay.textContent = '' + total.toFixed(2);

  // Check the spending limit (only if one has been set)
  const limitIsSet = state.limit > 0;
  const isOverLimit = limitIsSet && total > state.limit;

  // Toggle the red colour class on the total number
  totalDisplay.classList.toggle('over-limit', isOverLimit);

  // Show or hide the warning banner
  if (isOverLimit) {
    showLimitWarning();
  } else {
    hideLimitWarning();
  }
}

/**
 * Update the Chart.js pie chart with fresh category totals.
 * Uses chart.update() instead of recreating the chart, which
 * is more efficient and animates the transition nicely.
 */
function renderChart() {
  const totals = getCategoryTotals();
  const data   = CATEGORIES.map((cat) => totals[cat]);

  state.chart.data.datasets[0].data = data;
  state.chart.update();
}

/**
 * Master render function — calls all three render functions.
 * Call this after any change to state.transactions or state.limit.
 */
function renderAll() {
  renderList();
  renderTotal();
  renderChart();
}


/* ==============================================
   7. UI HELPERS
   Small focused functions for showing/hiding
   messages and applying the theme.
=============================================== */

/**
 * Show a validation error message inside the form.
 * @param {string} message
 */
function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

/**
 * Hide the validation error message.
 */
function hideError() {
  errorBox.textContent = '';
  errorBox.hidden = true;
}

/**
 * Show the spending limit exceeded warning banner.
 */
function showLimitWarning() {
  limitWarning.hidden = false;
}

/**
 * Hide the spending limit exceeded warning banner.
 */
function hideLimitWarning() {
  limitWarning.hidden = true;
}

/**
 * Apply a theme to the page by setting data-theme on <html>
 * and updating the toggle button label.
 * @param {string} theme  'light' or 'dark'
 */
function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);

  if (theme === 'dark') {
    themeToggleBtn.textContent = '☀️ Light Mode';
  } else {
    themeToggleBtn.textContent = '🌙 Dark Mode';
  }

  // Update chart colors to match the new theme
  updateChartTheme(theme);
}

/**
 * Adjust Chart.js legend and tooltip text colors
 * so they remain readable in both themes.
 * @param {string} theme  'light' or 'dark'
 */
function updateChartTheme(theme) {
  if (!state.chart) return;

  const textColor = theme === 'dark' ? '#e2e8f0' : '#1a1d23';

  state.chart.options.plugins.legend.labels.color = textColor;
  state.chart.update();
}

/**
 * Safely escape user-provided text before inserting into innerHTML
 * to prevent any possibility of XSS injection.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}


/* ==============================================
   8. FORM VALIDATION
   Returns an error message string if invalid,
   or null if the form data is acceptable.
=============================================== */

/**
 * Validate the expense form fields.
 * @returns {string|null}  Error message, or null if valid.
 */
function validateForm() {
  const name     = inputName.value.trim();
  const amount   = parseFloat(inputAmount.value);
  const category = inputCategory.value;

  if (name === '') {
    return 'Please enter an item name.';
  }

  if (inputAmount.value.trim() === '' || isNaN(amount) || amount <= 0) {
    return 'Please enter a valid positive amount.';
  }

  if (category === '') {
    return 'Please select a category.';
  }

  return null; // all good
}


/* ==============================================
   9. EVENT HANDLERS
   One function per interactive element.
   Each handler reads user input, updates state,
   and calls renderAll() (or a specific renderer).
=============================================== */

/**
 * Handle the Add Expense form submission.
 * Validates, adds the transaction, re-renders, resets the form.
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault(); // stop page reload

  const errorMsg = validateForm();

  if (errorMsg) {
    showError(errorMsg);
    return;
  }

  // Form is valid — clear any previous error
  hideError();

  // Add the new transaction to state + localStorage
  addTransaction(
    inputName.value,
    inputAmount.value,
    inputCategory.value
  );

  // Update the entire UI
  renderAll();

  // Reset the form so it's ready for the next entry
  form.reset();
  // reset() leaves the category placeholder deselected, which is correct
}

/**
 * Handle click events on the transaction list.
 * Uses event delegation: one listener catches all delete button clicks.
 * @param {Event} event
 */
function handleDeleteClick(event) {
  // Only react to clicks on a delete button
  if (!event.target.classList.contains('btn-delete')) return;

  // Read the transaction id from the button's data-id attribute
  const id = parseInt(event.target.dataset.id, 10);

  deleteTransaction(id);
  renderAll();
}

/**
 * Handle changes to the sort dropdown.
 * Re-renders the list only (total and chart are unaffected by sort).
 */
function handleSortChange() {
  renderList();
}

/**
 * Handle changes to the spending limit input.
 * Saves the new limit and re-checks the warning.
 */
function handleLimitChange() {
  const raw = parseFloat(limitInput.value);

  // If the field is cleared or not a number, treat as 0 (no limit)
  state.limit = isNaN(raw) || raw < 0 ? 0 : raw;

  saveLimit(state.limit);

  // Only the total display needs to update (warning check lives there)
  renderTotal();
}

/**
 * Handle the dark/light mode toggle button click.
 * Flips the current theme, saves it, and applies it.
 */
function handleThemeToggle() {
  const currentTheme = htmlEl.getAttribute('data-theme');
  const newTheme     = currentTheme === 'dark' ? 'light' : 'dark';

  applyTheme(newTheme);
  saveTheme(newTheme);
}


/* ==============================================
   10. INITIALISATION
   Runs once when the page loads:
   - Restores state from localStorage
   - Creates the Chart.js instance
   - Attaches all event listeners
   - Does the first full render
=============================================== */

/**
 * Create the Chart.js pie chart on the canvas.
 * Called once during init(). Afterwards, we only call
 * chart.update() — never recreate the chart.
 * @returns {Chart}
 */
function createChart() {
  const ctx = chartCanvas.getContext('2d');

  return new Chart(ctx, {
    type: 'pie',

    data: {
      labels: CATEGORIES,
      datasets: [{
        data:            [0, 0, 0],    // populated by renderChart()
        backgroundColor: CATEGORIES.map((cat) => CATEGORY_COLORS[cat]),
        borderWidth:     2,
        borderColor:     'transparent',
        hoverOffset:     6,
      }],
    },

    options: {
      responsive:          true,
      maintainAspectRatio: true,

      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:    '#1a1d23',     // updated by updateChartTheme()
            padding:  16,
            font:     { size: 13 },
          },
        },

        tooltip: {
          callbacks: {
            // Show dollar amount in the tooltip, e.g. "Food: $42.50"
            label: function (context) {
              const value = context.parsed;
              return ' ' + value.toFixed(2);
            },
          },
        },
      },
    },
  });
}

/**
 * Boot the application.
 */
function init() {
  // --- Restore state from localStorage ---
  state.transactions = loadTransactions();
  state.limit        = loadLimit();
  const savedTheme   = loadTheme();

  // --- Apply saved theme before anything renders ---
  applyTheme(savedTheme);

  // --- Restore spending limit input field ---
  if (state.limit > 0) {
    limitInput.value = state.limit;
  }

  // --- Create the Chart.js instance ---
  state.chart = createChart();

  // --- Initial render ---
  renderAll();

  // --- Attach event listeners ---
  form.addEventListener('submit', handleFormSubmit);
  listEl.addEventListener('click', handleDeleteClick);  // delegated
  sortSelect.addEventListener('change', handleSortChange);
  limitInput.addEventListener('input', handleLimitChange);
  themeToggleBtn.addEventListener('click', handleThemeToggle);
}

// Start the app once the DOM is fully loaded.
// (app.js uses defer, so this fires immediately, but the guard
//  makes intent explicit and is safe if defer is ever removed.)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
