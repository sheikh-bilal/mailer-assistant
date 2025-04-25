function App() {
  return (
    <main>
      <div className="intro">
        <h2>Smart Email Assistant</h2>
        <p>
          Enhance your email workflow with AI-powered tools designed to save
          time and improve communication.
        </p>
      </div>

      <div className="features">
        <div className="feature">
          <div className="feature-icon">📝</div>
          <h2>Summarize Email Threads</h2>
          <p>
            Uses AI to generate concise summaries of long email conversations,
            helping you quickly understand context.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">💬</div>
          <h2>Generate Smart Replies</h2>
          <p>
            Quickly generate context-aware email responses that match your tone
            and style for professional communication.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">✉️</div>
          <h2>Send Replies in One Click</h2>
          <p>
            Review and send the generated replies instantly with a single click,
            streamlining your email workflow.
          </p>
        </div>
      </div>
    </main>
  );
}

export default App;
