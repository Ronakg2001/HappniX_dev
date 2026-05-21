const bootConfigEl = document.getElementById('signup-details-boot-config');
let bootConfig = {};
if (bootConfigEl) {
  try {
    bootConfig = JSON.parse(bootConfigEl.textContent || '{}');
  } catch (error) {
    bootConfig = {};
  }
}
const form = document.getElementById("detailsForm");
    const submitBtn = document.getElementById("submitBtn");
    const error = document.getElementById("error");
    const success = document.getElementById("success");
    const csrfTokenTemplate = bootConfig.csrfToken || "";

    const AUTH_ENDPOINT = "/api/auth";

    function getCsrfToken() {
      if (csrfTokenTemplate && csrfTokenTemplate !== "NOTPROVIDED") {
        return csrfTokenTemplate;
      }
      const value = `; ${document.cookie}`;
      const parts = value.split(`; csrftoken=`);
      if (parts.length === 2) {
        return parts.pop().split(";").shift();
      }
      return "";
    }

    function setDobMax() {
      const dobInput = document.getElementById("dob");
      const today = new Date();
      dobInput.max = today.toISOString().split("T")[0];
    }

    function isStrongPassword(value) {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
    }

    function buildApiUrl(path) {
      const runtimeConfig = window.HAPPNIX_RUNTIME_CONFIG || {};
      if (typeof runtimeConfig.buildApiUrl === "function") {
        return runtimeConfig.buildApiUrl(path);
      }
      const base = String(runtimeConfig.apiBaseUrl || "").replace(/\/$/, "");
      return base ? `${base}${path}` : path;
    }

    async function callAuthAction(actionItem, data = {}) {
      const headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken()
      };

      // Attach pre-auth token if we have one (OTP/signup flow)
      const preAuth = localStorage.getItem("happnix_preauth_token");
      if (preAuth) {
        headers["X-HappniX-PreAuth"] = preAuth;
      }

      // Attach JWT Bearer token if we have one (post-login calls)
      const jwt = localStorage.getItem("happnix_access_token");
      if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`;
      }

      const response = await fetch(buildApiUrl(AUTH_ENDPOINT), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ actionItem, ...data })
      });

      let body = {};
      try {
        body = await response.json();
      } catch (_error) {
        body = {};
      }

      // Save any pre-auth token returned in the response body
      if (body.preAuthToken) {
        localStorage.setItem("happnix_preauth_token", body.preAuthToken);
      }

      if (!response.ok) {
        throw new Error(body.message || "Request failed.");
      }
      return body;
    }

    setDobMax();

    const checkUsernameBtn = document.getElementById("checkUsernameBtn");
    const usernameInput = document.getElementById("username");
    const usernameStatus = document.getElementById("usernameStatus");

    if (checkUsernameBtn) {
      checkUsernameBtn.addEventListener("click", async () => {
        const usernameVal = usernameInput.value.trim();
        if (!usernameVal) {
          usernameStatus.style.color = "var(--error-red, red)";
          usernameStatus.textContent = "Please enter a username first.";
          return;
        }

        const originalText = checkUsernameBtn.textContent;
        checkUsernameBtn.disabled = true;
        checkUsernameBtn.textContent = "...";
        usernameStatus.textContent = "";

        try {
          const result = await callAuthAction("CheckUsername", { username: usernameVal });
          if (result.available) {
            usernameStatus.style.color = "var(--success-green, green)";
            usernameStatus.textContent = "Username is available!";
          } else {
            usernameStatus.style.color = "var(--error-red, red)";
            let msg = "Username is already taken.";
            if (result.suggestions && result.suggestions.length > 0) {
              msg += " Suggestions: " + result.suggestions.join(", ");
            }
            usernameStatus.textContent = msg;
          }
        } catch (err) {
          usernameStatus.style.color = "var(--error-red, red)";
          usernameStatus.textContent = err.message || "Failed to check username.";
        } finally {
          checkUsernameBtn.disabled = false;
          checkUsernameBtn.textContent = originalText;
        }
      });
    }

    async function hydrateVerifiedMobile() {
      const mobileInput = document.getElementById("mobile");
      if (!mobileInput) return;
      try {
        const result = await callAuthAction("GetSignupSessionDetails");
        mobileInput.value = result.formattedMobile || result.mobile || "";
      } catch (err) {
        error.textContent = err.message || "Verify mobile OTP again before continuing.";
        submitBtn.disabled = true;
      }
    }

    hydrateVerifiedMobile();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      success.textContent = "";
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        const passwordValue = document.getElementById("password").value.trim();
        if (!isStrongPassword(passwordValue)) {
          throw new Error("Password must have uppercase, lowercase, number, special character, and minimum 8 characters.");
        }

        const result = await callAuthAction("RegisterUserDetails", {
          fullName: document.getElementById("fullName").value.trim(),
          username: document.getElementById("username").value.trim(),
          password: passwordValue,
          sex: document.getElementById("sex").value,
          dateOfBirth: document.getElementById("dob").value,
          email: document.getElementById("email").value.trim(),
          govId: document.getElementById("govId").value.trim()
        });

        success.textContent = result.message || "Saved.";
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
      } catch (err) {
        error.textContent = err.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Continue";
      }
    });

(function () {
      function openHashTarget() {
        const hash = window.location.hash;
        if (!hash || hash.length < 2) return;
        const targetId = decodeURIComponent(hash.slice(1));
        const target = document.getElementById(targetId);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof target.focus === "function") {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      }

      window.routeToId = function (targetId, path) {
        if (!targetId) return;
        const encoded = encodeURIComponent(targetId);
        if (path && path !== window.location.pathname) {
          window.location.href = `${path}#${encoded}`;
          return;
        }
        window.location.hash = encoded;
      };

      window.addEventListener("hashchange", openHashTarget);
      window.addEventListener("DOMContentLoaded", openHashTarget);
    })();

