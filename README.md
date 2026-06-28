<h1 align="center">🎓 Campus Placement Management System</h1>

<p align="center">
  A full-stack, enterprise-grade placement portal built for universities to manage the entire recruitment lifecycle — from student registration to final placement.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/MySQL-8-005C84?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazon-ec2&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

---

## 📑 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Deployment Architecture](#-deployment-architecture)
- [Backend Layered Architecture](#-backend-layered-architecture)
- [ER Diagram](#-er-diagram)
- [Workflows](#-workflows)
- [API Modules](#-api-modules)
- [Security Features](#-security-features)
- [Live Demo](#-live-demo)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Deployment Guide](#-deployment-guide)
- [Future Enhancements](#-future-enhancements)
- [Author](#-author)
- [License](#-license)

---

## 📖 About the Project

The **Campus Placement Management System** is a production-ready, full-stack web application that digitalizes and automates the campus recruitment process for engineering institutions.

It provides **four dedicated portals** for different stakeholders:

| Role | Capabilities |
|---|---|
| 🎓 **Student** | Browse jobs, apply, upload resume, track application status, use AI assistant |
| 🏢 **Company / Recruiter** | Post jobs, review applicants, manage interview rounds, update offer status |
| 👨‍💼 **Placement Officer** | Monitor all placements, analytics dashboard, generate reports |
| 🛡️ **Admin** | Approve/block users, manage companies, view audit logs |

---

## ✨ Features

- **Role-Based Access Control (RBAC):** Four completely isolated portals — Student, Company, Placement Officer, and Admin — each with dedicated APIs and UI.

- **JWT Authentication:** Stateless, token-based authentication. Every API call is validated by a custom `JwtFilter` that reads the `Authorization: Bearer <token>` header.

- **Resume Upload & Auto Skill Extraction:** Students upload PDF resumes directly to **Cloudinary** (private storage). The system automatically parses the PDF using **Apache PDFBox** and extracts skills, merging them into the student's profile.

- **AI Career Assistant:** A context-aware chatbot powered by **Google Gemini AI**. It fetches the student's actual data (applications, jobs, profile) from the database, builds a system prompt, and sends it to Gemini — delivering personalized, intelligent answers.

- **Job Management:** Companies can post jobs with title, description, eligibility, and interview rounds. Jobs support status management (`OPEN` / `CLOSED`) and flagging.

- **Application Tracking:** Students view real-time application statuses — `PENDING`, `SHORTLISTED`, `SELECTED`, `REJECTED`, or `IN_PROGRESS` (when interview rounds are active).

- **Server-Side Pagination & Sorting:** All major data listings — job postings, applicants per job, and student applications — are paginated and sorted server-side using Spring Data's `Pageable`. This ensures smooth performance even with thousands of records.

- **Automated Interview Round Management:** When a company marks an application as `SELECTED` and the job has defined rounds (e.g., `Aptitude, Technical, HR`), the system **automatically creates Round entities** and sets the application to `IN_PROGRESS`.

- **Email Notifications (Gmail SMTP):** Async, non-blocking emails are triggered for:
  - Job application confirmation
  - Interview round scheduling
  - Application status updates
  - Forgot Password / Password Reset

- **Real-Time Notifications:** In-app notification system with WebSocket support so students receive instant updates.

- **Performance Optimization with Redis:** Dashboard analytics and frequently accessed data are cached using **Redis**, significantly reducing database load and improving response times.

- **Swagger / OpenAPI Documentation:** Every API endpoint is documented and interactively testable via Swagger UI.

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI Framework & Build Tool |
| Tailwind CSS | Styling |
| React Router DOM | Client-Side Routing |
| Axios | HTTP Client for REST APIs |

### Backend
| Technology | Purpose |
|---|---|
| Java 21 | Core Language |
| Spring Boot 3 | Application Framework |
| Spring Security + JWT | Authentication & Authorization |
| Spring Data JPA + Hibernate | ORM & Database Layer |
| Spring Cache + Redis | Performance Caching |
| Apache PDFBox | Resume PDF Parsing |
| JavaMailSender | Email Delivery |

### Database & Caching
| Technology | Purpose |
|---|---|
| MySQL 8 | Primary Relational Database |
| Redis | Cache Layer |

### Cloud & External Services
| Service | Purpose |
|---|---|
| AWS EC2 (Ubuntu) | Backend + DB Hosting |
| Vercel | Frontend Hosting + CDN |
| Cloudinary | Secure PDF Resume Storage |
| Google Gemini AI | AI Career Assistant |
| Gmail SMTP | Transactional Emails |

---

## 🏛 System Architecture

![System Architecture](docs/images/system-architecture.png)

The system follows a **Three-Tier Architecture** deployed across cloud providers:

1. **Presentation Layer (Vercel):** React SPA served globally via Vercel CDN. All `/api/*` requests are proxied to the EC2 backend to avoid Mixed Content (HTTP/HTTPS) issues.
2. **Business Logic Layer (AWS EC2):** Spring Boot application running as a `systemd` service on port `8081`. Hosts all REST controllers, security filters, service classes, and integrations.
3. **Data Layer (AWS EC2):** MySQL (`3306`) and Redis (`6379`) run locally on the same EC2 instance for ultra-low latency. Cloudinary, Gemini, and Gmail are consumed as external cloud APIs.

---

## ☁️ Deployment Architecture

![Deployment Diagram](docs/images/deployment-diagram.png)

- **Vercel** serves the static React build and proxies API calls to EC2 over HTTPS.
- **AWS EC2 Ubuntu Server** runs the Spring Boot JAR as a `systemd` service that auto-restarts on crash/reboot.
- **MySQL (3306)** stores all relational data: Users, Jobs, Applications, Rounds, Notifications, and Audit Logs.
- **Redis (6379)** acts as the caching layer for dashboard metrics.
- **Cloudinary** stores student resume PDFs as private assets accessible only via signed URLs.
- **Google Gemini AI** is called via REST from the backend whenever a student sends a chat message.
- **Gmail SMTP** dispatches transactional emails asynchronously using `@Async`.

---

## 🏗 Backend Layered Architecture

![Backend Layered Architecture](docs/images/backend-layered-architecture.png)

| Layer | Components |
|---|---|
| **Controller Layer** | AuthController, JobController, ApplicationController, ChatController, AdminController, RoundController, NotificationController, AnalyticsController |
| **Security Layer** | JwtFilter, SecurityConfig, BCrypt PasswordEncoder, CORS Config |
| **Service Layer** | AuthService, ApplicationService, ChatService, FileUploadService, EmailService, NotificationService, CacheService |
| **Repository Layer** | UserRepository, JobRepository, ApplicationRepository, RoundRepository, NotificationRepository |
| **Database Layer** | MySQL via Spring Data JPA / Hibernate |
| **Cache Layer** | Redis via Spring Cache |

---

## 🗄 ER Diagram

![ER Diagram](docs/images/er-diagram.png)

**Core Entities & Relationships:**

| Relationship | Cardinality |
|---|---|
| User (COMPANY) → Job | One-to-Many |
| User (STUDENT) → Application | One-to-Many |
| Job → Application | One-to-Many |
| Application → Round | One-to-Many |
| User → AuditLog | One-to-Many |

---

## 🔄 Workflows

### JWT Authentication Flow
![JWT Authentication Flow](docs/images/jwt-authentication-flow.png)

> The student submits credentials → `AuthService` validates email/password via BCrypt → `JwtUtil` generates a signed JWT → token is stored client-side. Every subsequent request passes through `JwtFilter`, which extracts the email from the token, loads the user from the database, and sets the user context for the controller.

---

### Job Application Workflow
![Job Application Workflow](docs/images/job-application-workflow.png)

> Student clicks Apply → JWT is validated → `ApplicationService` checks: job exists, student has a resume uploaded, no duplicate application → Application is saved with status `PENDING` → Confirmation email is sent asynchronously. When the company marks the application `SELECTED`, interview rounds are auto-created and the status moves to `IN_PROGRESS`.

---

### Resume Upload & AI Assistant Workflow
![Resume Upload & AI Workflow](docs/images/resume-upload-ai-workflow.png)

> **Resume Upload:** Student selects a PDF → multipart request sent with JWT → `FileUploadService` uploads bytes to Cloudinary → `ResumeParserService` auto-extracts skills → user record updated in MySQL.
>
> **AI Chat:** Student sends a message → `ChatService` detects intent, fetches relevant DB context (applications, jobs, profile) → builds a system prompt → sends to Google Gemini API via `RestTemplate` → returns a personalized response.

---

## 🌐 API Modules

All endpoints are fully documented and testable via **[Swagger UI](http://3.208.20.63:8081/swagger-ui/index.html)**.

| Module | Base Path | Description |
|---|---|---|
| **Authentication** | `/api/auth` | Register, Login, Forgot Password, Reset Password |
| **Profile** | `/api/profile` | View and update user profile |
| **Jobs** | `/api/jobs` | Create, list, search, filter, and manage job postings |
| **Applications** | `/api/applications` | Apply for jobs, upload resume, track status, parse resume |
| **Rounds** | `/api/rounds` | Schedule interview rounds, add feedback and scores |
| **Dashboard** | `/api/dashboard` | Real-time analytics and statistics (Redis cached) |
| **AI Assistant** | `/api/chat` | Context-aware Gemini AI chatbot |
| **Admin** | `/api/admin` | Approve/block users, manage companies, audit logs |
| **Notifications** | `/api/notifications` | Real-time in-app notifications |

---

## 🔒 Security Features

| Feature | Implementation |
|---|---|
| **Stateless Authentication** | JSON Web Tokens (JWT) via custom `JwtFilter` |
| **Password Security** | BCrypt hashing (Spring Security `PasswordEncoder`) |
| **Role-Based Access Control** | Manual role checks in every controller + `SecurityConfig` |
| **CORS Policy** | Explicitly whitelisted origins in `WebConfig` |
| **Company Approval Gate** | Companies cannot log in until an Admin approves their account |
| **Input Validation** | Hibernate Validator annotations (`@Valid`, `@NotBlank`, etc.) |

---

## 🚀 Live Demo

| Resource | URL |
|---|---|
| 🌐 **Frontend (Vercel)** | [https://campus-placement-frontend-nu.vercel.app](https://campus-placement-frontend-nu.vercel.app) |
| ⚙️ **Backend API (EC2)** | http://3.208.20.63:8081 |
| 📖 **Swagger UI** | [http://3.208.20.63:8081/swagger-ui/index.html](http://3.208.20.63:8081/swagger-ui/index.html) |
| 📄 **OpenAPI JSON** | [http://3.208.20.63:8081/v3/api-docs](http://3.208.20.63:8081/v3/api-docs) |

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js v18+
- Java 21
- Apache Maven 3.9+
- MySQL 8
- Redis Server

---

### 1. Clone the Repository

```bash
git clone https://github.com/shrenik879/CampusPlacementManagement.git
cd CampusPlacementManagement
```

---

### 2. Backend Setup

Set the required environment variables (see [Environment Variables](#-environment-variables) below), then run:

```bash
mvn clean install
mvn spring-boot:run
```

The backend starts on **http://localhost:8081**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**

---

## 🔑 Environment Variables

Set these as OS environment variables or in a `.env` file before running the backend.

| Variable | Description | Example |
|---|---|---|
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `yourpassword` |
| `JWT_SECRET` | Long random secret for JWT signing | `your_64_char_secret` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `MAIL_USERNAME` | Gmail address for SMTP | `yourmail@gmail.com` |
| `MAIL_PASSWORD` | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

> See `.env.example` in the root directory for a ready-to-copy template.

---

## 🚢 Deployment Guide

### Backend (AWS EC2)

1. Build the JAR locally:
   ```bash
   mvn clean package -DskipTests
   ```
2. Transfer the JAR to your EC2 instance:
   ```bash
   scp target/campusPlacementSystem-0.0.1-SNAPSHOT.jar ubuntu@your-ec2-ip:~/app/
   ```
3. Create a `systemd` service at `/etc/systemd/system/springboot-app.service` to keep the backend alive across reboots:
   ```ini
   [Unit]
   Description=Campus Placement Spring Boot App

   [Service]
   User=ubuntu
   ExecStart=/usr/bin/java -jar /home/ubuntu/app/campusPlacementSystem-0.0.1-SNAPSHOT.jar
   EnvironmentFile=/home/ubuntu/app/.env
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
4. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable springboot-app
   sudo systemctl start springboot-app
   ```

### Frontend (Vercel)

1. Push the `frontend/` folder to GitHub (already done).
2. Import the repository in [vercel.com](https://vercel.com) and set the root directory to `frontend/`.
3. Add `VITE_API_URL` as a Vercel environment variable pointing to your EC2 backend.
4. Vercel auto-deploys on every push to `main`.

---

## 🔮 Future Enhancements

- **NGINX Reverse Proxy + SSL:** Secure the EC2 backend with HTTPS via Let's Encrypt.
- **OAuth2 Login:** Allow sign-in with Google, GitHub, or LinkedIn.
- **In-Platform Video Interviews:** Integrate WebRTC for real-time video calls.
- **Automated Coding Assessment:** Embed a code editor with judge for online tests.
- **Mobile App:** React Native client for students to track applications on the go.

---

## 👤 Author

**Shrenik Kondekar**
- GitHub: [@shrenik879](https://github.com/shrenik879)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
