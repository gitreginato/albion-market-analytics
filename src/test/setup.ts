import { vi } from "vitest";

// Mock global fetch so every test starts with a controllable fetch.
// Individual tests queue responses with mockResolvedValueOnce / mockImplementation.
vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
  throw new Error("fetch not mocked in this test — queue a response with mockResolvedValueOnce");
});
