import styles from "../../styles/sidebar/Sidebar.module.css";
import { useAppStore } from "@/src/core/store/appStore";

export function Sidebar() {
  const isOpen = useAppStore((state) => state.isSidebarOpen);
  const section = useAppStore((state) => state.sidebarSection);
  const closeMobileSidebars = useAppStore((state) => state.closeMobileSidebars);

  const header =
    section === "activity"
      ? "Notifications"
      : section === "teams"
        ? "Servers"
        : "Conversations";

  return (
    <>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close conversation list"
          onClick={closeMobileSidebars}
        >
          ×
        </button>
        <div className={styles.header}>{header}</div>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {section === "activity"
              ? "No notification"
              : section === "teams"
                ? "No server"
                : "No conversation"}
          </p>
          <p className={styles.emptySubtitle}>
            {section === "activity"
              ? "Your recent activity will appear here."
              : section === "teams"
                ? "Join or create a server to see it here."
                : "Start a new conversation to see it here."}
          </p>
        </div>
        {section === "conversation" && (
          <button type="button" className={styles.startButton}>
            Start conversation
          </button>
        )}
      </aside>
      {isOpen && (
        <button
          type="button"
          className={styles.sidebarBackdrop}
          aria-label="Close conversation list"
          onClick={closeMobileSidebars}
        />
      )}
    </>
  );
}
