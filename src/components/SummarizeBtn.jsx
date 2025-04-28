import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button as ShadButton } from "@/components/ui/button";
import { GeminiCall } from "../api/gemini";
import { getEmailContent } from "../utils/emailContent";
import { sendInlineReply } from "../utils/response";

function EmailSummarizerSheet() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    async function summarize() {
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
        const result = await GeminiCall(emailText, prompt);
        setSummary(result);
      } catch (e) {
        console.error("Error summarizing:", e);
        setError("Failed to generate summary. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    summarize();
  }, []);

  async function handleRespond() {
    setIsResponding(true);
    try {
      const prompt = `
        You are an expert email assistant.

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
        ${summary}

        Your reply:`;
      const response = await GeminiCall(summary, prompt);
      sendInlineReply(response);
      setIsOpen(false);
    } catch (e) {
      console.error("Error generating response:", e);
      setError("Failed to generate response. Please try again.");
    } finally {
      setIsResponding(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button id="my-summarize-btn" className="btn-primary">
          <img
            src={chrome.runtime.getURL("icons/sparkle.png")}
            alt="✨"
            className="mr-2 w-5 h-5"
          />
          Email Summarizer
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] h-full">
        <SheetHeader>
          <SheetTitle>Email Summary</SheetTitle>
        </SheetHeader>
        <div className="p-4 flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-r-transparent border-t-transparent"></div>
              <p className="mt-3 text-blue-600">Generating summary...</p>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="whitespace-pre-wrap">{summary}</div>
          )}
        </div>
        <SheetFooter className="flex justify-end space-x-2">
          <ShadButton
            onClick={handleRespond}
            disabled={!summary || isLoading || isResponding}
          >
            {isResponding ? "Sending..." : "Respond"}
          </ShadButton>
          <ShadButton variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </ShadButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function insertButton(targetDiv) {
  if (document.getElementById("my-summarize-btn")) return;
  const mountEl = document.createElement("div");
  targetDiv.appendChild(mountEl);
  const root = createRoot(mountEl);
  root.render(<EmailSummarizerSheet />);
}
