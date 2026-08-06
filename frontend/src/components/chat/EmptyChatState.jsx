import { MessageSquareText } from "lucide-react";

export default function EmptyChatState({ hasScan }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "var(--muted)",
        textAlign: "center",
        padding: 24,
      }}
    >
      <MessageSquareText size={22} style={{ opacity: 0.6 }} />
      <p style={{ fontSize: 13, margin: 0 }}>
        {hasScan
          ? "Ask something about the scanned code or a specific vulnerability."
          : "Select a scanned repository on the left to get started."}
      </p>
    </div>
  );
}
