import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  functions: {
    picktravel: {
      name: "PickTravel API",
      source: "server/index.js",
      env: {
        INITIAL_ADMIN_USERNAME: process.env.INITIAL_ADMIN_USERNAME!,
        INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD!,
        SESSION_SECRET: process.env.SESSION_SECRET!,
        ALLOWED_ORIGIN: "https://pickmytravels.com,https://www.pickmytravels.com,https://debendra-256.github.io"
      }
    }
  }
});
