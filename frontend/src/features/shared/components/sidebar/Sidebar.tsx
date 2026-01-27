import styles from "../../styles/sidebar/Sidebar.module.css";
import { useAppStore } from "@/src/core/store/appStore";

export function Sidebar() {
  const isOpen = useAppStore((state) => state.isSidebarOpen);
  const closeSidebar = useAppStore((state) => state.closeSidebar);
  const openLoginModal = useAppStore((state) => state.openLoginModal);

  return (
    <>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Fermer la liste des conversations"
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
          onClick={openLoginModal}
        >
          Start conversation
        </button>
      </aside>
      {isOpen && (
        <button
          type="button"
          className={styles.sidebarBackdrop}
          aria-label="Fermer la liste des conversations"
          onClick={closeSidebar}
        />
      )}
    </>
  );
}


