import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { githubApi, api, scanService } from "../config/Api";
import { useAuth } from "../context/AuthContext";
import RepoInput from "../components/scan/RepoInput";
import RecentRepos from "../components/scan/RecentRepos";
import { RefreshCw } from "lucide-react";

const POLL_INTERVAL = 2000;

export default function ScanRepository() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [branches, setBranches] = useState(["main"]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);
  const scanRef = useRef(null);

  const hasGithub = !!user?.githubToken;

  const fetchRepos = async (isRefresh = false) => {
    if (!hasGithub) {
      setRepos([]);
      return;
    }
    isRefresh ? setRefreshing(true) : setLoadingRepos(true);
    try {
      const data = await githubApi.get("/api/github/repos");
      setRepos(Array.isArray(data) ? data : (data.repos ?? []));
    } catch (e) {
      console.error(e);
    } finally {
      isRefresh ? setRefreshing(false) : setLoadingRepos(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, [hasGithub]);
  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleSelectRepo = async (repoFullName, cloneUrl) => {
    setUrl(cloneUrl);
    setBranches(["main"]);
    setBranch("main");
    setError(null);
    try {
      const [owner, repo] = repoFullName.split("/");
      const data = await githubApi.get(
        `/api/github/repos/${owner}/${repo}/branches`,
      );
      setBranches(data);
      setBranch(data[0] ?? "main");
    } catch (e) {
      console.error(e);
    }
  };

  const startPolling = (scanId) => {
    let fakeProgress = 5;
    pollRef.current = setInterval(async () => {
      try {
        const status = await api.get(`/api/scan/${scanId}/status`);
        fakeProgress = Math.min(fakeProgress + Math.random() * 8, 85);
        setProgress(fakeProgress);

        if (status.status === "completed") {
          clearInterval(pollRef.current);
          setProgress(100);
          try {
            const results = await api.get(`/api/scan/${scanId}/results`);
            setTimeout(() => {
              navigate("/", { state: { scanId, results } });
            }, 600);
          } catch {
            setTimeout(() => navigate("/"), 600);
          }
        }
        if (status.status === "failed") {
          clearInterval(pollRef.current);
          setScanning(false);
          setError("El scan falló. Verificá que el repositorio sea accesible.");
        }
      } catch (e) {
        clearInterval(pollRef.current);
        setScanning(false);
        setError("Error conectando con el servidor.");
      }
    }, POLL_INTERVAL);
  };

  const handleScan = async () => {
    if (!url || scanning) return;
    setError(null);
    setScanning(true);
    setProgress(2);
    try {
      const { scan_id } = await scanService.startFromGithub({
        clone_url: url,
        branch,
      });
      scanRef.current = scan_id;
      startPolling(scan_id);
    } catch (e) {
      setScanning(false);
      setProgress(0);
      setError(e?.message ?? "No se pudo iniciar el scan.");
    }
  };

  return (
    <div
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
        maxWidth: 1320,
      }}
    >
      <div>
        <h1
          style={{ fontSize: 22, fontWeight: 600, color: "#e2e8e4", margin: 0 }}
        >
          Scan repository
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#5a6b60",
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          Analyze a GitHub repository for security vulnerabilities
        </p>
      </div>

      <RepoInput
        url={url}
        onUrlChange={setUrl}
        branch={branch}
        onBranchChange={setBranch}
        branches={branches}
        scanning={scanning}
        progress={progress}
        onScan={handleScan}
      />

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {hasGithub && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: -10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
            }}
          >
            Your repositories
          </span>
          <button
            onClick={() => fetchRepos(true)}
            disabled={refreshing || loadingRepos}
            title="Refresh repositories"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "transparent",
              border: "1px solid #1e2420",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: refreshing ? "not-allowed" : "pointer",
              color: refreshing ? "#3a4a3f" : "#5a6b60",
              fontSize: 12,
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.color = "#8fa894";
                e.currentTarget.style.borderColor = "#3a4a3f";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = refreshing ? "#3a4a3f" : "#5a6b60";
              e.currentTarget.style.borderColor = "#1e2420";
            }}
          >
            <RefreshCw
              size={12}
              style={{
                animation: refreshing ? "spin 0.8s linear infinite" : "none",
              }}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}

      <RecentRepos
        repos={repos}
        loading={loadingRepos}
        hasGithub={hasGithub}
        onSelect={handleSelectRepo}
        hideTitle={hasGithub}
      />
    </div>
  );
}