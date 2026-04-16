document.addEventListener("DOMContentLoaded", () => {
  const statusText = document.getElementById("splash-status-text");
  const hyperDrive = document.getElementById("hyper-drive");
  const runtimeConfig = window.HAPPNIX_RUNTIME_CONFIG || {};
  const apiBaseUrl = String(runtimeConfig.apiBaseUrl || "").replace(/\/$/, "");
  let backendHealthState = "unknown";

  async function checkBackendHealth() {
    if (!apiBaseUrl || !statusText) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/health`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Backend health check failed.");
      }

      backendHealthState = "connected";
      statusText.textContent = "Backend connected. Preparing your vibe...";
    } catch (_error) {
      backendHealthState = "pending";
      statusText.style.color = "#fda4af";
      statusText.textContent = "Frontend ready. Backend deployment check pending.";
    }
  }

  void checkBackendHealth();

  // Phase 1: Initial load. The speaker is pumping, text says "Tuning the party vibe..."

  // Phase 2: Change text after 1.5 seconds to build anticipation
  setTimeout(() => {
    if (statusText) {
      if (backendHealthState === "connected") {
        statusText.style.color = "#34d399";
        statusText.textContent = "Backend check passed.";
        return;
      }

      if (backendHealthState === "pending") {
        statusText.style.color = "#fda4af";
        statusText.textContent = "Frontend live. Backend sync pending.";
        return;
      }

      statusText.style.color = "#34d399";
      statusText.textContent = "Happnix Check Passed.";
    }
  }, 1500);

  // Phase 3: The "Drop". Flash the screen white and redirect
  setTimeout(() => {
    if (hyperDrive) {
      hyperDrive.classList.add("active");
    }

    // Wait just a split second for the flash to cover the screen, then redirect
    setTimeout(() => {
      window.location.href = "signup_signin.html";
    }, 200);
  }, 2800);
});
