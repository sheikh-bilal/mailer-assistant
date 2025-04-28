// content.js
console.log(" content.js injected");
import { GeminiCall } from "./api/gemini";
import { insertButton } from "./components/SummarizeBtn";
import { getEmailContent } from "./utils/emailContent";
import { sendInlineReply } from "./utils/response";
import { updateSheetWithError, updateSheetWithSummary } from "./utils/sheet";

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
// async function insertButton(targetDiv) {
//   const alreadyExists = document.getElementById("my-summarize-btn");
//   if (alreadyExists) return;

//   const btn = document.createElement("button");
//   btn.id = "my-summarize-btn";
//   btn.innerHTML = `
//     <img src="${chrome.runtime.getURL("icons/sparkle.png")}" alt="✨">
//     <span>Email Summarizer</span>
//   `;

//   btn.addEventListener("click", async () => {
//     showSummaryInSheet("", true);

//     try {
//       const emailText = getEmailContent();
//       const prompt = `
//         You are an expert email summarizer.

//         1. Read the following **Email Content**.
//         2. Extract key information such as updates, deadlines, requests, and questions.
//         3. Write a plain-text summary using simple bullet points (no bold, no formatting).

//         Email Content:
//         ${emailText}

//         Summary:`;

//       const summary = await GeminiCall(emailText, prompt);

//       updateSheetWithSummary(summary);
//     } catch (err) {
//       console.error("Error summarizing:", err);
//       updateSheetWithError("Failed to generate summary. Please try again.");
//     }
//   });

//   targetDiv.appendChild(btn);
// }

// async function showSummaryInSheet(summary = "", isLoading = false) {
//   let sheet = document.getElementById("my-extension-panel");

//   if (!sheet) {
//     sheet = document.createElement("div");
//     sheet.id = "my-extension-panel";

//     // Header
//     const header = document.createElement("div");
//     header.className = "ep-header";

//     // Add sparkle icon
//     const icon = document.createElement("img");
//     icon.src = chrome.runtime.getURL("icons/sparkle.png");
//     icon.className = "ep-header-icon";
//     icon.alt = "";

//     const title = document.createElement("h2");
//     title.textContent = "Email Summary";
//     title.className = "ep-title";

//     const closeBtn = document.createElement("span");
//     closeBtn.className = "ep-close-btn";
//     closeBtn.innerHTML = "&times;";
//     closeBtn.onclick = () => {
//       sheet.style.transform = "translateX(100%)";
//       setTimeout(() => sheet.remove(), 300);
//     };

//     header.append(icon, title, closeBtn);

//     // Content section
//     const content = document.createElement("div");
//     content.className = "ep-content";

//     const summaryDiv = document.createElement("div");
//     summaryDiv.id = "summary-content";
//     summaryDiv.className = "ep-summary";

//     if (!isLoading && summary) {
//       summaryDiv.innerText = summary;
//       content.append(summaryDiv);
//     }

//     // Add loading indicator if in loading state
//     if (isLoading) {
//       const loadingIndicator = document.createElement("div");
//       loadingIndicator.id = "loading-indicator";
//       loadingIndicator.className = "ep-loading";
//       loadingIndicator.innerHTML = `
//         <div class="modern-spinner-container">
//           <div class="bouncing-dots">
//             <div class="dot"></div>
//             <div class="dot"></div>
//             <div class="dot"></div>
//           </div>
//           <div class="loading-text">Generating summary...</div>
//         </div>
//       `;
//       content.appendChild(loadingIndicator);
//     }

//     const responseDiv = document.createElement("div");
//     responseDiv.id = "response-content";
//     responseDiv.className = "ep-summary";
//     responseDiv.style.display = "none";

//     // Buttons section
//     const btnContainer = document.createElement("div");
//     btnContainer.className = "ep-button-container";

//     const generateButton = document.createElement("button");
//     generateButton.id = "generate-btn";
//     generateButton.innerHTML = `
//       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
//         <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//         <path d="M12 22V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//         <path d="M20 7L12 12L4 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//       </svg>
//       Respond
//     `;
//     generateButton.className = "ep-action-btn";

//     if (isLoading || !summary) {
//       generateButton.disabled = true;
//       generateButton.style.opacity = "0.7";
//       generateButton.style.cursor = "not-allowed";
//     }

//     generateButton.onclick = async () => {
//       generateButton.disabled = true;
//       generateButton.innerHTML = `
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
//           <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.3" stroke-width="2"/>
//           <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round">
//             <animateTransform
//               attributeName="transform"
//               type="rotate"
//               from="0 12 12"
//               to="360 12 12"
//               dur="1s"
//               repeatCount="indefinite" />
//           </path>
//         </svg>
//         Generating...
//       `;

//       const loadingIndicator = document.createElement("div");
//       loadingIndicator.className = "ep-loading";
//       loadingIndicator.innerHTML = `
//       <div class="modern-spinner-container">
//         <div class="bouncing-dots">
//           <div class="dot"></div>
//           <div class="dot"></div>
//           <div class="dot"></div>
//         </div>
//       </div>
//       `;
//       content.appendChild(loadingIndicator);

//       const summaryText = document.getElementById("summary-content").innerText;
//       prompt = `You are an expert email assistant.

//           Instructions:
//           1. Read the **Email Summary** and note all participants and actions.
//           2. Determine who in the summary most recently asked a question or offered assistance (the "last sender").
//           3. Begin your reply with "Hi [Name]," addressing only that person.
//           4. Acknowledge their inquiry or offer.
//           5. Give the information or next steps they requested, from the perspective of the recipient.
//           6. Use bullet points only when they make your reply clearer.
//           7. Write a plain-text using simple bullet points (no bold, no formatting).
//           8. Do **not** add a subject line or a sign-off.
//           9. Keep the tone natural, helpful, and human.

