import { vi } from "vitest";

export const routerPushMock = vi.fn();
export const routerReplaceMock = vi.fn();
export const routerPrefetchMock = vi.fn();
export const routerBackMock = vi.fn();
export const routerRefreshMock = vi.fn();

export function resetRouterMocks() {
  routerPushMock.mockReset();
  routerReplaceMock.mockReset();
  routerPrefetchMock.mockReset();
  routerBackMock.mockReset();
  routerRefreshMock.mockReset();
}
