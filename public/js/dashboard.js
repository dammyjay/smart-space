// Connect to WebSocket
// const socket = new WebSocket("ws://" + window.location.host);
const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(protocol + window.location.host);

// UI Buttons
const toggles = document.querySelectorAll(".toggle-btn");

// Store status
let deviceOnline = false;
let deviceId = null;
let deviceStates = [false, false, false, false];

socket.onopen = () => {
  console.log("✅ WebSocket connected");
};

loadInitialDeviceState();



// socket.onmessage = (event) => {
//   try {
//     const data = JSON.parse(event.data);
//     if (data.channels) {
//       console.log("📡 WebSocket update received:", data.channels);
//       deviceStates = data.channels;
//       updateUI();
//     }
//   } catch (err) {
//     console.error("❌ Error parsing WebSocket data:", err);
//   }
// };

// socket.onmessage = (event) => {
//   try {
//     const data = JSON.parse(event.data);
//     if (!data.channels) return;

//     // Accept array [true,false,...] OR object {"0":true,"1":false,...}
//     if (Array.isArray(data.channels)) {
//       deviceStates = data.channels;
//     } else {
//       deviceStates = [0, 1, 2, 3].map((i) => !!data.channels[i]);
//     }
//     updateUI();
//   } catch (err) {
//     console.error("❌ Error parsing WebSocket data:", err);
//   }
// };



// =============================
// Load devices list
// =============================
// async function loadInitialDeviceState() {
//   try {
//     const res = await fetch("/devices/my-devices");
//     if (!res.ok) throw new Error(`HTTP ${res.status}`);
//     const devices = await res.json();

//     deviceSelector.innerHTML = "";
//     devices.forEach((dev) => {
//       const option = document.createElement("option");
//       option.value = dev.device_id;
//       option.textContent = dev.name || dev.device_id;
//       if (dev.is_default) option.selected = true;
//       deviceSelector.appendChild(option);
//     });

//     if (devices.length > 0) {
//       deviceId = deviceSelector.value;
//       fetchDeviceStatus(deviceId);
//     } else {
//       document.getElementById("device-status").textContent =
//         "⚠️ No devices registered";
//     }
//   } catch (err) {
//     console.error("❌ Failed to load devices:", err);
//   }
// }

// deviceSelector.addEventListener("change", (e) => {
//   deviceId = e.target.value;
//   fetchDeviceStatus(deviceId);
// });

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    if (data.people_count !== undefined) {
      document.getElementById(
        "people-count"
      ).textContent = `👥 People: ${data.people_count}`;
    }

    if (data.channels) {
      deviceStates = Array.isArray(data.channels)
        ? data.channels
        : [0, 1, 2, 3].map((i) => !!data.channels[i]);
      updateUI();
    }
  } catch (err) {
    console.error("❌ Error parsing WebSocket data:", err);
  }
};


async function loadInitialDeviceState() {
  try {
    const res = await fetch("/devices/my-status");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    console.log("📡 Initial device status:", data);

    deviceId = data.device_id || null;
    deviceOnline = !!data.online;

    const statusEl = document.getElementById("device-status");
    if (!deviceId) {
      statusEl.textContent = "⚠️ No device registered";
    } else if (deviceOnline) {
      statusEl.textContent = `🟢 Device (${deviceId}) is online`;
    } else {
      statusEl.textContent = `🔴 Device (${deviceId}) is offline`;
    }

    if (Array.isArray(data.channels) && data.channels.length > 0) {
      deviceStates = data.channels.map((c) => !!c.status);
    } else {
      deviceStates = [false, false, false, false];
    }
    updateUI();
  } catch (err) {
    console.error("❌ Failed to load initial device state:", err);
  }
}



// async function loadInitialDeviceState() {
//   try {
//     const res = await fetch("/devices/my-status");
//     if (!res.ok) throw new Error(`HTTP ${res.status}`);
//     const data = await res.json();

//     console.log("📡 Initial device status:", data);

//     if (data.channels && data.channels.length > 0) {
//       deviceStates = data.channels.map((c) => c.status);
//       updateUI();
//     }
//   } catch (err) {
//     console.error("❌ Failed to load initial device state:", err);
//   }
// }


// Fetch notifications and update UI


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

// function toggleNotifications() {
//   const dropdown = document.getElementById("notif-dropdown");
//   dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
// }

