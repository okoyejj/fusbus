import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SellerApplicationForm } from "@/components/SellerApplicationForm";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function renderForm() {
  return render(<SellerApplicationForm>
    <label>Business name<input name="businessName" defaultValue="My business" required /></label>
    <button type="submit" value="draft" formNoValidate>Save Draft</button>
    <button type="submit" value="submit">Submit for Review</button>
  </SellerApplicationForm>);
}
describe("application form feedback", () => {
  it("sends a draft intent and navigates after saving", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ submitted: false }) });
    vi.stubGlobal("fetch", fetch);
    renderForm();
    fireEvent.click(screen.getByText("Save Draft"));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/seller/dashboard"));
    expect(fetch.mock.calls[0][1].body.get("intent")).toBe("draft");
    expect(fetch.mock.calls[0][1].body.get("businessName")).toBe("My business");
  });
  it("submits the form and shows the success page", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ submitted: true }) });
    vi.stubGlobal("fetch", fetch);
    renderForm();
    fireEvent.click(screen.getByText("Submit for Review"));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/seller/application?submitted=1"));
    expect(fetch.mock.calls[0][1].body.get("intent")).toBe("submit");
  });
  it("keeps typed entries when the network fails and allows retry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderForm();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Unsaved work" } });
    fireEvent.click(screen.getByText("Save Draft"));
    await screen.findByRole("alert");
    expect(screen.getByRole("textbox")).toHaveValue("Unsaved work");
    expect(screen.getByText("Save Draft")).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });
  it("explains how to recover an expired session without losing entries", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) }));
    renderForm();
    fireEvent.click(screen.getByText("Save Draft"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sign in again in another tab");
    expect(screen.getByRole("textbox")).toHaveValue("My business");
  });
});
