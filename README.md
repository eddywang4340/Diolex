## Diolex: The Conversational AI Interview Simulator

**The Problem:** Traditional interview prep focuses on pattern recognition, not the crucial "meta-skills" of communication, strategic questioning, and hint extraction vital for real technical interviews.

**Our Solution:** Diolex is a voice-first AI-powered simulator designed to train these essential meta-skills. Our AI interviewer:

*   **Watches code in real-time:** Provides contextual feedback based on your approach.
*   **Teaches strategic questioning:** Withholds information, prompting you to ask clarifying questions.
*   **Simulates authentic dynamics:** Engages in follow-up questions, hint extraction, and edge-case discussions.
*   **Provides detailed analysis:** Offers specific feedback on communication and problem-solving.

### How We Built It

**Frontend:**

*   **React + TypeScript:** For robust, type-safe components.
*   **Tailwind CSS:** For rapid, responsive styling.
*   **CodeMirror 6:** Provides a syntax-highlighted code editor.
*   **Custom WebSocket Hooks & Speech Recognition API:** Enables real-time, bidirectional communication and continuous voice input.
*   **React Router:** Manages seamless navigation.

**Backend:**

*   **FastAPI:** A high-performance asynchronous API.
*   **WebSockets:** For real-time voice and text communication.
*   **Custom Interview Agent:** A structured, stateful AI with authentic interviewer persona.
*   **Kokoro TTS:** For natural-sounding spoken feedback.
*   **Piston API:** Secure sandboxed code execution.
*   **SQLAlchemy + PostgreSQL:** For reliable data persistence.

**AI & Voice Technology:**

*   **Finetuned Outputs & Context-Aware Responses:** Ensures authentic, adaptive conversations based on code and history.
*   **Multi-modal Interaction:** Supports both voice and text.
*   **Intelligent Hint Distribution:** Provides strategic guidance without giving away answers.

### Key Technical Challenges Overcome

1.  **Real-time Voice + Code Synchronization:** We built a sophisticated WebSocket message queue system with prioritization and conflict resolution to ensure seamless integration of speech recognition, code editing, and AI responses.
2.  **Context-Aware AI Responses:** Developed a dynamic context injection system that sends code snapshots with every message, allowing the AI to intelligently reference your live implementation.
3.  **Authentic Interview Simulation:** Achieved realistic AI behavior through extensive prompt engineering, multi-phase interview logic, information withholding strategies, and natural conversation flow patterns.
4.  **Cross-browser Speech Recognition:** Implemented robust fallback mechanisms, automatic restart logic, and graceful degradation to text-only mode to counter browser inconsistencies.
5.  **Low-latency Voice Responses:** Streamed TTS with chunk-based audio playback and WebSocket message prioritization to minimize delay for natural conversation flow.

### What We Learned

**Technical:** Mastered WebSocket architecture, advanced speech API integration, AI prompt engineering for conversational AI, React performance optimization, and FastAPI async patterns.

**Product:** Understood the critical impact of authentic simulation, unique UX considerations for voice interfaces, and the importance of seamless transitions for users.

**Startup:** Validated our core hypothesis, discovered new use cases (e.g., explaining solutions), and recognized the scalability potential for different interview styles.

### Future Vision

Diolex proves the power of AI to authentically simulate complex human interactions. Our vision is a comprehensive interview preparation platform that adapts to diverse company styles, skill levels, and formats, revolutionizing career readiness for developers.
