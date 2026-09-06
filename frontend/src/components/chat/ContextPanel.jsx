import {
  GitBranch,
  ShieldAlert,
  RefreshCw,
  Check,
  MessageSquare,
} from "lucide-react";
import Card from "../layout/Card";

const SEVERITY_COLORS = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
};

function severityCounts(vulns) {
  return vulns.reduce((acc, v) => {
    acc[v.severity] = (acc[v.severity] ?? 0) + 1;
    return acc;
  }, {});
}

function formatSessionDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ContextPanel({
  scans,
  selectedScanId,
  onSelectScan,
  vulnerabilities,
  loadingScans,
  loadingVulns,
  onNewChat,
  sessions = [],
  loadingSessions = false,
  activeSessionId,
  onSelectSession,
}) {
  const counts = severityCounts(vulnerabilities);
  const total = vulnerabilities.length;
  const selectedScan = scans.find(
    (s) => (s._id ?? s.scan_id) === selectedScanId,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
        flex: "1 1 auto",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Active repository */}
      <div
        style={{
          flexShrink: 0,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "12px 14px",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "var(--muted)",
            margin: "0 0 8px",
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          Active repository
        </p>

        {loadingScans ? (
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
            Cargando...
          </p>
        ) : !selectedScan ? (
          <p
            style={{
              fontSize: 12,
              color: "var(--muted)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Choose a repository below to start chatting about your findings.
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background:
                  "color-mix(in srgb, var(--primary) 14%, var(--card))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GitBranch size={14} style={{ color: "var(--primary)" }} />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-mono)",
                color: "var(--fg)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {selectedScan.repo_name ?? selectedScan.name}
            </span>
          </div>
        )}
      </div>

      {/* Findings summary */}
      {selectedScanId && !loadingVulns && total > 0 && (
        <div
          style={{
            flexShrink: 0,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--fg)",
              marginBottom: 8,
            }}
          >
            <ShieldAlert size={13} style={{ color: "var(--primary)" }} />
            {total} finding{total !== 1 ? "s" : ""} as context
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(counts).map(([sev, n]) => (
              <span
                key={sev}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--fg)",
                  background: "var(--secondary)",
                  borderRadius: 999,
                  padding: "3px 9px",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: SEVERITY_COLORS[sev] ?? "var(--muted)",
                  }}
                />
                {n} {sev}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Choose repository — this is the ONLY section that grows and scrolls internally */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <p
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg)",
            margin: 0,
            padding: "12px 14px 8px",
          }}
        >
          Choose repository
        </p>

        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            padding: "0 14px 12px",
          }}
        >
          {loadingScans ? (
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
              Loading scans...
            </p>
          ) : scans.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
              No scans yet. Run one first.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {scans.map((s) => {
                const id = s._id ?? s.scan_id;
                const active = id === selectedScanId;
                return (
                  <button
                    key={id}
                    onClick={() => onSelectScan(id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      textAlign: "left",
                      padding: "8px 9px",
                      borderRadius: 8,
                      border: "none",
                      background: active ? "var(--secondary)" : "transparent",
                      cursor: "pointer",
                      minWidth: 0,
                    }}
                  >
                    <GitBranch
                      size={12}
                      style={{ color: "var(--muted)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        color: active ? "var(--fg)" : "var(--muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                      }}
                    >
                      {s.repo_name ?? s.name ?? "scan sin nombre"}
                    </span>
                    {active && (
                      <Check
                        size={13}
                        style={{ color: "var(--primary)", flexShrink: 0 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New chat button */}
      {selectedScanId && (
        <button
          onClick={onNewChat}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--muted)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 10px",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={12} /> New chat
        </button>
      )}

      {/* History */}
      {selectedScanId && (
        <div style={{ flexShrink: 0 }}>
          <Card title="History">
            {loadingSessions ? (
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                Loading...
              </p>
            ) : sessions.length === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                There aren't any saved conversations for this repository yet.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {sessions.map((s) => {
                  const id = s._id ?? s.session_id;
                  const active = id === activeSessionId;
                  return (
                    <button
                      key={id}
                      onClick={() => onSelectSession(id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        textAlign: "left",
                        padding: "8px 9px",
                        borderRadius: 8,
                        border: "none",
                        background: active ? "var(--secondary)" : "transparent",
                        cursor: "pointer",
                        minWidth: 0,
                      }}
                    >
                      <MessageSquare
                        size={12}
                        style={{
                          color: active ? "var(--primary)" : "var(--muted)",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: active ? "var(--fg)" : "var(--muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.title || "Conversación"}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          {formatSessionDate(s.created_at)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}