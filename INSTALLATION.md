# Installation Guide
## Enterprise Visitor Management System

### Development Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Security Gate System"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   *Note: Ensure you are using Node.js v18 or higher.*

3. **Run the local development server**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:5173`.

### Configuration
Update `src/config/appConfig.ts` to customize your instance (e.g., Company Name, Session Timeouts).

### Mock Data & Local Storage
The application utilizes browser `localStorage` as a mock database. To clear all data and start fresh, run:
```javascript
localStorage.clear();
```
In your browser console.
