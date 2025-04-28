// Email body extraction
export function getEmailContent() {
  const emailBodies = document.querySelectorAll(".a3s.aiL");
  let combinedText = "";

  emailBodies.forEach((el) => {
    combinedText += el.innerText.trim() + "\n\n";
  });

  return combinedText || "No email content found.";
}
