# Contributing Guide

Welcome — thank you for contributing!

## Branch naming

- Use `feat/<task>` for new features; for admin features specifically use `feat/admin-<feature-name>`.

## Pull Request checklist

- Follow the `.github/PULL_REQUEST_TEMPLATE.md` checklist.
- Unit tests and E2E tests must pass when opening a PR.
- Include manual testing steps and CLI commands for running the services locally.
- Update `CHANGELOG.md` if present.
- Add required labels for the PR: `frontend`, `backend`, `e2e` as necessary.

## Security & Architecture notes

- Review X-CSRF headers in frontend calls and server endpoints.
- Ensure admin routes are protected with a `ProtectedRoute` (frontend) or a server side admin-only permission.
- Always avoid committing API keys, secrets, or private credentials in the repo.

## How we test

- Backend: pytest
- Frontend unit tests: vitest/Jest
- End-to-end tests: Playwright

Thank you for keeping the codebase secure and maintainable.
