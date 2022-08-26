import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
    fullyParallel: true,
    reporter: [
        ['html', { outputDir: 'test-results' }],
    ],
    timeout: 1000 * 60 * 60,
};

export default config;