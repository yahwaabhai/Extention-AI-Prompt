// js/storage.js
import { LOCAL_STORAGE_KEY, LOCAL_STORAGE_CATEGORY_KEY, DARK_MODE_KEY } from './utils/constants.js';
// Import showNotification for error feedback
import { showNotification } from './ui/notifications.js';

/** Loads prompts array from chrome.storage.local */
export async function loadPrompts() {
    const key = LOCAL_STORAGE_KEY;
    console.log(`[Chrome Storage Load] Attempting to load prompts from key: ${key}`);
    try {
        // Use chrome.storage.local.get, which returns a Promise
        const data = await chrome.storage.local.get([key]);
        const storedData = data[key]; // Extract data using the key

        if (storedData) {
            // Validation remains the same
            if (Array.isArray(storedData)) {
                console.log(`[Chrome Storage Load] Successfully loaded ${storedData.length} prompts.`);
                return storedData;
            } else {
                console.warn("[Chrome Storage Load] Stored prompt data is not an array. Resetting.");
                // Clear invalid data using chrome.storage.local.remove
                await chrome.storage.local.remove(key);
                return [];
            }
        } else {
            console.log(`[Chrome Storage Load] No prompts found for key ${key}.`);
            return [];
        }
    } catch (error) {
        console.error("[Chrome Storage Load] Error loading prompts:", error);
        showNotification("Error loading saved prompts. Data might be corrupt.", 'error', 5000);
        return [];
    }
}

/** Saves the prompts array to chrome.storage.local. Returns true on success, false on failure. */
export async function savePrompts(promptsToSave) {
    if (!Array.isArray(promptsToSave)) {
        console.error("[Chrome Storage Save] Attempted to save non-array data for prompts.");
        return false; // Indicate failure
    }
    const key = LOCAL_STORAGE_KEY;
    console.log(`[Chrome Storage Save] Attempting to save ${promptsToSave.length} prompts to key: ${key}`);
    try {
        // Use chrome.storage.local.set, which returns a Promise
        // Pass data as an object { key: value }
        await chrome.storage.local.set({ [key]: promptsToSave });
        console.log("[Chrome Storage Save] Prompts saved successfully.");
        return true; // Indicate success
    } catch (error) {
        console.error("[Chrome Storage Save] Error saving prompts:", error);
        // Check for specific Chrome storage errors if needed, though QuotaExceededError is less common than with localStorage
        // Example: if (error.message.includes('QUOTA_BYTES')) ...
        showNotification("Error saving prompts to storage.", 'error', 5000);
        return false; // Indicate failure
    }
}

/** Loads categories array from chrome.storage.local */
export async function loadCategories() {
    const key = LOCAL_STORAGE_CATEGORY_KEY;
    console.log(`[Chrome Storage Load] Attempting to load categories from key: ${key}`);
    try {
        const data = await chrome.storage.local.get([key]);
        const storedData = data[key];

        if (storedData) {
            // Validation remains the same
            if (Array.isArray(storedData) && storedData.every(c => c && c.id && c.name)) {
                console.log(`[Chrome Storage Load] Successfully loaded ${storedData.length} categories.`);
                return storedData;
            } else {
                console.warn("[Chrome Storage Load] Stored category data is invalid. Resetting.");
                await chrome.storage.local.remove(key);
                return [];
            }
        } else {
            console.log(`[Chrome Storage Load] No categories found for key ${key}.`);
            return [];
        }
    } catch (error) {
        console.error("[Chrome Storage Load] Error loading categories:", error);
        showNotification("Error loading categories.", 'error');
        return [];
    }
}

/** Saves the categories array to chrome.storage.local. Returns true on success, false on failure. */
export async function saveCategories(categoriesToSave) {
    if (!Array.isArray(categoriesToSave)) {
        console.error("[Chrome Storage Save] Attempted to save non-array data for categories.");
        return false; // Indicate failure
    }
    const key = LOCAL_STORAGE_CATEGORY_KEY;
    console.log(`[Chrome Storage Save] Attempting to save ${categoriesToSave.length} categories to key: ${key}`);
    try {
        await chrome.storage.local.set({ [key]: categoriesToSave });
        console.log("[Chrome Storage Save] Categories saved successfully.");
        return true; // Indicate success
    } catch (error) {
        console.error("[Chrome Storage Save] Error saving categories:", error);
        showNotification("Error saving categories to storage.", 'error', 5000);
        return false; // Indicate failure
    }
}

/** Loads dark mode preference from chrome.storage.local (stores as boolean) */
export async function loadDarkModePreference() {
    // Note: We'll adapt darkMode.js later to use this storage method correctly.
    // This function is just for the storage layer for now.
    const key = DARK_MODE_KEY; // Assuming DARK_MODE_KEY is 'promptManager_themePreference'
    try {
        const data = await chrome.storage.local.get([key]);
        const preference = data[key]; // This could be 'light', 'dark', 'auto'
        console.log(`[Chrome Storage Load] Loaded theme preference: ${preference}`);
        // Return the preference string, or a default if undefined/invalid
        if (['light', 'dark', 'auto'].includes(preference)) {
            return preference;
        }
        return 'light'; // Default to 'light' if not found or invalid
    } catch (error) {
        console.error("[Chrome Storage Load] Error loading theme preference:", error);
        showNotification("Could not load theme preference.", 'warning');
        return 'light'; // Default to 'light' on error
    }
}

/** Saves dark mode preference to chrome.storage.local */
export async function saveDarkModePreference(preference) {
    // Note: We'll adapt darkMode.js later.
    const key = DARK_MODE_KEY; // Assuming DARK_MODE_KEY is 'promptManager_themePreference'
    if (!['light', 'dark', 'auto'].includes(preference)) {
        console.warn(`[Chrome Storage Save] Attempted to save invalid theme preference: ${preference}`);
        return;
    }
    try {
        await chrome.storage.local.set({ [key]: preference });
         console.log(`[Chrome Storage Save] Saved theme preference: ${preference}`);
    } catch (error) {
        console.error("[Chrome Storage Save] Error saving theme preference:", error);
        showNotification("Could not save theme preference.", 'warning');
    }
}