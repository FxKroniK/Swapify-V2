# Swapify V2 – Microservices Platform

**Swapify V2** is a full-stack platform built with a microservices architecture to enable product exchanges between users. The project is under active development, with a focus on modularity, scalability, and separation of concerns.

---

## ⚙️ Backend Architecture

The backend consists of multiple **Spring Boot microservices**, each responsible for a distinct domain (e.g., authentication, user profiles, product listings, etc.).

### 🔁 Inter-Service Communication

- Initially, some services used **WebClient (Spring WebFlux)** to allow for **non-blocking, asynchronous communication**.
- Later on, it was determined that reactive streams were not essential, so newer services adopted **Spring Cloud OpenFeign** for simplicity and readability.
- Currently, both WebClient and Feign clients coexist in the codebase, depending on the phase in which each service was created.

### 🛢️ Databases

- **MySQL** is used for structured, relational data (e.g., users, products).
- **MongoDB** is used in services where flexible document-based storage makes more sense (e.g., storing reviews, logs, or image metadata).
- Credentials are stored in local `application.properties` files for now, as the project is not yet in production.
- Future versions will externalize sensitive data using **environment variables** or a **secrets manager**.

### 🧠 AI & Image Validation

- The backend integrates with **Google Cloud Vision API** to:
  - Validate uploaded images
  - Detect inappropriate or unsafe content
  - Extract metadata if needed

This helps ensure that user-uploaded images meet platform standards.

---

## 🌐 Frontend Overview

The frontend is developed using **Angular** and includes **multiple pages routed through Angular Router**


---

## 🛠️ Technologies Used

### 🧩 Backend

- Java 17, Spring Boot, Spring Cloud
- WebClient (WebFlux) and OpenFeign
- Eureka (service discovery), Spring Cloud Gateway
- MySQL, MongoDB
- Google Cloud Vision API
- Cloudinary (for media storage)

### 🖥️ Frontend

- Angular
- CSS Modules / Angular styles

### 🔧 Tools

- IntelliJ IDEA
- Postman
- Git & GitHub



