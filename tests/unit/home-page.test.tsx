import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("explains the product and its privacy promise", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /手を入れるだけ/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/映像は端末内だけで処理/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /カメラを始める/ }),
    ).toHaveAttribute("href", "/play");
  });
});
