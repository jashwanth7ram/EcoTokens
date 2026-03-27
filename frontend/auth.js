// Browser-side signup logic for signup.html

async function signupUser() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    showFormMessage("Please fill in all fields.", true);
    return;
  }

  if (password.length < 6) {
    showFormMessage("Password must be at least 6 characters.", true);
    return;
  }

  try {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5050' : '';
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showFormMessage(data.msg || "Signup failed.", true);
      return;
    }

    showFormMessage("Account created! Redirecting to login...", false);
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (err) {
    console.error(err);
    showFormMessage("Server error. Is the backend running?", true);
  }
}

// ========================
// Google Auth Logic
// ========================
async function handleGoogleAuth(response) {
  try {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5050' : '';
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential }),
    });

    const data = await res.json();

    if (!res.ok) {
      showFormMessage(data.msg || "Google Sign-In failed.", true);
      return;
    }

    // Store token and user data
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showFormMessage("Google login successful! Redirecting...", false);
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } catch (err) {
    console.error(err);
    showFormMessage("Server error during Google auth.", true);
  }
}

function showFormMessage(msg, isError) {
  let el = document.getElementById("formMessage");
  if (!el) {
    el = document.createElement("div");
    el.id = "formMessage";
    el.style.cssText =
      "margin-top:16px; padding:12px 16px; border-radius:8px; text-align:center; font-size:14px; font-family:'Manrope',sans-serif; transition: all 0.3s ease;";
    // Insert before the signup button
    const btn = document.getElementById("signupButton");
    if (btn) btn.parentNode.insertBefore(el, btn.nextSibling);
    else document.querySelector("form, .form-area, body").appendChild(el);
  }
  el.textContent = msg;
  el.style.background = isError
    ? "rgba(147,0,10,0.3)"
    : "rgba(78,222,163,0.2)";
  el.style.color = isError ? "#ffb4ab" : "#4edea3";
  el.style.border = isError
    ? "1px solid rgba(255,180,171,0.3)"
    : "1px solid rgba(78,222,163,0.3)";
}
