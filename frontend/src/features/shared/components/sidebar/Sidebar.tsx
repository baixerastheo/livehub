import styles from "../../styles/sidebar/Sidebar.module.css";
import { useAppStore } from "@/src/core/store/appStore";

export function Sidebar() {
  const isOpen = useAppStore((state) => state.isSidebarOpen);
  const closeSidebar = useAppStore((state) => state.closeSidebar);
  const openAuthModal = useAppStore((state) => state.openAuthModal);

  return (
    <>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close conversation list"
          onClick={closeSidebar}
        >
          ×
        </button>
        <div className={styles.header}>Conversations</div>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No conversation</p>
          <p className={styles.emptySubtitle}>
            Start a new conversation to see it here.
          </p>
        </div>
        <button
          type="button"
          className={styles.startButton}
          onClick={() => openAuthModal("login")}
        >
          Start conversation
        </button>
      </aside>
      {isOpen && (
        <button
          type="button"
          className={styles.sidebarBackdrop}
          aria-label="Close conversation list"
          onClick={closeSidebar}
        />
      )}
    </>
  );
}


