export {};

declare global {
  interface Window {
    electron?: {
      platform: string;
      setBadge: (count: number) => void;
    };
  }
}
