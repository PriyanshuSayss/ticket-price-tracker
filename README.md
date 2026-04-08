# ✈️ Ticket Price Tracker

A professional-grade, full-stack travel portal designed to help users track real-time flight, train, and bus prices with AI-driven insights and a stunning modern UI.

![GitHub last commit](https://img.shields.io/github/last-commit/PriyanshuSayss/ticket-price-tracker)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- **Real-Time Data**: Integrates with Google Flights via SerpApi to provide live pricing, airlines, and durations.
- **Multi-Mode Search**: Seamlessly switch between flights, trains, and buses.
- **"Explore Everywhere"**: Find the cheapest international destinations and curated top routes (e.g., Mumbai ➔ Dubai).
- **AI-Driven Insights**: Smart "When to Buy" recommendations based on price stability and departure dates.
- **Hacker Routes**: Automatically injects multi-mode travel combinations (e.g., Bus + Flight) to maximize savings.
- **Modern UI**: A premium dark-themed experience built with Angular Material and Tailwind CSS, featuring glassmorphism and smooth animations.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Angular CLI
- [SerpApi Account](https://serpapi.com/) for real-time flight data.

### 1. Clone the repository
```bash
git clone https://github.com/PriyanshuSayss/ticket-price-tracker.git
cd ticket-price-tracker
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add your SerpApi key:
```env
SERPAPI_KEY=your_actual_serpapi_key_here
PORT=5000
```
> [!WARNING]
> Never commit your `.env` file to GitHub. It is already included in `.gitignore`.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Backend Proxy
The backend handles the API requests securely to bypass CORS.
```bash
npm run start:backend
```

### 5. Run the Frontend
In a new terminal:
```bash
npm start
```
Navigate to `http://localhost:4200/`.

## 🛠️ Tech Stack
- **Frontend**: Angular 18, Angular Material, Tailwind CSS, Chart.js.
- **Backend**: Node.js/Express (API Gateway).
- **Data Source**: SerpApi (Google Flights Engine).

## 🛡️ Security
This project uses a secure Node.js proxy to process API keys. All sensitive credentials are kept server-side to prevent exposure in the browser.

---
Developed with ❤️ by [Priyanshu](https://github.com/PriyanshuSayss)
