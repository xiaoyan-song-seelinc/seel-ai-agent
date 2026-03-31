import { useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { Topic, Message } from "@/lib/mock-data";

export interface MessageSender {
  sendNewMessage: (text: string) => void;
  sendReply: (topicId: string, text: string) => void;
  isReplying: boolean;
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateTopicId(): string {
  return `topic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useMessageSender(): MessageSender {
  const { addTopic, updateTopic, topics } = useStore();
  const [isReplying, setIsReplying] = useState(false);

  const sendNewMessage = useCallback(
    (text: string) => {
      const now = new Date().toISOString();
      const managerMsg: Message = {
        id: generateId(),
        sender: "manager",
        content: text,
        timestamp: now,
      };

      const newTopic: Topic = {
        id: generateTopicId(),
        type: "open_question",
        title: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
        status: "unread",
        createdAt: now,
        updatedAt: now,
        preview: text,
        messages: [managerMsg],
      };

      addTopic(newTopic);
      setIsReplying(true);

      setTimeout(() => {
        const replyMsg: Message = {
          id: generateId(),
          sender: "ai",
          content: "Got it. I'll look into that and follow up shortly.",
          timestamp: new Date().toISOString(),
        };
        updateTopic(newTopic.id, {
          messages: [managerMsg, replyMsg],
          updatedAt: new Date().toISOString(),
        });
        setIsReplying(false);
      }, 1500);
    },
    [addTopic, updateTopic],
  );

  const sendReply = useCallback(
    (topicId: string, text: string) => {
      const now = new Date().toISOString();
      const topic = topics.find((t) => t.id === topicId);
      if (!topic) return;

      const managerMsg: Message = {
        id: generateId(),
        sender: "manager",
        content: text,
        timestamp: now,
      };

      const updatedMessages = [...topic.messages, managerMsg];
      updateTopic(topicId, {
        messages: updatedMessages,
        updatedAt: now,
      });

      setIsReplying(true);

      setTimeout(() => {
        const currentTopic = topics.find((t) => t.id === topicId);
        const latestMessages = currentTopic
          ? [...currentTopic.messages, managerMsg]
          : updatedMessages;

        const aiReply: Message = {
          id: generateId(),
          sender: "ai",
          content: "Thanks for the clarification. I'll update my proposal accordingly.",
          timestamp: new Date().toISOString(),
        };

        updateTopic(topicId, {
          messages: [...latestMessages, aiReply],
          updatedAt: new Date().toISOString(),
        });
        setIsReplying(false);
      }, 1500);
    },
    [topics, updateTopic],
  );

  return {
    sendNewMessage,
    sendReply,
    isReplying,
  };
}
