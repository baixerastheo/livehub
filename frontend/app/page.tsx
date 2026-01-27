export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: "1.5rem",
        gap: "0.75rem",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600 }}>Welcome to LiveHub</h1>
      <p style={{ fontSize: "0.95rem", color: "rgba(0, 0, 0, 0.7)" }}>
        Select or start a conversation from the left to begin chatting.
      </p>
    </main>
  );
}
