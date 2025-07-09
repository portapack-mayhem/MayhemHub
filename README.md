# Mayhem Hub

## [Live Site → HackRF.app](https://hackrf.app/)

The web interface for everything HackRF/Portapack Mayhem. This project provides a comprehensive, browser-based dashboard to interact with your device, eliminating the need for command-line tools or constant SD card swapping for many common tasks.

This application is a Progressive Web App (PWA), so you can install it on your desktop and use it offline!

## What is this?

If you are new to the _HackRF + PortaPack + Mayhem firmware_, this video provides a great overview of what the firmware can do:

[<img alt="The Best HackRF Portapack Firmware Yet - Mayhem Version 2" src="https://img.youtube.com/vi/WZqCENz-YAg/maxresdefault.jpg" width="512">](https://www.youtube.com/watch?v=WZqCENz-YAg)

Mayhem Hub extends the functionality of your device by bringing it to your web browser.

## Features

- **Live Screen Streaming**: View your PortaPack's screen in real-time on your computer.
- **Remote Control**: Interact with your device's screen and buttons directly from the web UI, including keyboard shortcuts.
- **File Management**: Upload and download files to/from your device's SD card without removing it.
- **One-Click Firmware Updates**: Easily update to the latest stable or nightly Mayhem firmware builds.
- **Custom Firmware Flashing**: Flash `.tar` firmware files of your choice.
- **Serial Console**: Access a full serial console for sending commands and viewing logs.
- **Scripting**: Run `.ppsc` scripts on your device.
- **PWA Support**: Installable as a desktop app for a native-like experience and offline access.
- **Customizable UI**: Toggle visibility of different UI components to suit your workflow.

## Requirements

### Hardware & Firmware

- A **HackRF** with a **PortaPack**.
- **Mayhem Firmware**: Ensure you are running at least stable version `v2.0.0` or nightly `n_240114` (or newer).
- Your PortaPack must be in **normal mode** (not HackRF mode) to connect.

### Browser Support

This application relies on the **Web Serial API**, which is not supported by all browsers. For the best experience, please use a compatible browser like:

- Google Chrome
- Microsoft Edge
- Opera

You can check the latest browser compatibility on [caniuse.com/web-serial](https://caniuse.com/web-serial).

### Operating System Notes

- **macOS Users**: There are known issues with Web Serial on macOS. If you encounter problems, please check and contribute to the discussion [here](https://github.com/portapack-mayhem/MayhemHub/issues/43).

## Tech Stack

- [Next.js](https://nextjs.org/) - React Framework
- [TypeScript](https://www.typescriptlang.org/) - Language
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [DaisyUI](https://daisyui.com/) - Tailwind CSS Component Library
- [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) - Hardware Communication
- [PWA](https://web.dev/progressive-web-apps/) - for app-like features and offline support

## Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.17.0 or later)
- npm, yarn, or pnpm

### Installation & Running

1.  **Clone the repository:**

```bash
    git clone https://github.com/portapack-mayhem/MayhemHub.git
    cd MayhemHub
```

2.  **Install dependencies:**

```bash
    npm install
```

3.  **Run the development server:**

```bash
    npm run dev
```

    You can also use `yarn dev`, `pnpm dev`, or `bun dev`.

4.  Open [http://localhost:3000](http://localhost:3000) with a compatible browser to see the result.

### Other Scripts

- **Build for production:**

```bash
  npm run build
```

- **Lint the project:**

```bash
  npm run lint
```

## Cloudflare Development

To run the Cloudflare Functions locally for development, you can use Wrangler:

```bash
npx wrangler pages dev public
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
