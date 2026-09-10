import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SellerMediaManager } from "@/components/SellerMediaManager";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("seller image upload feedback", () => {
  it("shows a clear error before uploading an image above 5 MB", () => {
    render(<SellerMediaManager initialMedia={[]} />);
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "huge.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText(/Profile picture/), { target: { files: [file] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Image too large. Each image must be 5 MB or smaller.");
  });

  it("shows a spinner over the image while it is processed and uploaded", async () => {
    let finishUpload!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finishUpload = resolve; })));
    render(<SellerMediaManager initialMedia={[]} />);
    const file = new File(["image"], "profile.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText(/Profile picture/), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload Profile picture" }));

    expect(await screen.findByRole("status", { name: "Processing profile.jpg" })).toBeInTheDocument();
    finishUpload(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
    await waitFor(() => expect(screen.queryByRole("status", { name: "Processing profile.jpg" })).not.toBeInTheDocument());
  });
});
