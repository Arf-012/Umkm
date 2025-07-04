// ====================== CONFIGURATION ======================
const EMAILJS_CONFIG = {
  PUBLIC_KEY: "N1Klm1TongCZEgXBk",
  SERVICE_ID: "service_xvy9h4l",
  TEMPLATE_ID: "template_2bmsp8p",
  RECEIVER_EMAIL: "umkmtes0@gmail.com",
};

// ====================== CORE FUNCTIONS ======================
async function initializeEmailSystem() {
  try {
    await loadEmailJSLibrary();
    await initializeEmailJS();
    setupContactForm();
  } catch (error) {
    handleInitializationError(error);
  }
}

async function loadEmailJSLibrary() {
  return new Promise((resolve, reject) => {
    if (typeof emailjs !== "undefined") {
      return resolve();
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load EmailJS library"));
    document.head.appendChild(script);
  });
}

async function initializeEmailJS() {
  try {
    if (!EMAILJS_CONFIG.PUBLIC_KEY) {
      throw new Error("EmailJS Public Key is missing");
    }

    await emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    console.log("EmailJS initialized successfully");
  } catch (error) {
    console.error("EmailJS initialization failed:", error);
    throw error;
  }
}

function setupContactForm() {
  const form = document.getElementById("contact-me");
  if (!form) {
    throw new Error("Contact form not found in the DOM");
  }

  form.addEventListener("submit", handleFormSubmit);
}

// ====================== FORM HANDLING ======================
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const successMsg = document.getElementById("success-message");

  // Reset UI state
  resetErrorMessages();
  btn.disabled = true;
  btn.textContent = "Mengirim...";
  successMsg.style.display = "none";

  try {
    // Validate form
    const validationResult = validateContactForm(form);
    if (!validationResult.isValid) {
      displayValidationErrors(validationResult.errors);
      return;
    }

    // Prepare and send email
    const emailParams = prepareEmailParameters(form);
    console.log("Sending email with params:", emailParams);

    const response = await sendEmail(emailParams);
    console.log("Email sent successfully:", response);

    showFeedbackMessage(
      "success",
      "Pesan berhasil dikirim! Kami akan segera merespon."
    );
    form.reset();
  } catch (error) {
    console.error("Email sending failed:", error);
    showFeedbackMessage("error", getErrorMessage(error));
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span aria-hidden="true">✉</span> Kirim Pesan';
  }
}

function validateContactForm(form) {
  const result = {
    isValid: true,
    errors: {},
  };

  // Menggunakan form.elements untuk mengakses input dengan lebih aman
  const nameValue = form.elements["name"]
    ? form.elements["name"].value.trim()
    : "";
  const emailValue = form.elements["email"]
    ? form.elements["email"].value.trim()
    : "";
  const messageValue = form.elements["message"]
    ? form.elements["message"].value.trim()
    : "";

  const fields = {
    name: {
      value: nameValue,
      minLength: 2,
      maxLength: 50,
    },
    email: {
      value: emailValue,
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    message: {
      value: messageValue,
      minLength: 1,
      maxLength: 100000,
    },
  };

  if (fields.message.value.length > fields.message.maxLength) {
    result.errors.message = `Pesan maksimal ${fields.message.maxLength} karakter`;
    result.isValid = false;
  }

  // Name validation
  if (
    fields.name.value.length < fields.name.minLength ||
    fields.name.value.length > fields.name.maxLength
  ) {
    result.errors.name = `Nama harus ${fields.name.minLength}-${fields.name.maxLength} karakter`;
    result.isValid = false;
  }

  // Email validation
  if (!fields.email.regex.test(fields.email.value)) {
    result.errors.email = "Format email tidak valid";
    result.isValid = false;
  }

  // Message validation
  if (
    fields.message.value.length < fields.message.minLength ||
    fields.message.value.length > fields.message.maxLength
  ) {
    result.errors.message = `Pesan harus ${fields.message.minLength}-${fields.message.maxLength} karakter`;
    result.isValid = false;
  }

  return result;
}

function prepareEmailParameters(form) {
  // Menggunakan form.elements untuk mengakses input dengan lebih aman
  const nameValue = form.elements["name"]
    ? form.elements["name"].value.trim()
    : "";
  const emailValue = form.elements["email"]
    ? form.elements["email"].value.trim()
    : "";
  const messageValue = form.elements["message"]
    ? form.elements["message"].value.trim()
    : "";

  return {
    from_name: nameValue,
    from_email: emailValue,
    to_email: EMAILJS_CONFIG.RECEIVER_EMAIL,
    message: messageValue,
    date: new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    website: window.location.href,
  };
}

async function sendEmail(params) {
  if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID) {
    throw new Error("EmailJS service configuration is incomplete");
  }

  return emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_ID,
    params
  );
}

// ====================== UI HELPERS ======================
function resetErrorMessages() {
  document.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });
}

function displayValidationErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  });
}

function showFeedbackMessage(type, message) {
  const successMsg = document.getElementById("success-message");
  if (!successMsg) return;

  successMsg.textContent = message;
  successMsg.style.color = type === "success" ? "#28a745" : "#dc3545";
  successMsg.style.display = "block";
}

function getErrorMessage(error) {
  if (error.status === 400) return "Data tidak valid. Periksa form Anda.";
  if (error.status === 429) return "Terlalu banyak percobaan. Tunggu sebentar.";
  return "Gagal mengirim pesan. Silakan coba lagi.";
}

function handleInitializationError(error) {
  console.error("System initialization failed:", error);

  const fallbackMsg = document.createElement("div");
  fallbackMsg.innerHTML = `
    <p style="color: red; font-weight: bold;">
      Sistem kontak sedang tidak tersedia. Silakan hubungi kami langsung via:
    </p>
    <p>📧 Email: ${EMAILJS_CONFIG.RECEIVER_EMAIL}</p>
    <p>📞 Telepon: +62 000-000-00</p>
  `;

  const contactSection = document.getElementById("contact");
  if (contactSection) {
    contactSection.appendChild(fallbackMsg);
  }
}

/***** PUBLIC API *****/
export function initEmailSystem() {
  initializeEmailSystem().catch(handleInitializationError);
}