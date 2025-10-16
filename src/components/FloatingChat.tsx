"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "./ui/label";
import { Spinner } from "./ui/spinner";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState<string>("gpt-4o");
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, status, sendMessage, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    if (error) console.error("Chat error:", error);
  }, [error]);

  // When open changes: focus textarea and lock body scroll
  useEffect(() => {
    if (open) {
      // small timeout to ensure PromptInputTextarea is mounted
      setTimeout(() => textareaRef.current?.focus(), 80);
      // lock body scroll (optional)
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    // no cleanup needed when closed
    return;
  }, [open]);

  // Close on outside click & Escape
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Use composedPath to be robust with shadow DOM / portals
      const path = (e as any).composedPath?.() ?? [];
      if (path.length) {
        if (path.includes(panelRef.current) || path.includes(buttonRef.current)) {
          return; // click inside panel or on the button -> ignore
        } else {
          setOpen(false);
          return;
        }
      }

      // Fallback: typical contains check
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    // use capture so we get the event before other handlers if needed
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSubmit = (message: any) => {
    const hasText = Boolean(message?.text?.trim());
    const hasAttachments = Boolean(message?.files?.length);
    if (!hasText && !hasAttachments) return;

    sendMessage(
      { text: message.text || "Sent with attachments", files: message.files },
      { body: { model, webSearch: useWebSearch } }
    );
  };

  return (
    <>
      {/* Floating open button */}
      <button
        ref={buttonRef}
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="fixed right-6 bottom-6 z-50 inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg focus:ring-4"
        title={open ? "Fermer le chat" : "Ouvrir le chat"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.15l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.15 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed right-6 bottom-2 z-50 w-[420px] h-[96vh] max-h-[96vh] rounded-2xl overflow-hidden transition-all ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        role="dialog"
        aria-label="Chat support"
      >
        <Card className="h-full shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center justify-between px-4 pb-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold">AI</div>
                <div>
                  <h3 className="text-sm font-semibold">Assistant IA</h3>
                  <p className="text-xs text-muted-foreground">{status}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(status === "submitted" || status === "streaming") && (
                <Spinner  />
                )}
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  X
                </Button>
              </div>
            </header>

            {/* Conversation area */}
            <Conversation className="relative w-full h-full">
              <ConversationContent>
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    icon={<MessageSquare className="w-8 h-8" />}
                    title="Aucun message"
                    description="Bonjour, je suis là pour vous assister dans la gestion de vos projets. Demandez-moi de créer un projet avec titre, description, statut, l'idée, la date d'échéance."
                  />
                ) : (
                  messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.parts.map((part: any, i: number) =>
                          part.type === "text" ? <Response key={`${message.id}-${i}`}>{part.text}</Response> : null
                        )}
                      </MessageContent>
                    </Message>
                  ))
                )}
              </ConversationContent>

              <ConversationScrollButton />
            </Conversation>

            {/* PromptInput */}
            <div className="px-4 pb-0">
              <PromptInput onSubmit={handleSubmit} className="relative" globalDrop multiple>
                <PromptInputBody>
                  <PromptInputTextarea
                    ref={textareaRef}
                    placeholder="Écrire un message... (Entrée pour envoyer, Shift+Entrée pour saut de ligne)"
                  />
                </PromptInputBody>

                <PromptInputToolbar>
                  <PromptInputTools>
                    {/* <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger />
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu> */}

                    <PromptInputModelSelect onValueChange={(v) => setModel(v)} value={model} defaultValue="iAme-PRO">
                      <PromptInputModelSelectTrigger />
                      <PromptInputModelSelectContent>
                        <Label className="px-3 py-1 text-xs text-muted-foreground">iAme-PRO</Label>
                        <PromptInputModelSelectItem value="gpt">iAme-PRO</PromptInputModelSelectItem>
                      </PromptInputModelSelectContent>
                      <PromptInputModelSelectValue />
                    </PromptInputModelSelect>
                  </PromptInputTools>

                  <PromptInputSubmit status={status === "streaming" ? "streaming" : "ready"} />
                </PromptInputToolbar>
              </PromptInput>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
