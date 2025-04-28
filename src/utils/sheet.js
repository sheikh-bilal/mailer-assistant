export function updateSheetWithError(errorMessage) {
  const sheet = document.getElementById("my-extension-panel");
  if (!sheet) return;

  const content = sheet.querySelector(".ep-content");
  const loadingIndicator = document.getElementById("loading-indicator");

  if (loadingIndicator) {
    content.removeChild(loadingIndicator);
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "ep-error";
  errorDiv.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
      <circle cx="12" cy="12" r="10" stroke="#f43f5e" stroke-width="2"/>
      <path d="M12 8V12" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="16" r="1" fill="#f43f5e"/>
    </svg>
    ${errorMessage}
  `;

  errorDiv.style.opacity = "0";
  content.appendChild(errorDiv);

  void errorDiv.offsetWidth;
  errorDiv.style.transition = "opacity 0.3s ease";
  errorDiv.style.opacity = "1";

  const generateBtn = document.getElementById("generate-btn");
  if (generateBtn) {
    generateBtn.disabled = false;
    generateBtn.style.opacity = "1";
    generateBtn.style.cursor = "pointer";
    generateBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
        <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 22V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 7L12 12L4 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Try Again
    `;
  }
}

//Display summary
export function updateSheetWithSummary(summary) {
  const sheet = document.getElementById("my-extension-panel");
  if (!sheet) return;

  const content = sheet.querySelector(".ep-content");
  const loadingIndicator = document.getElementById("loading-indicator");

  if (loadingIndicator) {
    content.removeChild(loadingIndicator);
  }

  let summaryDiv = document.getElementById("summary-content");
  if (!summaryDiv) {
    summaryDiv = document.createElement("div");
    summaryDiv.id = "summary-content";
    summaryDiv.className = "ep-summary";

    summaryDiv.style.opacity = "0";
    content.appendChild(summaryDiv);
  }

  summaryDiv.innerText = summary;

  if (summaryDiv.style.opacity !== "1") {
    void summaryDiv.offsetWidth;
    summaryDiv.style.transition = "opacity 0.3s ease";
    summaryDiv.style.opacity = "1";
  }

  const generateBtn = document.getElementById("generate-btn");
  if (generateBtn) {
    generateBtn.disabled = false;
    generateBtn.style.opacity = "1";
    generateBtn.style.cursor = "pointer";
  }

  const sendBtn = document.getElementById("send-btn");
  if (sendBtn) {
    const responseDiv = document.getElementById("response-content");
    if (responseDiv && responseDiv.style.display !== "none") {
      sendBtn.disabled = false;
      sendBtn.style.opacity = "1";
      sendBtn.style.cursor = "pointer";
    }
  }
}