// function toggleProfileMenu() {
//   const menu = document.getElementById("profileMenu");
//   menu.style.display = menu.style.display === "flex" ? "none" : "flex";
// }

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("hamburger-menu")
    .addEventListener("click", toggleMobileMenu);
});

// function toggleMobileMenu() {
//   const sidebar = document.getElementById("mobile-sidebar");
//   sidebar.classList.toggle("open");

//   // Add listener to detect outside clicks
//   if (sidebar.classList.contains("open")) {
//     document.addEventListener("click", handleOutsideClick);
//   } else {
//     document.removeEventListener("click", handleOutsideClick);
//   }
// }

// function handleOutsideClick(event) {
//   const sidebar = document.getElementById("mobile-sidebar");
//   const hamburger = document.querySelector(".hamburger");

//   if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
//     sidebar.classList.remove("open");
//     document.removeEventListener("click", handleOutsideClick);
//   }
// }


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
      document.querySelector("#edit-profile-form [name='camera_url']").value =
        user.camera_url;
      document.getElementById("edit-profile-modal").style.display = "flex";
      document.getElementById("edit-profile-modal").classList.add("show");
    });
}

function closeEditModal() {
  document.getElementById("edit-profile-modal").style.display = "none";
  document.getElementById("edit-profile-modal").classList.remove("show");

}

// Close modal when clicking outside
window.addEventListener("click", function (e) {
  const modal = document.getElementById("edit-profile-modal");
  const box = document.querySelector(".modal-box");

  if (modal.style.display === "flex" && !box.contains(e.target)) {
    closeEditModal();
  }
});


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


