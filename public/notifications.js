// Load notifications from backend API
async function loadNotifications() {
  try {
    const res = await fetch("/api/notifications", {
      method: "GET",
      credentials: "include"   // ✅ send session cookies
    });

    if (res.status === 401) {
      document.getElementById("notifications-list").innerHTML =
        "<p>Please log in to see notifications.</p>";
      return;
    }

    const data = await res.json();

    const list = document.getElementById("notifications-list");
    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = "<p>No notifications</p>";
      return;
    }

    data.forEach(n => {
      const li = document.createElement("li");
      li.className = `notification ${n.read ? "" : "unread"}`;
      li.innerHTML = `
        <span class="message">${n.message}</span>
        <span class="time">${new Date(n.time).toLocaleString()}</span>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading notifications:", err);
  }
}

// Mark all as read
async function markAllRead() {
  try {
    await fetch("/api/notifications/read", {
      method: "PUT",
      credentials: "include"   // ✅ important
    });
    loadNotifications();
  } catch (err) {
    console.error("Error marking notifications:", err);
  }
}

// Clear all notifications
async function clearAll() {
  try {
    await fetch("/api/notifications", {
      method: "DELETE",
      credentials: "include"   // ✅ important
    });
    loadNotifications();
  } catch (err) {
    console.error("Error clearing notifications:", err);
  }
}

// Event listeners
document.getElementById("markAll").addEventListener("click", markAllRead);
document.getElementById("clearAll").addEventListener("click", clearAll);

// Load on page start
loadNotifications();
