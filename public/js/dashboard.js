// Connect to WebSocket
const socket = new WebSocket("ws://" + window.location.host);

// UI Buttons
const toggles = document.querySelectorAll(".toggle-btn");

// Store status
let deviceStates = [false, false, false, false];

socket.onopen = () => {
  console.log("✅ WebSocket connected");
};

loadInitialDeviceState();

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.channels) {
    deviceStates = data.channels;
    updateUI();
  }
};

async function loadInitialDeviceState() {
  const res = await fetch("/devices/status");
  const data = await res.json();
  deviceStates = data.channels;
  updateUI();
}


toggles.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    fetch("/devices/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelIndex: index }),
    })
      .then((res) => res.json())
      .then((data) => {
        deviceStates[index] = data.status;
        updateUI();
      });
  });
});

function updateUI() {
  toggles.forEach((btn, index) => {
    btn.textContent = deviceStates[index]
      ? `Turn OFF Channel ${index + 1}`
      : `Turn ON Channel ${index + 1}`;
    btn.className = deviceStates[index] ? "toggle-btn on" : "toggle-btn off";
  });
}

async function fetchNotifications() {
  const res = await fetch("/notifications");
  const data = await res.json();

  const list = document.getElementById("notif-list");
  list.innerHTML = "";
  data.reverse().forEach((notif) => {
    const li = document.createElement("li");
    li.textContent = `[${new Date(notif.time).toLocaleTimeString()}] ${notif.message}`;
    list.appendChild(li);
  });

  document.getElementById("notif-count").textContent = data.length;
}

function toggleNotifications() {
  const dropdown = document.getElementById("notif-dropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function toggleProfileMenu() {
  const menu = document.getElementById("profileMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("hamburger-menu")
    .addEventListener("click", toggleMobileMenu);
});

function toggleMobileMenu() {
  const sidebar = document.getElementById("mobile-sidebar");
  sidebar.classList.toggle("open");

  // Add listener to detect outside clicks
  if (sidebar.classList.contains("open")) {
    document.addEventListener("click", handleOutsideClick);
  } else {
    document.removeEventListener("click", handleOutsideClick);
  }
}

function handleOutsideClick(event) {
  const sidebar = document.getElementById("mobile-sidebar");
  const hamburger = document.querySelector(".hamburger");

  if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
    sidebar.classList.remove("open");
    document.removeEventListener("click", handleOutsideClick);
  }
}


function openEditProfile() {
  fetch("/profile")
    .then((res) => res.json())
    .then((user) => {
      document.querySelector("#edit-profile-form [name='full_name']").value =
        user.full_name;
      document.querySelector("#edit-profile-form [name='email']").value =
        user.email;
      document.querySelector("#edit-profile-form [name='device_id']").value =
        user.device_id;
      document.getElementById("edit-profile-modal").style.display = "flex";
      document.getElementById("edit-profile-modal").classList.add("show");

    });
}

function closeEditModal() {
  document.getElementById("edit-profile-modal").style.display = "none";
  document.getElementById("edit-profile-modal").classList.remove("show");

}

// Close modal when clicking outside
// window.addEventListener("click", function (e) {
//   const modal = document.getElementById("edit-profile-modal");
//   const box = document.querySelector(".modal-box");

//   if (modal.style.display === "flex" && !box.contains(e.target)) {
//     closeEditModal();
//   }
// });


document.getElementById("edit-profile-form").onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  const res = await fetch("/profile", {
    method: "POST",
    body: formData,
  });

  if (res.ok) {
    alert("✅ Profile updated");
    document.getElementById("edit-profile-modal").style.display = "none";
  } else {
    alert("❌ Error updating profile");
  }
};

// QR Scanner (rescan device ID)
function onScanSuccess(decodedText) {
  document.getElementById("device_id").value = decodedText;
}
const qrScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
qrScanner.render(onScanSuccess);

// Auto-close sidebar when any link is clicked
document.querySelectorAll("#mobile-sidebar a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("mobile-sidebar").classList.remove("show");
    document.removeEventListener("click", handleOutsideClick);
  });
});

// async function fetchDeviceStatus() {
//   try {
//     const res = await fetch("/devices/my-status");
//     if (!res.ok) throw new Error("Not found");

//     const { online, last_seen, device_id } = await res.json();

//     const statusText = online
//       ? `✅ Online — ${device_id}`
//       : `❌ Offline — last seen at ${new Date(last_seen).toLocaleTimeString()}`;

//     document.getElementById("device-status").textContent = statusText;
//   } catch (err) {
//     document.getElementById("device-status").textContent =
//       "❌ Unable to load device status";
//     console.error("Device status error:", err);
//   }
// }

// async function fetchDeviceStatus() {
//   try {
//     const res = await fetch("/devices/my-status");
//     const text = await res.text(); // Use text first to debug

//     console.log("Raw response:", text); // debug
//     const data = JSON.parse(text); // then parse

//     const statusText = data.online
//       ? `✅ Online — ${data.device_id}`
//       : `❌ Offline — last seen at ${new Date(
//           data.last_seen
//         ).toLocaleTimeString()}`;

//     document.getElementById("device-status").textContent = statusText;
//   } catch (err) {
//     console.error("❌ Device status fetch failed:", err);
//     document.getElementById("device-status").textContent =
//       "❌ Unable to load device status";
//   }
// }

// Function to fetch and display device status

async function fetchDeviceStatus() {
  try {
    const res = await fetch("/devices/my-status");
    const data = await res.json();

    const statusEl = document.getElementById("device-status");

    if (!data || !data.device_id) {
      statusEl.textContent = "⚠️ No device registered";
    } else if (data.online) {
      statusEl.textContent = `🟢 Device (${data.device_id}) is online`;
    } else {
      statusEl.textContent = `🔴 Device (${data.device_id}) is offline`;
    }
  } catch (err) {
    console.error("❌ Error fetching device status:", err.message);
    document.getElementById("device-status").textContent = "⚠️ Failed to load status";
  }
}


document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceStatus(); // Initial load
  setInterval(fetchDeviceStatus, 30000); // Refresh every 30 seconds
});



setInterval(fetchNotifications, 10000); // Update every 10s
fetchNotifications(); // Initial load

