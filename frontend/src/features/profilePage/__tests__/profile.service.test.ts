import { getAcceptedAvatarTypes, uploadAvatar } from "../profile.service";

jest.mock("@/src/lib/apiClient", () => ({
  fetchFormData: jest.fn(),
}));

import { fetchFormData } from "@/src/lib/apiClient";
const mockFetchFormData = fetchFormData as jest.MockedFunction<typeof fetchFormData>;

beforeEach(() => {
  mockFetchFormData.mockReset();
});

describe("getAcceptedAvatarTypes", () => {
  it("returns the accepted MIME types string", () => {
    expect(getAcceptedAvatarTypes()).toBe("image/jpeg,image/png,image/webp");
  });
});

describe("uploadAvatar", () => {
  it("calls the correct endpoint with POST", async () => {
    mockFetchFormData.mockResolvedValue({ path: "avatars/u1.jpg", avatarUrl: "https://example.com/u1.jpg" });
    const file = new File(["content"], "avatar.jpg", { type: "image/jpeg" });
    await uploadAvatar(file);
    expect(mockFetchFormData).toHaveBeenCalledWith(
      "/users/me/avatar",
      expect.any(FormData),
      "POST",
    );
  });

  it("appends the file under the 'file' field", async () => {
    mockFetchFormData.mockResolvedValue({ path: "x", avatarUrl: "https://x.com" });
    const file = new File(["img"], "photo.png", { type: "image/png" });
    await uploadAvatar(file);
    const formData = mockFetchFormData.mock.calls[0][1] as FormData;
    expect(formData.get("file")).toBe(file);
  });

  it("returns the upload response", async () => {
    const response = { path: "avatars/u1.jpg", avatarUrl: "https://example.com/u1.jpg" };
    mockFetchFormData.mockResolvedValue(response);
    const file = new File(["content"], "avatar.jpg", { type: "image/jpeg" });
    expect(await uploadAvatar(file)).toEqual(response);
  });
});
