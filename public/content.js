// content.js
console.log(" content.js injected");

const HEADER_SELECTOR = 'div[jsaction="JcCCed:.CLIENT"]';
const BTN_ID = "my-summarize-btn";

function checkAndInsert() {
  const headerDiv = document.querySelector(HEADER_SELECTOR);
  const emailThread = document.querySelector(".adn");
  const already = document.getElementById(BTN_ID);

  if (headerDiv && emailThread && !already) {
    insertButton(headerDiv);
  } else if ((!headerDiv || !emailThread) && already) {
    already.remove();
    console.log("Removed summarize button");
  }
}

function watchForToolbar() {
  let debounceTimer;

  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkAndInsert, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

watchForToolbar();

//track gmail inpage navigation
(function hookHistoryChanges() {
  const wrap = (fn) =>
    function (...args) {
      const ret = fn.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      return ret;
    };
  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
  window.addEventListener("popstate", () =>
    window.dispatchEvent(new Event("locationchange"))
  );
})();

window.addEventListener("locationchange", () => {
  document.getElementById(BTN_ID)?.remove();
  document.getElementById("my-extension-panel")?.remove();
  setTimeout(checkAndInsert, 300);
});

// Summarize Button
async function insertButton(targetDiv) {
  injectStyles();

  const alreadyExists = document.getElementById("my-summarize-btn");
  if (alreadyExists) return;

  const btn = document.createElement("button");
  btn.id = "my-summarize-btn";
  btn.innerHTML = `
    <img src="${chrome.runtime.getURL("icons/sparkle.png")}" alt="✨">
    <span>Email Summarizer</span>
  `;

  btn.addEventListener("click", async () => {
    showSummaryInSheet("", true);

    try {
      const emailText = getEmailContent();
      const prompt = `
        You are an expert email summarizer.

        1. Read the following **Email Content**.
        2. Extract key information such as updates, deadlines, requests, and questions.
        3. Write a plain-text summary using simple bullet points (no bold, no formatting).

        Email Content:
        ${emailText}

        Summary:`;

      const summary = await GeminiCall(emailText, prompt);

      updateSheetWithSummary(summary);
    } catch (err) {
      console.error("Error summarizing:", err);
      updateSheetWithError("Failed to generate summary. Please try again.");
    }
  });

  targetDiv.appendChild(btn);
}

async function showSummaryInSheet(summary = "", isLoading = false) {
  let sheet = document.getElementById("my-extension-panel");

  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "my-extension-panel";

    // Header
    const header = document.createElement("div");
    header.className = "ep-header";

    // Add sparkle icon
    const icon = document.createElement("img");
    icon.src = chrome.runtime.getURL("icons/sparkle.png");
    icon.className = "ep-header-icon";
    icon.alt = "";

    const title = document.createElement("h2");
    title.textContent = "Email Summary";
    title.className = "ep-title";

    const closeBtn = document.createElement("span");
    closeBtn.className = "ep-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => {
      sheet.style.transform = "translateX(100%)";
      setTimeout(() => sheet.remove(), 300);
    };

    header.append(icon, title, closeBtn);

    // Content section
    const content = document.createElement("div");
    content.className = "ep-content";

    const summaryDiv = document.createElement("div");
    summaryDiv.id = "summary-content";
    summaryDiv.className = "ep-summary";

    if (!isLoading && summary) {
      summaryDiv.innerText = summary;
      content.append(summaryDiv);
    }

    // Add loading indicator if in loading state
    if (isLoading) {
      const loadingIndicator = document.createElement("div");
      loadingIndicator.id = "loading-indicator";
      loadingIndicator.className = "ep-loading";
      loadingIndicator.innerHTML = `
        <div class="modern-spinner-container">
          <div class="bouncing-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div class="loading-text">Generating summary...</div>
        </div>
      `;
      content.appendChild(loadingIndicator);
    }

    const responseDiv = document.createElement("div");
    responseDiv.id = "response-content";
    responseDiv.className = "ep-summary";
    responseDiv.style.display = "none";

    // Buttons section
    const btnContainer = document.createElement("div");
    btnContainer.className = "ep-button-container";

    const generateButton = document.createElement("button");
    generateButton.id = "generate-btn";
    generateButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
        <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 22V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 7L12 12L4 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Respond
    `;
    generateButton.className = "ep-action-btn";

    if (isLoading || !summary) {
      generateButton.disabled = true;
      generateButton.style.opacity = "0.7";
      generateButton.style.cursor = "not-allowed";
    }

    generateButton.onclick = async () => {
      generateButton.disabled = true;
      generateButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.3" stroke-width="2"/>
          <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <animateTransform 
              attributeName="transform" 
              type="rotate"
              from="0 12 12"
              to="360 12 12" 
              dur="1s" 
              repeatCount="indefinite" />
          </path>
        </svg>
        Generating...
      `;

      const loadingIndicator = document.createElement("div");
      loadingIndicator.className = "ep-loading";
      loadingIndicator.innerHTML = `
      <div class="modern-spinner-container">
        <div class="bouncing-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
      `;
      content.appendChild(loadingIndicator);

      const summaryText = document.getElementById("summary-content").innerText;
      prompt = `You are an expert email assistant.

          Instructions:
          1. Read the **Email Summary** and note all participants and actions.
          2. Determine who in the summary most recently asked a question or offered assistance (the "last sender").
          3. Begin your reply with "Hi [Name]," addressing only that person.
          4. Acknowledge their inquiry or offer.
          5. Give the information or next steps they requested, from the perspective of the recipient.
          6. Use bullet points only when they make your reply clearer.
          7. Write a plain-text using simple bullet points (no bold, no formatting).
          8. Do **not** add a subject line or a sign-off.
          9. Keep the tone natural, helpful, and human.

          **Email Summary:**
          ${summaryText}

          Your reply:
`;
      try {
        const response = await GeminiCall(summaryText, prompt);

        content.removeChild(loadingIndicator);

        responseDiv.innerText = response;
        responseDiv.style.display = "block";
        responseDiv.style.opacity = "0";
        content.append(responseDiv);

        void responseDiv.offsetWidth;
        responseDiv.style.transition = "opacity 0.3s ease";
        responseDiv.style.opacity = "1";

        responseDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

        generateButton.disabled = false;
        generateButton.style.opacity = "1";
        generateButton.style.cursor = "pointer";
        generateButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
            <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 22V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 7L12 12L4 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Regenerate
        `;

        sendButton.disabled = false;
        sendButton.style.opacity = "1";
        sendButton.style.cursor = "pointer";
      } catch (error) {
        console.error("Error generating response:", error);
        content.removeChild(loadingIndicator);
        generateButton.disabled = false;
        generateButton.style.opacity = "1";
        generateButton.style.cursor = "pointer";
        generateButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
            <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 22V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 7L12 12L4 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Try Again
        `;
      }
    };

    const sendButton = document.createElement("button");
    sendButton.id = "send-btn";
    sendButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
        <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Send Response
    `;
    sendButton.className = "ep-action-btn";

    if (isLoading || !summary) {
      sendButton.disabled = true;
      sendButton.style.opacity = "0.7";
      sendButton.style.cursor = "not-allowed";
    }

    sendButton.onclick = () => {
      // Add sending animation
      sendButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
          <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="1"/>
          </path>
        </svg>
        Sending...
      `;

      setTimeout(() => {
        const replyBody = document.getElementById("response-content").innerText;
        sendInlineReply(replyBody);

        // Show success message
        sendButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Sent!
        `;

        setTimeout(() => {
          sheet.style.transform = "translateX(100%)";
          setTimeout(() => sheet.remove(), 300);
        }, 1000);
      }, 800);
    };

    btnContainer.append(generateButton, sendButton);

    sheet.append(header, content, btnContainer);
    document.body.appendChild(sheet);
  } else {
    const content = sheet.querySelector(".ep-content");
    const loadingIndicator = document.getElementById("loading-indicator");
    const summaryDiv = document.getElementById("summary-content");
    const generateBtn = document.getElementById("generate-btn");
    const sendBtn = document.getElementById("send-btn");

    // Handle loading state
    if (isLoading) {
      if (summaryDiv && summaryDiv.parentNode) {
        content.removeChild(summaryDiv);
      }

      if (!loadingIndicator) {
        const newLoadingIndicator = document.createElement("div");
        newLoadingIndicator.id = "loading-indicator";
        newLoadingIndicator.className = "ep-loading";
        newLoadingIndicator.innerHTML = `
        <div class="modern-spinner-container">
          <div class="bouncing-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div class="loading-text">Generating summary...</div>
        </div>
      `;

        content.appendChild(newLoadingIndicator);
      }

      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.style.opacity = "0.7";
        generateBtn.style.cursor = "not-allowed";
      }

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = "0.7";
        sendBtn.style.cursor = "not-allowed";
      }
    } else if (summary) {
      if (loadingIndicator) {
        content.removeChild(loadingIndicator);
      }

      if (!summaryDiv) {
        const newSummaryDiv = document.createElement("div");
        newSummaryDiv.id = "summary-content";
        newSummaryDiv.className = "ep-summary";
        newSummaryDiv.innerText = summary;

        newSummaryDiv.style.opacity = "0";
        content.appendChild(newSummaryDiv);

        void newSummaryDiv.offsetWidth;
        newSummaryDiv.style.transition = "opacity 0.3s ease";
        newSummaryDiv.style.opacity = "1";
      } else {
        summaryDiv.innerText = summary;

        if (summaryDiv.parentNode !== content) {
          content.appendChild(summaryDiv);
        }
      }

      // Enable buttons
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.style.opacity = "1";
        generateBtn.style.cursor = "pointer";
      }

      if (sendBtn) {
        const responseDiv = document.getElementById("response-content");
        if (responseDiv && responseDiv.style.display !== "none") {
          sendBtn.disabled = false;
          sendBtn.style.opacity = "1";
          sendBtn.style.cursor = "pointer";
        }
      }
    }
  }
}

function updateSheetWithSummary(summary) {
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

function updateSheetWithError(errorMessage) {
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

//email reply
function sendInlineReply(replyBody) {
  const replyBtn = document.querySelector('div[aria-label="Reply"]');
  if (!replyBtn) {
    console.error("Reply button not found.");
    alert(
      "Could not find the reply button. Please make sure the email is open."
    );
    return;
  }
  replyBtn.click();

  setTimeout(() => {
    const messageBox = document.querySelector(
      'div[aria-label="Message Body"][contenteditable="true"]'
    );

    if (!messageBox) {
      console.error("Reply box not found.");
      alert("Could not find the message body.");
      return;
    }

    const formatted = replyBody
      .split("\n")
      .map((line) => (line.trim() === "" ? "<br>" : line))
      .join("<br>");
    messageBox.innerHTML = formatted;

    messageBox.scrollIntoView({ behavior: "smooth", block: "center" });

    messageBox.focus();
  }, 500);
}

// Gemini call (unchanged)
async function GeminiCall(emailText, prompt) {
  const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    "gemini-2.0-flash:generateContent?key=AIzaSyAwZdVj6Rr9XBEpI2o51ZtRmLmSCGnYLDI";

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }, { text: emailText }],
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.status, response.statusText);
      return "Error: could not call gemini.";
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response available."
    );
  } catch (err) {
    console.error("Fetch error:", err);
    return "Error: failed to call gemini service.";
  }
}

// Email body extraction (unchanged)
function getEmailContent() {
  const emailBodies = document.querySelectorAll(".a3s.aiL");
  let combinedText = "";

  emailBodies.forEach((el) => {
    combinedText += el.innerText.trim() + "\n\n";
  });

  return combinedText || "No email content found.";
}

// Styling
function injectStyles() {
  if (document.getElementById("my-summarize-style")) return;

  const style = document.createElement("style");
  style.id = "my-summarize-style";
  style.textContent = `
    /* === Summarize Button === */
    #my-summarize-btn {
      display: flex;
      align-items: center;
      margin-left: 8px;
      background-color: #f1f4f8;
      color: #000;
      border: none;
      padding: 6px 12px;
      border-radius: 24px;
      cursor: pointer;
      font-size: 14px;
    }
    #my-summarize-btn:hover {
      background-color: #e2e6ea;
    }
    #my-summarize-btn img {
      width: 20px;
      height: 20px;
      margin-right: 6px;
    }

    /* === Extension Panel === */
    #my-extension-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100%;
      background: linear-gradient(to bottom, #ffffff, #f9fafc);
      border-left: 1px solid rgba(0,0,0,0.08);
      box-shadow: -8px 0 30px rgba(0,0,0,0.12);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      border-top-left-radius: 16px;
      border-bottom-left-radius: 16px;
    }
    
    /* Header */
    .ep-header {
      display: flex;
      align-items: center;
      padding: 18px 24px;
      background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
      border-bottom: 1px solid rgba(0,0,0,0.06);
      position: relative;
      border-top-left-radius: 16px;
    }
    
    .ep-header:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      opacity: 0.7;
    }
    
    .ep-header-icon {
      width: 22px;
      height: 22px;
      margin-right: 12px;
      object-fit: contain;
    }
    
    .ep-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      background: linear-gradient(90deg, #1e293b, #334155);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.01em;
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .ep-close-btn {
      font-size: 24px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #64748b;
      transition: all 0.2s ease;
      background: rgba(0,0,0,0.03);
      margin-left: auto;
    }
    
    .ep-close-btn:hover {
      background: rgba(0,0,0,0.08);
      color: #334155;
      transform: rotate(90deg);
    }

    /* Content */
    .ep-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.03) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.03) 0%, transparent 20%);
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }
    
    .ep-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .ep-content::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    
    .ep-content::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 6px;
    }
    
    .ep-summary {
      padding: 18px;
      background-color: #ffffff;
      border-radius: 12px;
      white-space: pre-wrap;
      margin-bottom: 24px;
      line-height: 1.7;
      font-size: 14px;
      color: #334155;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02);
      border: 1px solid rgba(0,0,0,0.04);
      position: relative;
      transition: all 0.2s ease;
    }
    
    .ep-summary:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03);
      transform: translateY(-1px);
    }
    
    .ep-summary:before {
      content: 'Summary';
      position: absolute;
      top: -10px;
      left: 12px;
      background: #6366f1;
      color: white;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
    }
    
    #response-content:before {
      content: 'Response';
      background: #ec4899;
      box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
    }
    
    /* Error message */
    .ep-error {
      display: flex;
      align-items: center;
      padding: 16px;
      background-color: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 12px;
      margin-bottom: 20px;
      color: #be123c;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 2px 8px rgba(244, 63, 94, 0.08);
    }
    
    .ep-error svg {
      flex-shrink: 0;
    }

    /* Footer Buttons */
    .ep-button-container {
      padding: 20px 24px;
      border-top: 1px solid rgba(0,0,0,0.06);
      display: flex;
      gap: 12px;
      background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
      border-bottom-left-radius: 16px;
    }
    
    .ep-action-btn {
      flex: 1;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #fff;
      border: none;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .ep-action-btn:before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, 
        rgba(255,255,255,0) 0%, 
        rgba(255,255,255,0.2) 50%, 
        rgba(255,255,255,0) 100%);
      transition: all 0.6s ease;
    }
    
    .ep-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
    }
    
    .ep-action-btn:hover:before {
      left: 100%;
    }
    
    .ep-action-btn:nth-child(2) {
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
    }
    
    .ep-action-btn:nth-child(2):hover {
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3);
    }
    
    .ep-action-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    
    .ep-action-btn:disabled:hover {
      transform: none;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }
    
    .ep-action-btn:disabled:before {
      display: none;
    }
    
    /* Loading indicator */
    .ep-loading {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    
    /* Animation for panel appearance */
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    #my-extension-panel {
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Loader */
    .modern-spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .bouncing-dots {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      height: 24px;
    }

    .dot {
      width: 8px;
      height: 8px;
      background-color: #6366f1;
      border-radius: 50%;
      animation: bounce 1.2s infinite ease-in-out;
    }

    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes bounce {

      0%,
      80%,
      100% {
        transform: translateY(0);
      }

      40% {
        transform: translateY(-10px);
      }
    }

    .loading-text {
      margin-top: 12px;
      color: #64748b;
      font-size: 18px;
      font-weight: 500;
      font-family: system-ui, sans-serif;
    }
  `;
  document.head.appendChild(style);
}
