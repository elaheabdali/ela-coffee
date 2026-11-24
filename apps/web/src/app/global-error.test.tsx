import { describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

/**
 * The global error page renders its own <html>/<body> outside every
 * layout, so it is asserted the same way as the locale layout test:
 * call it as a function and inspect the returned element.
 */
describe("global error page (Phase 8)", () => {
  it("renders a branded bilingual 500 with a retry button, no stack trace", () => {
    const reset = vi.fn();
    const el = GlobalError({ error: new Error("boom"), reset });
    expect(el.type).toBe("html");
    expect(el.props.lang).toBe("fa");
    expect(el.props.dir).toBe("rtl");

    const body = el.props.children as { props: { children: unknown } };
    const main = body.props.children as { props: { children: unknown[] } };
    const children = main.props.children as { props: { children?: unknown } }[];
    const texts = JSON.stringify(children);
    expect(texts).toContain("مشکلی پیش آمد…");
    expect(texts).toContain("Something went wrong");
    expect(texts).toContain("تلاش دوباره");
    expect(texts).not.toContain("boom");
    expect(texts).not.toContain("Error:");
  });
});
