"use client";

import React from "react";
import styles from "../styles/MessagesScreen.module.css";
import {
  MOCK_CONVERSATION,
  type ChatMessage,
} from "@/src/features/messages/messages.mock";
import { ParticlesBackground } from "@/src/features/messages/components/ParticlesBackground";
import { ConversationHeader } from "@/src/features/messages/components/ConversationHeader";
import { MessageList } from "@/src/features/messages/components/MessageList";
import { MessageComposer } from "@/src/features/messages/components/MessageComposer";
import { ConversationDetailsPanel } from "@/src/features/messages/components/ConversationDetailsPanel";

export function MessagesScreen() {
  const [rightPanelOpen, setRightPanelOpen] = React.useState(true);
  const [composerValue, setComposerValue] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  const send = () => {
    const trimmed = composerValue.trim();
    if (!trimmed) return;

    const newMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      author: "Me",
      content: trimmed,
      createdAtIso: new Date().toISOString(),
      isMe: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setComposerValue("");
  };

  return (
    <main className={styles.root}>
      <ConversationHeader
        header={MOCK_CONVERSATION}
        onToggleDetails={() => setRightPanelOpen((v) => !v)}
      />

      <div className={styles.content}>
        <section className={styles.thread} aria-label="Message thread">
          <ParticlesBackground tone="black" />
          <MessageList messages={messages} />
          <MessageComposer
            value={composerValue}
            onChange={setComposerValue}
            onSubmit={send}
          />
        </section>

        {rightPanelOpen ? (
          <ConversationDetailsPanel
            mode="Private message"
            activeTitle={MOCK_CONVERSATION.title}
          />
        ) : null}
      </div>
    </main>
  );
}
