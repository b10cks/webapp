# b10cks - An opinionated headless CMS

<div align="center">
  <img src="assets/logo.svg" alt="b10cks logo" width="120" />
  <h3>The developer-friendly headless CMS</h3>

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-brightgreen.svg)](https://vuejs.org/)
[![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82.svg)](https://nuxt.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
</div>

## Overview

b10cks is a modern, developer-friendly headless CMS built for flexibility and speed. It streamlines content management with an intuitive interface while providing powerful developer tools to build rich digital experiences.

## Features

- **🧩 Block-Based Content Modeling**: Define and compose content structures with reusable blocks
- **🔄 Asset Management**: Comprehensive asset library with folders, tags, and metadata
- **🌐 Multi-Environment Support**: Easily manage and deploy to different environments
- **🌍 Internationalization**: Built-in support for content localization
- **🔌 API-First**: Powerful REST API for seamless integration with any frontend
- **🧰 Developer Tooling**: Extensive SDK and tools for a smooth development experience
- **🔍 Content Preview**: Real-time visual preview with live editing capabilities
- **👥 Team Collaboration**: Role-based access control for efficient teamwork
- **📊 Data Sources**: Structured data management with dimension support
- **🔄 Versioning**: Track content history with comprehensive versioning

## Tech Stack

b10cks Admin interface is built with:

- **Vue 3 + Nuxt 4**: For a powerful and efficient frontend experience
- **TypeScript**: For robust type safety throughout the codebase
- **TanStack Query**: For efficient data fetching and cache management
- **Tailwind CSS**: For beautiful, responsive UI components
- **Laravel Echo + Pusher**: For real-time updates and collaboration

## Getting Started

### Prerequisites

- Node.js (v20 or newer)
- bun

### Installation

```bash
# Clone the repository
git clone https://github.com/b10cks/webapp.git
cd b10cks

# Install dependencies
bun install

# Start the development server
bun run dev
```

### Configuration

Create a `.env` file in the root directory:

```env
NUXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NUXT_PUBLIC_REVERB_APP_KEY=your_reverb_key
NUXT_PUBLIC_REVERB_HOST=your_reverb_host
NUXT_PUBLIC_REVERB_PORT=your_reverb_port
NUXT_PUBLIC_REVERB_SCHEME=https
```

## License

This project is licensed under the [AGPL-3.0-or-later](LICENSE) - see the LICENSE file for details.

## Acknowledgements

- The Vue.js and Nuxt teams for their incredible frameworks
- The open source community for the numerous libraries that made this possible

---

<div align="center">
  <p>Built with 🖤️ by <a href="https://github.com/badmike">Michael Wallner</a></p>
</div>