/**
 * @file This script handles the frontend logic for the BITS Leave Request Form.
 * @author BITS Development Team
 */

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Global Variables & DOM Element Selections ---
    // A single place to store all references to DOM elements
    const ui = {
        form: document.getElementById('leave-form'),
        startDateInput: document.getElementById('start-date'),
        endDateInput: document.getElementById('end-date'),
        totalDaysInput: document.getElementById('total-days'),
        fileInput: document.getElementById('attachment'),
        currentDateEl: document.getElementById('current-date'),
        themeToggle: document.getElementById('theme-toggle'),
        successModal: document.getElementById('success-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        errorContainer: document.getElementById('form-errors'),
    };

    const API_ENDPOINT = 'https://leave-form-back-end.onrender.com/';
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    // --- 2. Core Functions ---

    /**
     * Toggles the theme between light and dark mode.
     * @param {boolean} isDark - True if dark mode should be enabled.
     */
    function applyTheme(isDark) {
        document.documentElement.classList.toggle('dark', isDark);
        ui.themeToggle.checked = isDark;
    }

    /**
     * Initializes the theme based on localStorage or system preference.
     */
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            applyTheme(savedTheme === 'dark');
        } else {
            applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }

    /**
     * Sets up the display for the current date and restricts past date selections.
     */
    function setupDates() {
        const today = new Date();
        ui.currentDateEl.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // Format today's date as YYYY-MM-DD for the 'min' attribute
        const todayString = today.toISOString().split('T')[0];
        ui.startDateInput.min = todayString;
        ui.endDateInput.min = todayString;
    }

    /**
     * Calculates the total number of leave days based on start and end dates.
     */
    function calculateTotalDays() {
        const startDate = new Date(ui.startDateInput.value);
        const endDate = new Date(ui.endDateInput.value);

        if (ui.startDateInput.value && ui.endDateInput.value && startDate <= endDate) {
            const diffTime = endDate.getTime() - startDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            ui.totalDaysInput.value = diffDays;
        } else {
            ui.totalDaysInput.value = '';
        }
    }

    /**
     * Validates the form inputs and returns a list of errors.
     * @returns {string[]} An array of error messages. Empty if validation passes.
     */
    function validateForm() {
        const errors = [];
        // Clear previous visual errors
        ui.form.querySelectorAll('.form-error').forEach(el => el.classList.remove('form-error'));

        // Check required fields
        ui.form.querySelectorAll('[required]').forEach(input => {
            if (!input.value.trim()) {
                errors.push(`${input.previousElementSibling.textContent} is required.`);
                input.classList.add('form-error');
            }
        });

        // Check date logic
        if (ui.startDateInput.value && ui.endDateInput.value && new Date(ui.startDateInput.value) > new Date(ui.endDateInput.value)) {
            errors.push('End date cannot be before the start date.');
            ui.endDateInput.classList.add('form-error');
        }

        // Check file size
        if (ui.fileInput.files.length > 0 && ui.fileInput.files[0].size > MAX_FILE_SIZE) {
            errors.push('File is too large. Max size is 5MB.');
        }

        return errors;
    }

    /**
     * Displays validation errors on the UI.
     * @param {string[]} errors - An array of error messages to display.
     */
    function displayErrors(errors) {
        ui.errorContainer.innerHTML = ''; // Clear previous errors
        if (errors.length === 0) {
            ui.errorContainer.style.display = 'none';
            return;
        }
        
        const errorList = document.createElement('ul');
        errors.forEach(errorText => {
            const listItem = document.createElement('li');
            listItem.textContent = errorText;
            errorList.appendChild(listItem);
        });
        ui.errorContainer.appendChild(errorList);
        ui.errorContainer.style.display = 'block';
    }
    
    /**
     * Resets the form to its initial state.
     */
    function resetForm() {
        ui.form.reset();
        ui.totalDaysInput.value = '';
        displayErrors([]); // Clear error messages
    }

    /**
     * Handles the form submission process.
     * @param {Event} event - The form submission event.
     */
    async function handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission
        
        const errors = validateForm();
        displayErrors(errors);

        if (errors.length > 0) {
            console.log('Form validation failed.');
            return;
        }

        // Form is valid, proceed with submission
        const formData = new FormData(ui.form);
        const data = Object.fromEntries(formData.entries());
        delete data.attachment; // File uploads are handled differently, so we remove this for now.

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Server response:', result);
                ui.successModal.classList.add('visible'); // Show success
            } else {
                // Handle HTTP errors like 404 or 500
                displayErrors([`Server error: ${response.status} - ${response.statusText}`]);
            }
        } catch (error) {
            // Handle network errors (e.g., server is down)
            console.error('Failed to send form data:', error);
            displayErrors(['Could not connect to the server. Please check your connection.']);
        }
    }


    // --- 3. Event Listeners ---

    // Listen for form submission
    ui.form.addEventListener('submit', handleFormSubmit);

    // Listen for date changes to calculate total days
    ui.startDateInput.addEventListener('change', () => {
        ui.endDateInput.min = ui.startDateInput.value; // Prevent end date being before start date
        calculateTotalDays();
    });
    ui.endDateInput.addEventListener('change', calculateTotalDays);

    // Listen for theme toggle changes
    ui.themeToggle.addEventListener('change', () => {
        const isDark = ui.themeToggle.checked;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        applyTheme(isDark);
    });
    
    // Listen for the success modal close button
    ui.closeModalBtn.addEventListener('click', () => {
        ui.successModal.classList.remove('visible');
        resetForm();
    });

    // --- 4. Initializations ---
    // Functions to run when the page first loads
    initializeTheme();
    setupDates();
    displayErrors([]); // Ensure error box is hidden on load
});
