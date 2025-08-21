document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const pricing = document.getElementById("pricing");
  const priceSection = document.getElementById("priceSection");

  // Show/hide price input
  pricing.addEventListener("change", () => {
    priceSection.style.display = (pricing.value === "Paid" || pricing.value === "Premium") ? "block" : "none";
  });

  // Validate required fields
  function validateForm() {
    let valid = true;
    document.querySelectorAll(".validation-message").forEach(el => el.textContent = "");

    const toolName = document.getElementById("toolName").value.trim();
    const shortDesc = document.getElementById("shortDesc").value.trim();
    const detailedDesc = document.getElementById("detailedDesc").value.trim();
    const category = document.getElementById("category").value.trim();
    const toolFile = document.getElementById("toolFile").files.length;
    const toolLink = document.getElementById("toolLink").value.trim();
    const version = document.getElementById("version").value.trim();
    const pricingVal = pricing.value.trim();
    const license = document.getElementById("license").value.trim();
    const logoFile = document.getElementById("logoFile").files.length;
    const docFile = document.getElementById("docFile").files.length;
    const securityDisclaimer = document.getElementById("securityDisclaimer").checked;
    const terms = document.getElementById("terms").checked;

    if (!toolName) { document.getElementById("toolNameError").textContent = "Required"; valid = false; }
    if (!shortDesc) { document.getElementById("shortDescError").textContent = "Required"; valid = false; }
    if (!detailedDesc) { document.getElementById("detailedDescError").textContent = "Required"; valid = false; }
    if (!category) { document.getElementById("categoryError").textContent = "Required"; valid = false; }

    if (!toolFile || !toolLink) {
      document.getElementById("toolFileLinkError").textContent = "Both file and link are required";
      valid = false;
    }

    if (!version) { document.getElementById("versionError").textContent = "Required"; valid = false; }
    if (!pricingVal) { document.getElementById("pricingError").textContent = "Required"; valid = false; }
    if (!license) { document.getElementById("licenseError").textContent = "Required"; valid = false; }
    if (!logoFile) { document.getElementById("logoFileError").textContent = "Required"; valid = false; }
    if (!docFile) { document.getElementById("docFileError").textContent = "Required"; valid = false; }
    if (!securityDisclaimer) { document.getElementById("securityDisclaimerError").textContent = "Required"; valid = false; }
    if (!terms) { document.getElementById("termsError").textContent = "Required"; valid = false; }

    return valid;
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = new FormData(form);

    try {
      const response = await fetch("http://localhost:5000/upload-tool", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = "success.html"; // ✅ Redirect on success
      } else {
        alert("Upload failed: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error uploading tool:", err);
      alert("Error submitting form.");
    }
  });
});
