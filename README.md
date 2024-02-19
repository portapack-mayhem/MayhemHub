# [Live Site - HackRF.app](https://hackrf.app/)

This is a [Next.js](https://nextjs.org/) TypeScript project. We use [Tailwind](https://tailwindcss.com/) for styling.

We have make this website a PWA, so you can load it even without an internet connection!

# What is this?

If you are new to *HackRF+PortaPack+Mayhem*, check this:

[<img alt="The Best HackRF Portapack Firmware Yet - Mayhem Version 2" src="https://img.youtube.com/vi/WZqCENz-YAg/maxresdefault.jpg" width="512">](https://www.youtube.com/watch?v=WZqCENz-YAg)


## Getting Started

First, install the dependencies

```bash
npm i
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cloudflare

To run the Cloudflare Functions locally you can run
`npx wrangler pages dev public`