async function fetchDeviceStatus() {
  try {
    // Try to get the selected device from the selector, fallback to default
    const selector = document.getElementById("device-selector");
    let selectedId = selector ? selector.value : null;

    // If no selector or value, fallback to /devices/my-status
    let res, data;
    if (selectedId) {
      res = await fetch(`/devices/status/${selectedId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } else {
      res = await fetch("/devices/my-status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    }

    deviceId = data.device_id;
    deviceOnline = !!data.online;

    // Update device status text
    const statusEl = document.getElementById("device-status");
    if (!deviceId) {
      statusEl.textContent = "⚠️ No device registered";
      console.log ("⚠️ No device registered");
    } else if (deviceOnline) {
      statusEl.textContent = `🟢 Device (${deviceId}) is online`;
      console.log(`🟢 Device (${deviceId}) is online`);
    } else {
      statusEl.textContent = `🔴 Device (${deviceId}) is offline`;
      console.log(`🔴 Device (${deviceId}) is offline`);
    }

    // Update channel states if returned
    if (data.channels && data.channels.length > 0) {
      deviceStates = data.channels.map(c => c.status);
    }
    updateUI();

  } catch (err) {
    console.error("❌ Error fetching device status:", err);
    document.getElementById("device-status").textContent = "⚠️ Failed to load status";

  }
}



// function setManualCameraUrl() {
//   const url = document.getElementById("manual-camera-url").value.trim();
//   if (!url) return alert("Please enter a URL");

//   document.getElementById("live-stream").src = url;
//   document.getElementById("camera-status").textContent = "📹 Using manual URL";
//   document.getElementById("camera-status").style.color = "blue";
// }

function setManualCameraUrl() {
  const url = document.getElementById("manual-camera-url").value.trim();
  const liveStreamEl = document.getElementById("live-stream");
  const statusEl = document.getElementById("camera-status");

  if (!url) {
    alert("Please enter a stream URL");
    return;
  }

  liveStreamEl.src = url;
  statusEl.textContent = "📹 Using manual camera URL";
  statusEl.style.color = "blue";
}

// Auto-load from DB/`/camera-url` at page load
function initCameraFromDB() {
  fetch("/camera-url")
    .then((res) => res.json())
    .then((data) => {
      const liveStreamEl = document.getElementById("live-stream");
      const statusEl = document.getElementById("camera-status");

      if (data.url) {
        liveStreamEl.src = data.url;
        statusEl.textContent = "📹 Camera online";
        statusEl.style.color = "green";
      } else {
        statusEl.textContent = "❌ Camera offline";
        statusEl.style.color = "red";
      }
    })
    .catch((err) => {
      console.error("Camera fetch error:", err);
      document.getElementById("camera-status").textContent =
        "⚠️ Error loading camera";
      document.getElementById("camera-status").style.color = "orange";
    });
}

document.addEventListener("DOMContentLoaded", initCameraFromDB);


function updateUI() {
  toggles.forEach((btn, index) => {
    const on = !!deviceStates[index];
    if (!deviceOnline) {
      btn.textContent = `Channel ${index + 1} (Offline)`;
      console.log(`Channel ${index + 1} (Offline)`);
      btn.className = "toggle-btn off";
    } else {
      btn.textContent = on
        ? `Turn OFF Channel ${index + 1}`
        : `Turn ON Channel ${index + 1}`;
      btn.className = on ? "toggle-btn on" : "toggle-btn off";
      console.log(`Channel ${index + 1} is ${on ? "ON" : "OFF"}`);
    }
  });
}


// Handle toggle button click
toggles.forEach((btn, index) => {
  btn.addEventListener("click", async () => {
    if (!deviceOnline) {
      alert("❌ Device is offline. Cannot toggle.");
      return;
    }

    try {
      const res = await fetch("/devices/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelIndex: index })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      deviceStates[index] = data.status;
      updateUI();

    } catch (err) {
      console.error("❌ Toggle error:", err);
    }
  });
});


// Load immediately + update every 10s
document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceStatus();
  setInterval(fetchDeviceStatus, 3000);
});

// document.addEventListener("DOMContentLoaded", () => {
//   fetchDeviceStatus(); // Initial load
//   setInterval(fetchDeviceStatus, 30000); // Refresh every 30 seconds
// });


// Toggle profile menu

// ===== PROFILE MENU =====
function toggleProfileMenu() {
  const menu = document.getElementById("profileMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";

  if (menu.style.display === "flex") {
    document.addEventListener("click", closeProfileMenuOnOutsideClick);
  } else {
    document.removeEventListener("click", closeProfileMenuOnOutsideClick);
  }
}

function closeProfileMenuOnOutsideClick(event) {
  const menu = document.getElementById("profileMenu");
  const profileIcon = document.querySelector(".profile-icon");

  if (!menu.contains(event.target) && !profileIcon.contains(event.target)) {
    menu.style.display = "none";
    document.removeEventListener("click", closeProfileMenuOnOutsideClick);
  }
}

// Close profile menu after selecting a device
document.getElementById("device-selector").addEventListener("change", () => {
  document.getElementById("profileMenu").style.display = "none";
  document.removeEventListener("click", closeProfileMenuOnOutsideClick);
});


// ===== NOTIFICATION MENU =====
function toggleNotifications() {
  const dropdown = document.getElementById("notif-dropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";

  if (dropdown.style.display === "block") {
    document.addEventListener("click", closeNotifOnOutsideClick);
  } else {
    document.removeEventListener("click", closeNotifOnOutsideClick);
  }
}

function closeNotifOnOutsideClick(event) {
  const dropdown = document.getElementById("notif-dropdown");
  const notifIcon = document.querySelector(".notif-wrapper");

  if (!dropdown.contains(event.target) && !notifIcon.contains(event.target)) {
    dropdown.style.display = "none";
    document.removeEventListener("click", closeNotifOnOutsideClick);
  }
}

function toggleMobileMenu() {
  const sidebar = document.getElementById("mobile-sidebar");
  sidebar.classList.toggle("open");

  // If opened, listen for outside click
  if (sidebar.classList.contains("open")) {
    document.addEventListener("click", handleOutsideClick);
    attachSidebarLinkEvents();
  } else {
    document.removeEventListener("click", handleOutsideClick);
  }
}

function handleOutsideClick(event) {
  const sidebar = document.getElementById("mobile-sidebar");
  const hamburger = document.querySelector(".hamburger");

  // Close if click is outside both sidebar and hamburger button
  if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
    sidebar.classList.remove("open");
    document.removeEventListener("click", handleOutsideClick);
  }
}

function attachSidebarLinkEvents() {
  const links = document.querySelectorAll("#mobile-sidebar a");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      document.getElementById("mobile-sidebar").classList.remove("open");
      document.removeEventListener("click", handleOutsideClick);
    });
  });
}

// async function checkCameraStream(url) {
//   try {
//     const res = await fetch(url, { method: "HEAD" });

//     if (res.ok) {
//       document.getElementById("live-stream").src = url;
//       document.getElementById("camera-status").textContent = "📹 Camera online";
//       document.getElementById("camera-status").style.color = "green";
//     } else {
//       throw new Error("Stream not OK");
//     }
//   } catch (err) {
//     document.getElementById("live-stream").src = "";
//     document.getElementById("camera-status").textContent = "❌ Camera offline";
//     document.getElementById("camera-status").style.color = "red";
//   }
// }

// document.addEventListener("DOMContentLoaded", () => {
//   // Use your Pi's actual streaming URL here
//   const cameraUrl = "http://<YOUR-PI-IP-OR-URL>:8081/?action=stream";

//   // First check immediately
//   checkCameraStream(cameraUrl);

//   // Then check every 10 seconds
//   setInterval(() => {
//     checkCameraStream(cameraUrl);
//   }, 10000);
// });


async function checkCameraStream(url) {
  const cameraStatusEl = document.getElementById("camera-status");
  const liveStreamEl = document.getElementById("live-stream");

  // Always reset UI first
  cameraStatusEl.textContent = "⏳ Checking camera...";
  cameraStatusEl.style.color = "orange";
  liveStreamEl.src = "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      liveStreamEl.src = url;
      cameraStatusEl.textContent = "📹 Camera online";
      cameraStatusEl.style.color = "green";
    } else {
      throw new Error("Stream not OK");
    }
  } catch (err) {
    cameraStatusEl.textContent = "❌ Camera offline";
    cameraStatusEl.style.color = "red";
    liveStreamEl.src = "";
  }
}

// function initCameraCheck() {
//   fetch("/camera-url")
//     .then((res) => res.json())
//     .then((data) => {
//       if (!data.url) {
//         throw new Error("No camera URL provided by server");
//       }
//       const cameraUrl = data.url;
//       checkCameraStream(cameraUrl);
//       setInterval(() => {
//         checkCameraStream(cameraUrl);
//       }, 10000); // every 10 seconds
//     })
//     .catch((err) => {
//       console.error("❌ Failed to get camera URL:", err);
//       const cameraStatusEl = document.getElementById("camera-status");
//       cameraStatusEl.textContent = "⚠️ Error getting camera URL";
//       cameraStatusEl.style.color = "red";
//     });
// }

function initCameraCheck() {
  fetch("/camera-url")
    .then((res) => res.json())
    .then((data) => {
      if (!data.url) {
        // Camera offline
        document.getElementById("live-stream").src = "";
        document.getElementById("camera-status").textContent =
          "❌ Camera offline";
        document.getElementById("camera-status").style.color = "red";
        return;
      }

      // Camera online → load stream
      const cameraUrl = data.url;
      document.getElementById("live-stream").src = cameraUrl;
      document.getElementById("camera-status").textContent = "📹 Camera online";
      document.getElementById("camera-status").style.color = "green";

      // Keep checking every 10 seconds
      setInterval(() => {
        fetch("/camera-url")
          .then((res) => res.json())
          .then((update) => {
            if (!update.url) {
              document.getElementById("live-stream").src = "";
              document.getElementById("camera-status").textContent =
                "❌ Camera offline";
              document.getElementById("camera-status").style.color = "red";
            } else if (
              document.getElementById("live-stream").src !== update.url
            ) {
              document.getElementById("live-stream").src = update.url;
              document.getElementById("camera-status").textContent =
                "📹 Camera online";
              document.getElementById("camera-status").style.color = "green";
            }
          })
          .catch(() => {
            document.getElementById("live-stream").src = "";
            document.getElementById("camera-status").textContent =
              "⚠️ Error checking camera";
            document.getElementById("camera-status").style.color = "orange";
          });
      }, 10000);
    })
    .catch((err) => {
      console.error("❌ Failed to get camera URL:", err);
      document.getElementById("camera-status").textContent =
        "⚠️ Error getting camera URL";
      document.getElementById("camera-status").style.color = "orange";
    });
}

// document.addEventListener("DOMContentLoaded", initCameraCheck);




document.addEventListener("DOMContentLoaded", initCameraCheck);


setInterval(fetchNotifications, 5000); // Update every 10s
fetchNotifications(); // Initial load

