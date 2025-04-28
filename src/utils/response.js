export function sendInlineReply(replyBody) {
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
