<div align="center">

# 🎤 HT6 Interview Agent

**An AI-powered technical interview practice platform with real-time voice interaction**

[![Python](https://img.shields.io/badge/python-3.10+-blue.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-green.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19+-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey?style=for-the-badge)](#-installation)

[**🚀 Quick Start**](#-quick-start) • [**📖 Documentation**](#-features) • [**🛠️ Installation**](#-installation) • [**🤝 Contributing**](#-contributing)

---

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <h3>🎯 Interactive Coding Interview</h3>
      <p>Practice technical interviews with AI-powered feedback and real-time voice interaction</p>
    </td>
    <td width="50%" align="center">
      <h3>🗣️ Voice-Enabled Experience</h3>
      <p>Speak naturally while coding - just like a real interview</p>
    </td>
  </tr>
</table>

</div>

## 📋 Table of Contents

- [🎤 HT6 Interview Agent](#-ht6-interview-agent)
  - [📋 Table of Contents](#-table-of-contents)
  - [🔍 About](#-about)
    - [✨ Features](#-features)
  - [🚀 Quick Start](#-quick-start)
  - [🛠️ Installation](#️-installation)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
  - [⚙️ Configuration](#️-configuration)
  - [🎯 Usage](#-usage)
  - [🏗️ Architecture](#️-architecture)
  - [🧪 API Documentation](#-api-documentation)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

## 🔍 About

HT6 Interview Agent is an AI-powered platform designed to help developers practice technical interviews in a realistic environment. Using advanced AI agents powered by Google's Gemini model, the platform provides interactive coding challenges with voice-enabled communication, real-time feedback, and comprehensive performance analysis.

### ✨ Features

- **🤖 AI-Powered Interview Agent**: Interactive interviewer using Google Gemini 2.5 Flash
- **🗣️ Voice Recognition & TTS**: Real-time speech-to-text and text-to-speech capabilities
- **💻 Multi-Language Code Editor**: Support for Python, JavaScript, Java, and C++ with syntax highlighting
- **⏱️ Real-Time Timer**: Track your interview performance with live timing
- **🎯 Coding Problem Database**: Curated collection of technical interview problems
- **📊 Performance Analysis**: Detailed feedback and performance metrics
- **🔄 WebSocket Integration**: Real-time communication between frontend and backend
- **📱 Responsive Design**: Modern, clean UI built with React and Tailwind CSS

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/eddywang4340/HT6-interview-agent.git
   cd HT6-interview-agent
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file in the backend directory
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > backend/.env
   ```

3. **Start the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

4. **Start the frontend**
   ```bash
   cd frontend/interview-agent-frontend
   npm install
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## 🛠️ Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or pnpm
- Google Gemini API key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Frontend Setup

```bash
cd frontend/interview-agent-frontend

# Install dependencies
npm install
# or with pnpm
pnpm install

# Start development server
npm run dev
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://username:password@localhost/dbname
DEBUG=true
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI agent | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DEBUG` | Enable debug mode | No |

## 🎯 Usage

1. **Select Interview Settings**: Choose difficulty level, programming language, and interview duration
2. **Start Interview**: Begin with an AI interviewer that will guide you through the process
3. **Solve Problems**: Write code in the integrated editor while discussing your approach
4. **Voice Interaction**: Use voice commands to communicate naturally with the AI interviewer
5. **Get Feedback**: Receive real-time feedback and suggestions from the AI agent
6. **Review Results**: Analyze your performance and areas for improvement

## 🏗️ Architecture

```
HT6-interview-agent/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── agent/          # AI agents (interview & feedback)
│   │   ├── core/           # Core configuration
│   │   ├── db/             # Database models and connection
│   │   └── main.py         # FastAPI application entry point
│   └── requirements.txt    # Python dependencies
└── frontend/               # React frontend
    └── interview-agent-frontend/
        ├── src/
        │   ├── components/ # React components
        │   ├── hooks/      # Custom React hooks
        │   ├── pages/      # Page components
        │   └── types/      # TypeScript type definitions
        └── package.json    # Node.js dependencies
```

### Key Components

- **Interview Agent**: Handles AI-powered interview interactions using Google Gemini
- **Feedback Agent**: Provides performance analysis and coding feedback
- **TTS Service**: Text-to-speech functionality for voice responses
- **WebSocket Manager**: Real-time communication between client and server
- **Code Editor**: Multi-language code editor with syntax highlighting

## 🧪 API Documentation

### Main Endpoints

- `GET /problems` - Retrieve coding problems
- `GET /problems/random` - Get a random problem
- `POST /interview/start` - Start a new interview session
- `POST /interview/submit` - Submit code solution
- `WebSocket /ws/{client_id}` - Real-time communication

### WebSocket Events

- `interview_start` - Begin interview session
- `code_update` - Update code in real-time
- `voice_message` - Send voice transcription
- `ai_response` - Receive AI agent response

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
=======
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

