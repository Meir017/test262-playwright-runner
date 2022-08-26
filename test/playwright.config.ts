import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
    fullyParallel: true,
    timeout: 1000 * 60 * 60,
};

export default config;