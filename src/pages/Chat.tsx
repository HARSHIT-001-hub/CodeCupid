import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, UserProfile } from "@/context/AuthContext";
import {
  subscribeToMessages, sendMessage, setTypingStatus, subscribeToTyping, ChatMessage,
} from "@/services/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";

const Chat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });
    return unsub;
  }, [chatId, scrollToBottom]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToTyping(chatId, setTyping);
    return unsub;
  }, [chatId]);

  // Load chat partner name
  useEffect(() => {
    if (!chatId || !profile) return;
    const loadChat = async () => {
      const chatSnap = await getDoc(doc(db, "chats", chatId));
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        if (data.projectTitle) {
          setPartnerName(`📁 ${data.projectTitle}`);
        } else {
          const partnerUid = (data.participants as string[]).find(u => u !== profile.uid);
          if (partnerUid) {
            const userSnap = await getDoc(doc(db, "users", partnerUid));
            setPartnerName(userSnap.data()?.name || "Unknown");
          }
        }
      }
    };
    loadChat();
  }, [chatId, profile]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!chatId || !profile) return;
    setTypingStatus(chatId, profile.uid, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(chatId, profile.uid, false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !chatId || !profile) return;
    setSending(true);
    try {
      await sendMessage(chatId, profile.uid, newMsg.trim());
      setNewMsg("");
      await setTypingStatus(chatId, profile.uid, false);
    } catch (err) {
      console.error("Send failed:", err);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check if partner is typing
  const isPartnerTyping = profile
    ? Object.entries(typing).some(([uid, isTyping]) => uid !== profile.uid && isTyping)
    : false;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-display font-semibold">{partnerName || "Chat"}</h2>
            <AnimatePresence>
              {isPartnerTyping && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-primary"
                >
                  typing...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-20 text-muted-foreground text-sm">
              No messages yet. Say hello! 👋
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === profile?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "glass-card rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })}

          {/* Typing animation */}
          <AnimatePresence>
            {isPartnerTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
                <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-4 flex items-center gap-2">
          <input
            value={newMsg}
            onChange={(e) => { setNewMsg(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!newMsg.trim() || sending}
            className="p-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 btn-primary-glow transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
