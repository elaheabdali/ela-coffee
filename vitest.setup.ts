import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react only auto-cleans the DOM when Vitest runs with
// `globals: true`. This repo does not, so clean up after every test
// explicitly — otherwise renders leak between tests and `getByRole`
// finds duplicate elements.
afterEach(() => {
  cleanup();
});
