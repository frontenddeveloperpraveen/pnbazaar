/**
 * Analytics tracking utility for PN Bazaar storefront.
 * Captures user behaviour, element clicks, page views, and location attributes.
 */

// A simple pool of Indian states to simulate user locations for rich BI maps
const INDIAN_STATES = ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Gujarat", "Telangana", "Uttar Pradesh"];

function getRandomLocation(): string {
  if (typeof window !== "undefined") {
    let loc = localStorage.getItem("user_state_location");
    if (!loc) {
      loc = INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)];
      localStorage.setItem("user_state_location", loc);
    }
    return loc;
  }
  return "Delhi";
}

function getSessionId(): string {
  if (typeof window !== "undefined") {
    let sessId = sessionStorage.getItem("pn_session_id");
    if (!sessId) {
      sessId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString().slice(-5);
      sessionStorage.setItem("pn_session_id", sessId);
    }
    return sessId;
  }
  return "server-session";
}

export async function trackEvent(
  type: "pageview" | "click" | "dwell",
  page: string,
  buttonText: string = "",
  duration: number = 0
) {
  try {
    if (typeof window === "undefined") return;

    const location = getRandomLocation();
    const sessionId = getSessionId();
    
    // Fire and forget call to analytics API endpoint
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        page,
        buttonText,
        location,
        sessionId,
        duration
      })
    }).catch(err => console.warn("Analytics track failed:", err));
  } catch (e) {
    console.error("Tracker error:", e);
  }
}

