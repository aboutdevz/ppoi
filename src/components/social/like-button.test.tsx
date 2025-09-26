import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LikeButton } from "@/components/social/like-button";
import { api } from "@/lib/api";

// Mock the API
vi.mock("@/lib/api");
const mockedApi = vi.mocked(api);

describe("LikeButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial like count", () => {
    render(
      <LikeButton
        imageId="test-image"
        initialLiked={false}
        initialLikeCount={5}
      />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders in liked state", () => {
    render(
      <LikeButton
        imageId="test-image"
        initialLiked={true}
        initialLikeCount={5}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-red-500");
  });

  it("handles like action correctly", async () => {
    mockedApi.likeImage.mockResolvedValue({
      isLiked: true,
      likeCount: 6,
    });

    render(
      <LikeButton
        imageId="test-image"
        initialLiked={false}
        initialLikeCount={5}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApi.likeImage).toHaveBeenCalledWith("test-image");
    });

    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("handles unlike action correctly", async () => {
    mockedApi.likeImage.mockResolvedValue({
      success: true,
      isLiked: false,
      likeCount: 4,
    });

    render(
      <LikeButton
        imageId="test-image"
        initialLiked={true}
        initialLikeCount={5}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApi.likeImage).toHaveBeenCalledWith("test-image");
    });

    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    mockedApi.likeImage.mockRejectedValue(new Error("Network error"));

    render(
      <LikeButton
        imageId="test-image"
        initialLiked={false}
        initialLikeCount={5}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApi.likeImage).toHaveBeenCalledWith("test-image");
    });

    // Should still show original count on error
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("prevents multiple simultaneous clicks", async () => {
    mockedApi.likeImage.mockResolvedValue({
      success: true,
      isLiked: true,
      likeCount: 6,
    });

    render(
      <LikeButton
        imageId="test-image"
        initialLiked={false}
        initialLikeCount={5}
      />,
    );

    const button = screen.getByRole("button");

    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApi.likeImage).toHaveBeenCalledTimes(1);
    });
  });

  it("can hide like count when showCount is false", () => {
    render(
      <LikeButton
        imageId="test-image"
        initialLiked={false}
        initialLikeCount={5}
        showCount={false}
      />,
    );

    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <LikeButton
        imageId="test-image"
        initialLiked={false}
        initialLikeCount={5}
        className="custom-class"
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("supports different sizes", () => {
    const { rerender } = render(<LikeButton imageId="test-image" size="sm" />);

    let button = screen.getByRole("button");
    expect(button).toHaveClass("h-6");

    rerender(<LikeButton imageId="test-image" size="lg" />);

    button = screen.getByRole("button");
    expect(button).toHaveClass("h-10");
  });
});
