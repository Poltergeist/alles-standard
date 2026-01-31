import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://alles-standard.social',
  integrations: [tailwind()],
  output: 'static',
  trailingSlash: 'always',
});
