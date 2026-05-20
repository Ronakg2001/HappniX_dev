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
     * All auth operations go through this single function.
     */
    async function callAuthAction(actionItem, data = {}) {
      const response = await fetch(buildApiUrl(AUTH_ENDPOINT), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken()
        },
        credentials: "include",
        body: JSON.stringify({ actionItem, ...data })
      });

      let body = {};
      try {
        body = await response.json();
      } catch (_error) {
        body = {};
      }

      if (!response.ok) {
        throw new Error(body.message || "Request failed. Please try again.");
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

    function handleAuthResult(result, successTextTarget) {
      const nextStatus = result.userStatus || result.next || "";
      const message = result.message || "Authentication successful.";
      successTextTarget.textContent = message;

      if (result.justActivated) {
        const modal = document.getElementById("activationModal");
        const enjoyBtn = document.getElementById("activationEnjoyBtn");
        if (modal && enjoyBtn) {
          modal.style.display = "block";
          enjoyBtn.onclick = () => {
            window.location.replace("/home_page.html");
          };
        } else {
          window.location.replace("/home_page.html");
        }
        return;
      }

      if (result.redirectUrl) {
        window.location.replace(result.redirectUrl);
        return;
      }

      if (nextStatus === "new") {
        successTextTarget.textContent = `${message} New user flow triggered.`;
      } else if (nextStatus === "existing") {
        successTextTarget.textContent = `${message} Existing user flow triggered.`;
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
        renderDevJson(authApiResponse, result);
        openMobileOtpView(mobile);
        mobileOtpSuccess.textContent = "OTP sent successfully.";
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
        renderDevJson(authApiResponse, result);
        handleAuthResult(result, mobileOtpSuccess);
      } catch (error) {
        mobileOtpError.textContent = error.message;
        renderDevJson(authApiResponse, { message: error.message });
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
        renderDevJson(authApiResponse, result);
        mobileOtpSuccess.textContent = `OTP resent to ${mobileContext.mobile}.`;
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
          password: passwordValue
        });
        renderDevJson(authApiResponse, result);
        handleAuthResult(result, userPassSuccess);
      } catch (error) {
        userPassError.textContent = error.message;
        renderDevJson(authApiResponse, { message: error.message });
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
      window.addEventListener("DOMContentLoaded", openHashTarget);
    })();
