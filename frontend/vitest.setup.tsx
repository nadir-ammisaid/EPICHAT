import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  routerBackMock,
  routerPrefetchMock,
  routerPushMock,
  routerRefreshMock,
  routerReplaceMock,
  resetRouterMocks,
} from "@/test/mocks/nextNavigation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
    prefetch: routerPrefetchMock,
    back: routerBackMock,
    refresh: routerRefreshMock,
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string | { pathname?: string };
  }) => {
    const resolvedHref =
      typeof href === "string" ? href : href.pathname || "/";

    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  resetRouterMocks();
});
