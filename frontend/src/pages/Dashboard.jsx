import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, AlertTriangle, GitBranch, Clock, Zap } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import SeverityBreakdown from "../components/dashboard/SeverityBreakdown";
import ActivityList from "../components/dashboard/ActivityList";
import { api } from "../config/Api";
import { useAuth } from "../context/AuthContext";
import { formatTime } from "../lib/date";

export default function Dashboard() {
  const location = useLocation();
  const { user } = useAuth();

  // Resultados que vienen del scan
  const incomingScan = location.state?.results ?? null;

  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setScanData(null);
      setLoading(false);
      return;
    }

    if (incomingScan) {
      setScanData(incomingScan);
      setLoading(false);
      window.history.replaceState({}, "");
      return;
    }

    setLoading(true);
    api
      .get("/api/scan/latest")
      .then((data) => {
        setScanData(data);
      })
      .catch(() => setScanData(null))
      .finally(() => setLoading(false));
  }, [incomingScan, user]);

  // Stats para los componentes
  const metrics = scanData?.metrics ?? {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  const total = Object.values(metrics).reduce((a, b) => a + b, 0);
  const score = scanData?.security_score ?? null;
  const repoName = scanData?.repo_name ?? "—";

  const STATS = [
    {
      label: "Security Score",
      value: score !== null ? `${score}/100` : "—",
      icon: Shield,
      trend:
        score !== null
          ? score >= 70
            ? "Good"
            : score >= 40
              ? "Fair"
              : "Critical"
          : "",
    },
    {
      label: "Vulnerabilities",
      value: total > 0 ? total.toString() : "0",
      icon: AlertTriangle,
      trend: `${metrics.critical} critical`,
    },
    {
      label: "Repository",
      value: repoName,
      icon: GitBranch,
      trend: "",
    },
    {
      label: "Last scan",
      value: scanData?.completed_at ? formatTime(scanData.completed_at) : "—",
      icon: Clock,
      trend: "",
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 32, color: "#5a6b60", fontSize: 13 }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "clamp(16px, 4vw, 32px)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
        maxWidth: 1320,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#e2e8e4", margin: 0 }}>
            {scanData ? `${repoName}` : "Dashboard"}
          </h1>
          <p style={{ fontSize: 13, color: "#5a6b60", marginTop: 6, marginBottom: 0 }}>
            {scanData?.summary ?? "Security overview and recent activity"}
          </p>
        </div>
        <Link to="/scan">
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "var(--primary)",
              color: "var(--primary-fg)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
            }}
          >
            <Zap size={13} /> Quick Scan
          </button>
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        <SeverityBreakdown metrics={metrics} />
        <ActivityList scanData={scanData} />
      </div>
    </div>
  );
}