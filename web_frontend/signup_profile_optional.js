const bootConfigEl = document.getElementById('signup-profile-optional-boot-config');
let bootConfig = {};
if (bootConfigEl) {
  try {
    bootConfig = JSON.parse(bootConfigEl.textContent || '{}');
  } catch (error) {
    bootConfig = {};
  }
}
const profileForm = document.getElementById("profileForm");
    const saveBtn = document.getElementById("saveBtn");
    const skipBtn = document.getElementById("skipBtn");
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

    async function submitProfile(payload, loadingText, button) {
      error.textContent = "";
      success.textContent = "";
      button.disabled = true;
      const previous = button.textContent;
      button.textContent = loadingText;

      try {
        const result = await callAuthAction("CompleteProfileSetup", payload);
        success.textContent = result.message || "Completed.";
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
      } catch (err) {
        error.textContent = err.message;
      } finally {
        button.disabled = false;
        button.textContent = previous;
      }
    }

    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      
      const fileInput = document.getElementById("profilePicture");
      const bioInput = document.getElementById("bio").value.trim();
      let profilePictureUrl = "";
      
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
          profilePictureUrl = e.target.result;
          await submitProfile(
            { skip: false, profilePictureUrl, bio: bioInput },
            "Saving...",
            saveBtn
          );
        };
        reader.readAsDataURL(file);
      } else {
        await submitProfile(
          { skip: false, profilePictureUrl: "", bio: bioInput },
          "Saving...",
          saveBtn
        );
      }
    });

    skipBtn.addEventListener("click", async () => {
      await submitProfile({ skip: true }, "Skipping...", skipBtn);
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

