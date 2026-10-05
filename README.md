# Text Search & Highlight

A Chromium browser extension that lets you search any webpage for a word or phrase, scroll through matches, customize the highlight color, and copy all results to your clipboard.

## Features

- 🔍 **Search** — find all instances of a word or phrase on the current page
- 📜 **Navigate** — jump between matches with Prev / Next
- 🎨 **Highlight** — choose any background color for matches
- 📋 **Copy** — copy all matched text to your clipboard at once
- 🧹 **Clear** — remove all highlights with one click
- 🌐 **Cross-browser** — works on Chrome, Edge, Brave, Opera, and any Chromium-based browser

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 7 + [@crxjs/vite-plugin](https://crxjs.dev) |
| Manifest | Chrome Extension Manifest V3 |
| Linting | Oxlint |

## Getting Started

### Prerequisites

- Node.js 18+
- A Chromium-based browser

### Install

```bash
npm install   