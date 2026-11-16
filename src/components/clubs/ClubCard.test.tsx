import { render, screen } from "@testing-library/react";
import { ClubCard } from "./ClubCard";

const mockClub = {
  id: "1",
  slug: "break-point-colombo",
  name: "Break Point Colombo",
  address: "42 Galle Road, Colombo 03",
  city: "Colombo",
  rating: 4.5,
  ratingCount: 24,
  coverImage: null,
  tables: [
    { id: "t1", type: "SNOOKER" as const, name: "Table 1", pricePerSlot: 1500, clubId: "1", isActive: true, createdAt: new Date() },
    { id: "t2", type: "POOL" as const,    name: "Table 2", pricePerSlot: 1000, clubId: "1", isActive: true, createdAt: new Date() },
  ],
};

describe("ClubCard", () => {
  it("renders club name", () => {
    render(<ClubCard club={mockClub} />);
    expect(screen.getByText("Break Point Colombo")).toBeInTheDocument();
  });

  it("renders address", () => {
    render(<ClubCard club={mockClub} />);
    expect(screen.getByText("42 Galle Road, Colombo 03")).toBeInTheDocument();
  });

  it("renders table type badges", () => {
    render(<ClubCard club={mockClub} />);
    expect(screen.getByText("Snooker")).toBeInTheDocument();
    expect(screen.getByText("Pool")).toBeInTheDocument();
  });

  it("links to club profile", () => {
    render(<ClubCard club={mockClub} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/clubs/break-point-colombo");
  });
});
