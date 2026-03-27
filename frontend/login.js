async function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5050' : '';
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    // 🔥 IMPORTANT: check BEFORE parsing JSON
    if (!res.ok) {
      const text = await res.text();
      console.error("Server response:", text);
      alert("Login failed (check credentials)");
      return;
    }

    const data = await res.json();

    // Save auth
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
// (End of login.js specific logic)

// Make handleGoogleAuth available from auth.js if loaded.
// Note: We should import auth.js in login.html directly instead.
    alert("Login successful ✅");

    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}
