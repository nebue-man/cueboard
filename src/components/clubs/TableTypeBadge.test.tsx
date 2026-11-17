import { render, screen } from "@testing-library/react";
import { TableTypeBadge } from "./TableTypeBadge";

describe("TableTypeBadge", () => {
  it("renders SNOOKER label", () => {
    render(<TableTypeBadge type="SNOOKER" />);
    expect(screen.getByText("Snooker")).toBeInTheDocument();
  });

  it("renders POOL label", () => {
    render(<TableTypeBadge type="POOL" />);
    expect(screen.getByText("Pool")).toBeInTheDocument();
  });
});
