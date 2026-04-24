/**
 * Utility to deter casual inspection of the application.
 * Note: This cannot provide 100% security against reverse engineering, 
 * but it serves as a strong deterrent against casual snooping.
 */
export function initSecurityDeterrents() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // 1. Disable Right-Click (Context Menu)
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // 2. Disable Common DevTools Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    // Prevent F12
    if (e.key === "F12") {
      e.preventDefault();
    }
    
    // Check for Ctrl/Cmd modifier
    const isModifier = e.ctrlKey || e.metaKey;

    // Prevent Ctrl/Cmd + Shift + I (Inspector)
    if (isModifier && e.shiftKey && e.key.toLowerCase() === "i") {
      e.preventDefault();
    }
    
    // Prevent Ctrl/Cmd + Shift + J (Console)
    if (isModifier && e.shiftKey && e.key.toLowerCase() === "j") {
      e.preventDefault();
    }
    
    // Prevent Ctrl/Cmd + Shift + C (Inspector selection)
    if (isModifier && e.shiftKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
    }

    // Prevent Ctrl/Cmd + U (View Source)
    if (isModifier && e.key.toLowerCase() === "u") {
      e.preventDefault();
    }
  });
}
