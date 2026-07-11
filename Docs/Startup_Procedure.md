# Startup Procedure

This document provides step-by-step instructions on how to start the **Backend**, **Frontend**, and **Test Frontend** components of the AI Meeting Automation project.

---

## 1. Backend Startup

The backend is a FastAPI application. Follow these steps to set up and run the server:

### Prerequisites
- Python 3.10 or higher installed.
- API keys set in `backend/.env`.

### Steps:
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. (Recommended) Create and activate a Python virtual environment:
   - **Windows:**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend server will run on [http://127.0.0.1:8000](http://127.0.0.1:8000).*

---

## 2. Frontend Startup

The frontend is a Vite + React application.

### Prerequisites
- Node.js (v18+) and npm installed.

### Steps:
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will typically be accessible on [http://localhost:5173](http://localhost:5173).*

---

## 3. Test Frontend Startup

The test-frontend contains static HTML, CSS, and JS files used to interact with and test the backend endpoints directly.

### Option A: Open directly in Browser (No Server)
- Navigate to the `test-frontend` folder.
- Double-click the [index.html](file:///d:/Tensor/AI-Workflow-Builder/test-frontend/index.html) file to open it directly in any modern web browser.

### Option B: Serve via Python HTTP Server
If you prefer running it on a local HTTP server, run:
1. Navigate to the `test-frontend` directory:
   ```bash
   cd test-frontend
   ```
2. Start Python's built-in HTTP server:
   ```bash
   python -m http.server 8080
   ```
3. Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option C: Serve via Node/npx
If Node is installed, you can also run:
1. Navigate to the `test-frontend` directory:
   ```bash
   cd test-frontend
   ```
2. Use `npx` to serve:
   ```bash
   npx serve
   ```