//           **Email Summary:**
//           ${summaryText}

//           Your reply:
// `;
//       try {
//         const response = await GeminiCall(summaryText, prompt);

//         content.removeChild(loadingIndicator);

//         responseDiv.innerText = response;
//         responseDiv.style.display = "block";
//         responseDiv.style.opacity = "0";
//         content.append(responseDiv);

//         void responseDiv.offsetWidth;
//         responseDiv.style.transition = "opacity 0.3s ease";
//         responseDiv.style.opacity = "1";

//         responseDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

//         generateButton.disabled = false;
//         generateButton.style.opacity = "1";
//         generateButton.style.cursor = "pointer";
//         generateButton.innerHTML = `
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
//             <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//             <path d="M12 22V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//             <path d="M20 7L12 12L4 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//           </svg>
//           Regenerate
//         `;

//         sendButton.disabled = false;
//         sendButton.style.opacity = "1";
//         sendButton.style.cursor = "pointer";
//       } catch (error) {
//         console.error("Error generating response:", error);
//         content.removeChild(loadingIndicator);
//         generateButton.disabled = false;
//         generateButton.style.opacity = "1";
//         generateButton.style.cursor = "pointer";
//         generateButton.innerHTML = `
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
//             <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//             <path d="M12 22V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//             <path d="M20 7L12 12L4 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//           </svg>
//           Try Again
//         `;
//       }
//     };

//     const sendButton = document.createElement("button");
//     sendButton.id = "send-btn";
//     sendButton.innerHTML = `
//       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
//         <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//         <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//       </svg>
//       Send Response
//     `;
//     sendButton.className = "ep-action-btn";

//     if (isLoading || !summary) {
//       sendButton.disabled = true;
//       sendButton.style.opacity = "0.7";
//       sendButton.style.cursor = "not-allowed";
//     }

//     sendButton.onclick = () => {
//       // Add sending animation
//       sendButton.innerHTML = `
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
//           <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//           <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//             <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="1"/>
//           </path>
//         </svg>
//         Sending...
//       `;

//       setTimeout(() => {
//         const replyBody = document.getElementById("response-content").innerText;
//         sendInlineReply(replyBody);

//         // Show success message
//         sendButton.innerHTML = `
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
//             <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//           </svg>
//           Sent!
//         `;

//         setTimeout(() => {
//           sheet.style.transform = "translateX(100%)";
//           setTimeout(() => sheet.remove(), 300);
//         }, 1000);
//       }, 800);
//     };

//     btnContainer.append(generateButton, sendButton);

//     sheet.append(header, content, btnContainer);
//     document.body.appendChild(sheet);
//   } else {
//     const content = sheet.querySelector(".ep-content");
//     const loadingIndicator = document.getElementById("loading-indicator");
//     const summaryDiv = document.getElementById("summary-content");
//     const generateBtn = document.getElementById("generate-btn");
//     const sendBtn = document.getElementById("send-btn");

//     // Handle loading state
//     if (isLoading) {
//       if (summaryDiv && summaryDiv.parentNode) {
//         content.removeChild(summaryDiv);
//       }

//       if (!loadingIndicator) {
//         const newLoadingIndicator = document.createElement("div");
//         newLoadingIndicator.id = "loading-indicator";
//         newLoadingIndicator.className = "ep-loading";
//         newLoadingIndicator.innerHTML = `
//         <div class="modern-spinner-container">
//           <div class="bouncing-dots">
//             <div class="dot"></div>
//             <div class="dot"></div>
//             <div class="dot"></div>
//           </div>
//           <div class="loading-text">Generating summary...</div>
//         </div>
//       `;

//         content.appendChild(newLoadingIndicator);
//       }

//       if (generateBtn) {
//         generateBtn.disabled = true;
//         generateBtn.style.opacity = "0.7";
//         generateBtn.style.cursor = "not-allowed";
//       }

//       if (sendBtn) {
//         sendBtn.disabled = true;
//         sendBtn.style.opacity = "0.7";
//         sendBtn.style.cursor = "not-allowed";
//       }
//     } else if (summary) {
//       if (loadingIndicator) {
//         content.removeChild(loadingIndicator);
//       }

//       if (!summaryDiv) {
//         const newSummaryDiv = document.createElement("div");
//         newSummaryDiv.id = "summary-content";
//         newSummaryDiv.className = "ep-summary";
//         newSummaryDiv.innerText = summary;

//         newSummaryDiv.style.opacity = "0";
//         content.appendChild(newSummaryDiv);

//         void newSummaryDiv.offsetWidth;
//         newSummaryDiv.style.transition = "opacity 0.3s ease";
//         newSummaryDiv.style.opacity = "1";
//       } else {
//         summaryDiv.innerText = summary;

//         if (summaryDiv.parentNode !== content) {
//           content.appendChild(summaryDiv);
//         }
//       }

//       // Enable buttons
//       if (generateBtn) {
//         generateBtn.disabled = false;
//         generateBtn.style.opacity = "1";
//         generateBtn.style.cursor = "pointer";
//       }

//       if (sendBtn) {
//         const responseDiv = document.getElementById("response-content");
//         if (responseDiv && responseDiv.style.display !== "none") {
//           sendBtn.disabled = false;
//           sendBtn.style.opacity = "1";
//           sendBtn.style.cursor = "pointer";
//         }
//       }
//     }
//   }
// }
