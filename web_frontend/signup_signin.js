const bootConfigEl = document.getElementById('signup-signin-boot-config');
let bootConfig = {};
if (bootConfigEl) {
  try {
    bootConfig = JSON.parse(bootConfigEl.textContent || '{}');
  } catch (error) {
    bootConfig = {};
  }
}
const views = {
      mobileForm: document.getElementById("mobileForm"),
      mobileOtpForm: document.getElementById("mobileOtpForm"),
      userPassForm: document.getElementById("userPassForm")
    };

    const mobileNumber = document.getElementById("mobileNumber");
    const mobileSendBtn = document.getElementById("mobileSendBtn");
    const mobileOtpSub = document.getElementById("mobileOtpSub");
    const mobileOtpCode = document.getElementById("mobileOtpCode");
    const mobileVerifyBtn = document.getElementById("mobileVerifyBtn");
    const mobileResendBtn = document.getElementById("mobileResendBtn");

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const passwordToggle = document.getElementById("passwordToggle");
    const userPassLoginBtn = document.getElementById("userPassLoginBtn");

    const mobileError = document.getElementById("mobileError");
    const mobileSuccess = document.getElementById("mobileSuccess");
    const mobileOtpError = document.getElementById("mobileOtpError");
    const mobileOtpSuccess = document.getElementById("mobileOtpSuccess");
    const userPassError = document.getElementById("userPassError");
    const userPassSuccess = document.getElementById("userPassSuccess");
    const newUserPrompt = document.getElementById("newUserPrompt");
    const fetchAuthDevStatusBtn = document.getElementById("fetchAuthDevStatusBtn");
    const authDevStatusOutput = document.getElementById("authDevStatusOutput");
    const authApiResponse = document.getElementById("authApiResponse");
    const csrfTokenTemplate = bootConfig.csrfToken || "";

    // ─── Single API endpoint — all auth actions go here ─────────────
    const AUTH_ENDPOINT = "/api/auth";

    // ─── Pre-auth token storage ───────────────────────────────────────
    // Carries OTP session state between SendMobileOtp → VerifyMobileOtp
    // → RegisterUserDetails.
    function savePreAuthToken(token) {
      if (token) localStorage.setItem("happnix_preauth_token", token);
    }

    function getPreAuthToken() {
      return localStorage.getItem("happnix_preauth_token");
    }

    function clearPreAuthToken() {
      localStorage.removeItem("happnix_preauth_token");
    }

    // ─── JWT token storage (post-login) ──────────────────────────────
    // Stored in localStorage so they survive page refreshes.
    const TOKEN_KEY     = "happnix_access_token";
    const REFRESH_KEY   = "happnix_refresh_token";
    const SESSION_KEY   = "happnix_session_id";

    function saveTokens({ accessToken, refreshToken, sessionId }) {
      if (accessToken)  localStorage.setItem(TOKEN_KEY,   accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
      if (sessionId)    localStorage.setItem(SESSION_KEY, sessionId);
    }

    function getAccessToken() {
      return localStorage.getItem(TOKEN_KEY) || null;
    }

    function clearTokens() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(SESSION_KEY);
    }

    document.addEventListener('click', (event) => {
      const actionEl = event.target.closest('[data-action]');
      if (!actionEl) return;
      if (actionEl.dataset.action === 'reload-page') {
        window.location.reload();
      }
    });

    let mobileContext = { mobile: "" };

    function buildApiUrl(path) {
      const runtimeConfig = window.HAPPNIX_RUNTIME_CONFIG || {};
      if (typeof runtimeConfig.buildApiUrl === "function") {
        return runtimeConfig.buildApiUrl(path);
      }
      const base = String(runtimeConfig.apiBaseUrl || "").replace(/\/$/, "");
      return base ? `${base}${path}` : path;
    }

    function normalizeMobile(value) {
      return value.replace(/\D/g, "");
    }

    function isValidMobile(value) {
      return /^\d{10}$/.test(normalizeMobile(value));
    }

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

    /**
     * Send a request to the auth Lambda with an actionItem.
     *
     * Pre-auth token (OTP/signup flow):
     *   Automatically attached as X-HappniX-PreAuth header if we have one in memory.
     *   The response's preAuthToken is saved back into memory automatically.
     *
     * JWT token (post-login authenticated calls):
     *   Automatically attached as Authorization: Bearer header if present in localStorage.
     */
    async function callAuthAction(actionItem, data = {}) {
      const headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken()
      };

      // Attach pre-auth token if we have one (OTP/signup flow)
      const preAuth = getPreAuthToken();
      if (preAuth) {
        headers["X-HappniX-PreAuth"] = preAuth;
      }

      // Attach JWT Bearer token if we have one (post-login calls)
      const jwt = getAccessToken();
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
        savePreAuthToken(body.preAuthToken);
      }

      // Save JWT tokens returned by LoginWithPassword
      if (body.accessToken || body.refreshToken) {
        saveTokens({
          accessToken:  body.accessToken,
          refreshToken: body.refreshToken,
          sessionId:    body.sessionId
        });
      }

      if (!response.ok) {
        // Bug 3 fix: surface the status code so callers can react to 401 specifically
        const err = new Error(body.message || "Request failed. Please try again.");
        err.status = response.status;
        err.body   = body;
        throw err;
      }

      return body;
    }

    function renderDevJson(target, payload) {
      if (!target) return;
      target.textContent = JSON.stringify(payload, null, 2);
    }

    function resetMessages() {
      mobileError.textContent = "";
      mobileSuccess.textContent = "";
      mobileOtpError.textContent = "";
      mobileOtpSuccess.textContent = "";
      userPassError.textContent = "";
      userPassSuccess.textContent = "";
      newUserPrompt.style.display = "none";
    }

    function setPasswordVisibility(isVisible) {
      if (!password || !passwordToggle) return;
      password.type = isVisible ? "text" : "password";
      passwordToggle.classList.toggle("is-visible", isVisible);
      passwordToggle.setAttribute("aria-pressed", String(isVisible));
      passwordToggle.setAttribute("aria-label", isVisible ? "Hide password" : "Show password");
    }

    function setButtonLoading(button, loading, defaultLabel, loadingLabel) {
      button.disabled = loading;
      button.textContent = loading ? loadingLabel : defaultLabel;
    }

    function showView(viewId) {
      Object.values(views).forEach((view) => view.classList.remove("active"));
      views[viewId].classList.add("active");
      resetMessages();
    }

    /**
     * Navigate to the Sign-in with Username/Email view.
     * Used when an existing user has been identified via OTP — they must now
     * complete login with their password to get a JWT token.
     *
     * Shows an informational message so the user understands why they were redirected.
     */
    function redirectToPasswordLogin(message) {
      showView("userPassForm");
      if (message) {
        // Show the message in the userPass success area so it's clearly visible
        userPassSuccess.textContent = message;
      }
    }

    /**
     * Handle an auth result from the backend.
     *
     * IMPORTANT — does NOT blindly follow redirectUrl for existing users.
     * Instead:
     *   - existing user identified via OTP → stay on page, switch to password form
     *   - new user after OTP → follow redirectUrl to signup details page
     *   - successful LoginWithPassword → follow redirectUrl to home page
     *   - any other redirectUrl → follow it
     */
    function handleAuthResult(result, successTextTarget) {
      const message = result.message || "Authentication successful.";
      if (successTextTarget) successTextTarget.textContent = message;

      // Existing user identified via OTP: do NOT redirect away.
      // Switch to the password login form on this page instead.
      if (result.userStatus === "existing" && !result.accessToken) {
        // No JWT means we came from OTP verify, not from LoginWithPassword.
        // Clear the pre-auth token (no longer needed) and ask them to log in.
        clearPreAuthToken();
        redirectToPasswordLogin(
          "✅ Mobile verified. Please sign in with your username or email and password."
        );
        return;
      }

      // Successful JWT login — only now do we go to home page.
      if (result.accessToken && result.redirectUrl) {
        window.location.replace(result.redirectUrl);
        return;
      }

      // New user after OTP — follow redirectUrl to signup details.
      if (result.userStatus === "new" && result.redirectUrl) {
        window.location.replace(result.redirectUrl);
        return;
      }

      // Generic redirect (profile setup complete, etc.)
      if (result.redirectUrl) {
        window.location.replace(result.redirectUrl);
        return;
      }

      if (result.justActivated) {
        const modal = document.getElementById("activationModal");
        const enjoyBtn = document.getElementById("activationEnjoyBtn");
        if (modal && enjoyBtn) {
          modal.style.display = "block";
          enjoyBtn.onclick = () => window.location.replace("/home_page.html");
        } else {
          window.location.replace("/home_page.html");
        }
      }
    }

    function openMobileOtpView(mobile) {
      mobileContext.mobile = normalizeMobile(mobile);
      mobileOtpSub.textContent = `Enter the OTP sent to ${mobileContext.mobile}.`;
      mobileOtpCode.value = "";
      resetMessages();
      showView("mobileOtpForm");
    }

    document.getElementById("goUserPassBtn").addEventListener("click", () => showView("userPassForm"));
    document.getElementById("backToMobileFromPassBtn").addEventListener("click", () => showView("mobileForm"));
    document.getElementById("goNewUserBtn").addEventListener("click", () => showView("mobileForm"));
    document.getElementById("mobileBackBtn").addEventListener("click", () => showView("mobileForm"));
    if (passwordToggle) {
      setPasswordVisibility(false);
      passwordToggle.addEventListener("click", () => {
        const isVisible = password.type === "password";
        setPasswordVisibility(isVisible);
      });
    }

    // ─── Send Mobile OTP ────────────────────────────────────────────
    views.mobileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const mobile = mobileNumber.value.trim();

      if (!mobile) {
        mobileError.textContent = "Please enter your mobile number.";
        return;
      }

      if (!isValidMobile(mobile)) {
        mobileError.textContent = "Please enter a valid 10-digit mobile number.";
        return;
      }

      resetMessages();
      setButtonLoading(mobileSendBtn, true, "Send OTP", "Sending...");

      try {
        const result = await callAuthAction("SendMobileOtp", {
          mobile: normalizeMobile(mobile)
        });
        // preAuthToken is saved automatically inside callAuthAction
        renderDevJson(authApiResponse, result);
        openMobileOtpView(mobile);
        mobileOtpSuccess.textContent = "OTP sent successfully.";

        // Show debug OTP if backend returned one (dev/qa only)
        if (result.debugOtp) {
          mobileOtpSuccess.textContent += ` (Debug OTP: ${result.debugOtp})`;
          // Auto-fill the OTP input for convenience in development
          if (mobileOtpCode) mobileOtpCode.value = result.debugOtp;
        }
      } catch (error) {
        mobileError.textContent = error.message;
        renderDevJson(authApiResponse, { message: error.message });
      } finally {
        setButtonLoading(mobileSendBtn, false, "Send OTP", "Sending...");
      }
    });

    // ─── Verify Mobile OTP ──────────────────────────────────────────
    views.mobileOtpForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const otp = mobileOtpCode.value.trim();

      if (!/^\d{6}$/.test(otp)) {
        mobileOtpError.textContent = "Please enter a valid 6-digit OTP.";
        return;
      }

      if (!mobileContext.mobile) {
        mobileOtpError.textContent = "Mobile session expired. Please request OTP again.";
        return;
      }

      resetMessages();
      setButtonLoading(mobileVerifyBtn, true, "Verify OTP", "Verifying...");

      try {
        const result = await callAuthAction("VerifyMobileOtp", {
          mobile: mobileContext.mobile,
          otp
        });
        // preAuthToken updated automatically inside callAuthAction
        renderDevJson(authApiResponse, result);
        handleAuthResult(result, mobileOtpSuccess);
      } catch (error) {
        // Bug 3 fix: if unauthorized, show the message and DO NOT redirect
        if (error.status === 401) {
          mobileOtpError.textContent = "Unauthorized. Please try again.";
        } else {
          mobileOtpError.textContent = error.message;
        }
        renderDevJson(authApiResponse, { message: error.message, status: error.status });
      } finally {
        setButtonLoading(mobileVerifyBtn, false, "Verify OTP", "Verifying...");
      }
    });

    // ─── Resend Mobile OTP ──────────────────────────────────────────
    mobileResendBtn.addEventListener("click", async () => {
      if (!mobileContext.mobile) {
        mobileOtpError.textContent = "Mobile session expired. Please request OTP again.";
        return;
      }

      resetMessages();
      setButtonLoading(mobileResendBtn, true, "Resend OTP", "Resending...");

      try {
        const result = await callAuthAction("ResendMobileOtp", {
          mobile: mobileContext.mobile
        });
        // preAuthToken updated automatically inside callAuthAction
        renderDevJson(authApiResponse, result);
        mobileOtpSuccess.textContent = `OTP resent to ${mobileContext.mobile}.`;

        if (result.debugOtp) {
          mobileOtpSuccess.textContent += ` (Debug OTP: ${result.debugOtp})`;
          if (mobileOtpCode) mobileOtpCode.value = result.debugOtp;
        }
      } catch (error) {
        mobileOtpError.textContent = error.message;
        renderDevJson(authApiResponse, { message: error.message });
      } finally {
        setButtonLoading(mobileResendBtn, false, "Resend OTP", "Resending...");
      }
    });

    // ─── Login with Password ────────────────────────────────────────
    views.userPassForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const usernameValue = username.value.trim();
      const passwordValue = password.value.trim();

      if (!usernameValue || !passwordValue) {
        userPassError.textContent = "Please enter username and password.";
        return;
      }

      resetMessages();
      setButtonLoading(userPassLoginBtn, true, "Sign-in", "Signing in...");

      try {
        const result = await callAuthAction("LoginWithPassword", {
          identifier: usernameValue,
          password:   passwordValue
        });
        // JWT tokens are saved automatically inside callAuthAction.
        // handleAuthResult checks for accessToken before redirecting to home.
        renderDevJson(authApiResponse, result);
        handleAuthResult(result, userPassSuccess);
      } catch (error) {
        // Bug 3 fix: 401 = invalid credentials, show error, stay on page
        if (error.status === 401) {
          userPassError.textContent = "Unauthorized. Invalid username/email or password.";
          clearTokens(); // defensive — clear any partial token state
        } else {
          userPassError.textContent = error.message;
        }
        renderDevJson(authApiResponse, { message: error.message, status: error.status });
        if (error.message && error.message.toLowerCase().includes("invalid username/email or password")) {
          newUserPrompt.style.display = "flex";
        }
      } finally {
        setButtonLoading(userPassLoginBtn, false, "Sign-in", "Signing in...");
      }
    });

    // ─── Dev Auth Status ────────────────────────────────────────────
    if (fetchAuthDevStatusBtn) {
      fetchAuthDevStatusBtn.addEventListener("click", async () => {
        setButtonLoading(fetchAuthDevStatusBtn, true, "Check Backend Status", "Checking...");
        try {
          const result = await callAuthAction("GetDevAuthStatus");
          renderDevJson(authDevStatusOutput, result);
        } catch (error) {
          renderDevJson(authDevStatusOutput, { message: error.message });
        } finally {
          setButtonLoading(fetchAuthDevStatusBtn, false, "Check Backend Status", "Checking...");
        }
      });
    }

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
      window.addEventListener("DOMContentLoaded", () => {
        openHashTarget();
        if (localStorage.getItem("happnix_refresh_token")) {
          window.location.href = "/home_page.html";
        }
      });
    })();
