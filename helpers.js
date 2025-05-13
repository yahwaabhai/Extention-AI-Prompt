// js/utils/helpers.js

/** Debounce function to limit execution rate */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/** Basic HTML escaping */
export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/** Generates a simple unique ID */
export function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Escapes special characters for RegExp */
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Gets a somewhat unique selector for an element (basic) */
export function getUniqueSelector(el) {
    if (!el || !(el instanceof Element)) return null;
    if (el.id) return `#${CSS.escape(el.id)}`; // Prefer ID
    let s = el.tagName.toLowerCase();
    const classes = Array.from(el.classList).filter(c => !c.startsWith('sortable-') && !['unsaved','prompt-card-overlay','expanded'].includes(c));
    if (classes.length > 0) { s += `.${CSS.escape(classes[0])}`; } // Use first relevant class
    const p = el.parentElement;
    if (p && p.contains(el)) {
        const siblings = Array.from(p.children);
        const sameTag = siblings.filter(sib => sib.tagName === el.tagName);
        if (sameTag.length > 1) {
            const idx = sameTag.indexOf(el);
            if (idx !== -1) s += `:nth-of-type(${idx + 1})`;
        }
    }
    return s;
}

/** Parses tags from a comma-separated string */
export function getTagsFromString(tagString) {
    if (typeof tagString !== 'string') return [];
    return tagString.split(',')
                    .map(tag => tag.trim().toLowerCase())
                    .filter(tag => tag !== '' && tag.length < 30)
                    .filter((tag, index, self) => self.indexOf(tag) === index); // Unique tags
}

/** Updates the copyright year */
export function updateCurrentYear(yearElement) {
    if (!yearElement) return;
    try {
        const tz = 'Asia/Karachi'; // Use specific timezone
        const d = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
        yearElement.textContent = d.getFullYear();
    } catch (e) { // Fallback
        console.warn("Could not get specific timezone year, using browser default.");
        yearElement.textContent = new Date().getFullYear();
    }
 }