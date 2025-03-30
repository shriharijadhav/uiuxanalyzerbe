# Website UI/UX Analyzer - Backend  

The backend of the **Website UI/UX Analyzer** is responsible for processing website analysis requests. It integrates with **Lighthouse and Puppeteer** to evaluate websites, generate scores, and return structured reports.  

### Features  

- **Website Analysis Engine**: Uses **Lighthouse** to evaluate performance, accessibility, and best practices.  
- **Automated Screenshot Capture**: Uses **Puppeteer** to take a full-page screenshot of the website.  
- **Real-Time Score Updates**: Sends updates via **Pusher** to the frontend during analysis.  
- **Structured API Responses**: Provides JSON-based reports with scores, suggestions, and insights.  

### Tech Stack  

- **Node.js & Express.js**
- **Lighthouse (Website Auditing)**
- **Puppeteer (Headless Browser for Screenshots)**
- **Pusher (Real-time communication)**
- **Cloudinary (For image storage)**
- **MongoDB (For optional report storage)**  

The backend is designed to handle **multiple requests efficiently**, ensuring accurate website evaluations with minimal processing time.  
