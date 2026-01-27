import styles from "../../styles/sidebar/Sidebar.module.css";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onStartConversation?: () => void;
};

export function Sidebar({ isOpen, onClose, onStartConversation }: SidebarProps) {
  return (
    <>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        {onClose && (
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Fermer la liste des conversations"
            onClick={onClose}
          >
            ×
          </button>
        )}
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
          onClick={onStartConversation}
        >
          Start conversation
        </button>
      </aside>
      {isOpen && (
        <button
          type="button"
          className={styles.sidebarBackdrop}
          aria-label="Fermer la liste des conversations"
          onClick={onClose}
        />
      )}
    </>
  );
}


