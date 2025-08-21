document.addEventListener("DOMContentLoaded", () => {
  // --- Form elements ---
  const form = document.getElementById('uploadForm');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const submitBtn = document.getElementById('submitBtn');
  const restrictionMessage = document.getElementById('restrictionMessage');

  // --- Preview card elements ---
  const cardLogo = document.getElementById('cardLogo');
  const cardName = document.getElementById('cardName');
  const cardShortDesc = document.getElementById('cardShortDesc');

  // --- Drag & Drop zones ---
  function setDragDropZone(dropZoneId, inputFileId) {
    const dropZone = document.getElementById(dropZoneId);
    const inputFile = document.getElementById(inputFileId);

    dropZone.addEventListener('dragover', e => { 
      e.preventDefault(); 
      dropZone.classList.add('dragover'); 
    });
    dropZone.addEventListener('dragleave', e => { 
      e.preventDefault(); 
      dropZone.classList.remove('dragover'); 
    });
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); 
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) { 
        inputFile.files = e.dataTransfer.files; 
        inputFile.dispatchEvent(new Event('change')); 
      }
    });
    dropZone.addEventListener('click', () => inputFile.click());
  }

  setDragDropZone('toolFileDrop', 'toolFile');
  setDragDropZone('logoFileDrop', 'logoFile');
  setDragDropZone('docFileDrop', 'docFile');

  // --- Pricing toggle ---
  const pricingSelect = document.getElementById('pricing');
  const priceSection = document.getElementById('priceSection');
  pricingSelect.addEventListener('change', () => {
    priceSection.style.display = pricingSelect.value === 'Paid' ? 'block' : 'none';
  });

  // --- Live preview ---
  document.getElementById('toolName').addEventListener('input', e => {
    cardName.textContent = e.target.value || '(Tool Name)';
  });
  document.getElementById('shortDesc').addEventListener('input', e => {
    cardShortDesc.textContent = e.target.value || '(Short Description)';
  });
  document.getElementById('logoFile').addEventListener('change', e => {
    updateLogoPreview(e.target.files[0]);
  });
  function updateLogoPreview(file) {
    if (!file) { 
      cardLogo.innerHTML = ''; 
      return; 
    }
    const reader = new FileReader();
    reader.onload = e => { 
      cardLogo.innerHTML = `<img src="${e.target.result}" alt="Logo">`; 
    };
    reader.readAsDataURL(file);
  }

  // --- Save Draft ---
  saveDraftBtn.addEventListener('click', e => {
    e.preventDefault();
    const draft = {};
    Array.from(form.elements).forEach(el => {
      if (el.name && el.type !== 'file' && el.type !== 'checkbox') draft[el.name] = el.value;
      if (el.type === 'checkbox') draft[el.name] = el.checked;
    });
    const logoFile = form.logoFile.files[0];
    if (logoFile) {
      const reader = new FileReader();
      reader.onload = e => {
        draft.logoPreview = e.target.result;
        localStorage.setItem('toolDraft', JSON.stringify(draft));
        alert('Draft saved locally!');
      };
      reader.readAsDataURL(logoFile);
    } else {
      localStorage.setItem('toolDraft', JSON.stringify(draft));
      alert('Draft saved locally!');
    }
  });

  // --- Load Draft ---
  const draft = localStorage.getItem('toolDraft');
  if (draft) {
    const data = JSON.parse(draft);
    Object.keys(data).forEach(k => {
      const el = form.elements[k];
      if (el) {
        if (el.type === 'checkbox') el.checked = data[k];
        else el.value = data[k];
      }
    });
    if (data.logoPreview) cardLogo.innerHTML = `<img src="${data.logoPreview}" alt="Logo">`;
    cardName.textContent = data.toolName || '(Tool Name)';
    cardShortDesc.textContent = data.shortDesc || '(Short Description)';
  }

  // --- Validation ---
  function validateForm() {
    let valid = true;
    function setError(id, msg) { document.getElementById(id).textContent = msg; valid = false; }
    function clearError(id) { document.getElementById(id).textContent = ''; }

    const toolName = form.toolName.value.trim();
    if (!toolName) setError('toolNameError', 'Tool Name is required.'); else clearError('toolNameError');

    const shortDesc = form.shortDesc.value.trim();
    if (!shortDesc) setError('shortDescError', 'Short Description is required.'); else clearError('shortDescError');

    const detailedDesc = form.detailedDesc.value.trim();
    if (!detailedDesc) setError('detailedDescError', 'Detailed Description is required.');
    else if (detailedDesc.length > 1000) setError('detailedDescError', 'Max 1000 characters.');
    else clearError('detailedDescError');

    if (!form.category.value) setError('categoryError', 'Category required.'); else clearError('categoryError');

    const toolFile = form.toolFile.files[0];
    const toolLink = form.toolLink.value.trim();
    if (!toolFile && !toolLink) setError('toolFileLinkError', 'Provide file or link.');
    else if (toolLink && !isValidURL(toolLink)) setError('toolFileLinkError', 'Invalid link.');
    else clearError('toolFileLinkError');

    const version = form.version.value.trim();
    if (!version) setError('versionError', 'Version required.');
    else if (!/^([0-9]+(\.[0-9]+)*(-[a-zA-Z0-9]+)?)$/.test(version)) setError('versionError', 'Invalid format.');
    else clearError('versionError');

    if (!form.pricing.value) setError('pricingError', 'Pricing required.'); else clearError('pricingError');
    if (form.pricing.value === 'Paid' && !form.price.value) setError('pricingError', 'Price required.');

    if (!form.license.value) setError('licenseError', 'License required.'); else clearError('licenseError');

    const logoFile = form.logoFile.files[0];
    if (!logoFile) setError('logoFileError', 'Logo required.');
    else if (!logoFile.type.startsWith('image/')) setError('logoFileError', 'Invalid image.');
    else clearError('logoFileError');

    const docFile = form.docFile.files[0];
    if (!docFile) setError('docFileError', 'Documentation required.');
    else clearError('docFileError');

    if (!form.securityDisclaimer.checked) setError('securityDisclaimerError', 'Required.');
    else clearError('securityDisclaimerError');

    if (!form.terms.checked) setError('termsError', 'Required.');
    else clearError('termsError');

    return valid;
  }

  function isValidURL(str) {
    try { new URL(str); return true; } catch { return false; }
  }

  // --- Submit handler (ONLY ONE) ---
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    try {
      const formData = new FormData(form);

      // ✅ FIXED: call backend at port 5000
      const response = await fetch('http://localhost:5000/upload-tool', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        localStorage.removeItem('toolDraft');
        // ✅ Redirect to success page
        window.location.href = "success.html";
      } else {
        alert('Error: ' + result.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading tool.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Tool';
    }
  });
});
