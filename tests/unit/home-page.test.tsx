import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("explains the product and its privacy promise", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /時間で確かめよう/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/映像は端末内で処理/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/shin7303/janken-judge-ai",
    );
  });
});
