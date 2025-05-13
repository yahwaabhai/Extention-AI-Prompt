// js/features/darkMode.js
// Handles theme selection (Light, Dark, Auto) via custom icon button menu (Reviewed Version)

import { loadDarkModePreference, saveDarkModePreference } from '../storage.js'; // Async

// --- Configuration ---
const DARK_START_HOUR = 19; const DARK_END_HOUR = 6;

// --- Icon Mapping ---
const themeIcons = {
    light: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 7.072l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clip-rule="evenodd" /></svg>`,
    dark: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>`,
    auto: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>`
};

// --- Module Variables ---
let themeButton = null, themeMenu = null, currentPreference = 'light';

// --- Core Functions ---
export async function initializeDarkMode() {
    console.log("THEME: Initializing...");
    themeButton = document.getElementById('theme-button');
    themeMenu = document.getElementById('theme-menu');
    if (!themeButton) { console.error("THEME: Button not found!"); /* Allow partial init */ }
    if (!themeMenu && themeButton) { console.warn("THEME: Menu not found! Menu disabled."); }
    try { await loadAndApplyPreference(); } catch (error) { console.error("THEME: Error init:", error); }
    if (themeButton) { themeButton.addEventListener('click', toggleThemeMenu); }
    if (themeMenu) { themeMenu.querySelectorAll('button[data-theme]').forEach(item => item.addEventListener('click', handleThemeMenuItemClick)); }
    window.addEventListener('click', handleOutsideClick);
    console.log("THEME: Initialized.");
}
function toggleThemeMenu(e){
    e.stopPropagation(); if (!themeMenu) return;
    const isHidden = themeMenu.classList.toggle('hidden');
    themeMenu.classList.toggle('opacity-0', isHidden); themeMenu.classList.toggle('invisible', isHidden);
    themeMenu.classList.toggle('opacity-100', !isHidden); themeMenu.classList.toggle('visible', !isHidden);
    if(themeButton) themeButton.setAttribute('aria-expanded', !isHidden);
}
function calculateAutoThemeIsDark() { const h = new Date().getHours(); return h >= DARK_START_HOUR || h < DARK_END_HOUR; }
function applyTheme(isDarkMode) { const el = document.documentElement; if(el){ el.classList.toggle('dark', isDarkMode); console.log(`THEME: Applied class: ${isDarkMode ? 'dark' : 'light'}`); } }
function updateThemeButtonIcon(preference) {
    console.log(`THEME: Updating icon for: ${preference}`);
    if (themeButton) {
        const iconSVG = themeIcons[preference] || themeIcons['light'];
        if (iconSVG) { themeButton.innerHTML = iconSVG; themeButton.title = `Theme: ${preference.charAt(0).toUpperCase() + preference.slice(1)}`; console.log(`THEME: Set button HTML for ${preference}`); }
        else { console.error(`THEME: No icon SVG for ${preference}`); themeButton.innerHTML = '?'; themeButton.title = 'Theme: Error'; }
    } else { console.error("THEME: Button element null."); }
}
async function loadAndApplyPreference() {
    currentPreference = await loadDarkModePreference(); // Async load
    console.log("THEME: Using preference:", currentPreference);
    const actualThemeIsDark = (currentPreference === 'auto') ? calculateAutoThemeIsDark() : (currentPreference === 'dark');
    applyTheme(actualThemeIsDark); updateThemeButtonIcon(currentPreference);
}
async function handleThemeMenuItemClick(event) {
    const selectedPreference = event.currentTarget.dataset.theme;
    if (!selectedPreference || !['light', 'dark', 'auto'].includes(selectedPreference)) { return; }
    console.log(`THEME: Selected: ${selectedPreference}`); currentPreference = selectedPreference;
    await saveDarkModePreference(currentPreference); // Async save
    const actualThemeIsDark = (currentPreference === 'auto') ? calculateAutoThemeIsDark() : (currentPreference === 'dark');
    applyTheme(actualThemeIsDark); updateThemeButtonIcon(currentPreference);
    if (themeMenu) { themeMenu.classList.add('hidden', 'opacity-0', 'invisible'); themeMenu.classList.remove('opacity-100', 'visible'); if(themeButton) themeButton.setAttribute('aria-expanded', 'false'); }
}
function handleOutsideClick(event) {
    if (themeMenu && themeButton && !themeMenu.classList.contains('hidden')) {
        if (!themeButton.contains(event.target) && !themeMenu.contains(event.target)) {
             themeMenu.classList.add('hidden', 'opacity-0', 'invisible'); themeMenu.classList.remove('opacity-100', 'visible');
             if(themeButton) themeButton.setAttribute('aria-expanded', 'false');
        }
    }
}