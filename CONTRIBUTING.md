# Contributing to AI-Based Smart Attendance System

Thanks for your interest in contributing! This repository is a monorepo containing a Java Spring Boot backend and a frontend application.

## Project Structure

```
backend/    Java Spring Boot REST API (Maven)
frontend/   Frontend application
run.py      Local development launcher
```

## Getting Started

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## How to Contribute

1. Fork the repository and create a feature branch from `main`:
   `git checkout -b feature/your-feature-name`
2. Make your changes with clear, focused commits.
3. Ensure the backend compiles and existing tests pass before opening a PR.
4. Open a pull request describing **what** changed and **why**.

## Guidelines

- Follow the existing code style and package structure.
- Keep pull requests small and focused on a single concern.
- Reference related issues in your PR description.
- Update documentation when adding or changing endpoints/configuration.
