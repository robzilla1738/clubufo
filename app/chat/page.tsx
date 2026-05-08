import { Suspense } from "react";
import ChatClient from "./_client";

export const metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <ChatClient />
    </Suspense>
  );
}
