import type { Config } from 'tailwindcss';
const preset = require('../../packages/config/tailwind-preset');

const config: Config = {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
};

export default config;
