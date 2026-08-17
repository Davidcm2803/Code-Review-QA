from app.scanners.normalizer import (
    normalize_bandit,
    normalize_osv,
    compute_metrics,
    compute_security_score,
)
from app.scanners.scan_orchestrator import detect_languages


class TestComputeMetrics:

    def test_cuenta_vulnerabilidades_por_severidad(self):
        vulns = [
            {"severity": "critical"},
            {"severity": "high"},
            {"severity": "high"},
            {"severity": "medium"},
            {"severity": "low"},
            {"severity": "low"},
            {"severity": "low"},
        ]
        metrics = compute_metrics(vulns)
        assert metrics == {"critical": 1, "high": 2, "medium": 1, "low": 3}

    def test_lista_vacia_devuelve_ceros(self):
        assert compute_metrics([]) == {"critical": 0, "high": 0, "medium": 0, "low": 0}

    def test_ignora_severidad_desconocida(self):
        vulns = [{"severity": "unknown"}, {"severity": "critical"}]
        metrics = compute_metrics(vulns)
        assert metrics["critical"] == 1
        assert sum(metrics.values()) == 1


class TestComputeSecurityScore:

    def test_sin_vulnerabilidades_score_100(self):
        metrics = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        assert compute_security_score(metrics) == 100

    def test_penaliza_segun_severidad(self):
        metrics = {"critical": 1, "high": 1, "medium": 1, "low": 1}
        assert compute_security_score(metrics) == 61

    def test_score_nunca_es_negativo(self):
        metrics = {"critical": 10, "high": 0, "medium": 0, "low": 0}
        assert compute_security_score(metrics) == 0


class TestNormalizeBandit:

    def test_normaliza_issue_critica_y_adapta_al_esquema(self):
        raw = {
            "results": [{
                "issue_text": "Uso de eval detectado",
                "issue_severity": "HIGH",
                "issue_confidence": "HIGH",
                "test_id": "B307",
                "test_name": "eval_used",
                "filename": "/tmp/aisecure_xxx/app/main.py",
                "line_number": 10,
                "line_range": [10],
                "code": "eval(user_input)",
                "more_info": "https://bandit.readthedocs.io",
            }]
        }
        vulns = normalize_bandit(raw, "repo1", "scan1")
        assert len(vulns) == 1
        v = vulns[0]
        assert v["severity"] == "critical"
        assert v["detector_source"] == "bandit"
        assert v["file_path"] == "app/main.py"
        assert v["status"] == "open"
        assert v["scan_id"] == "scan1"
        assert v["repository_id"] == "repo1"

    def test_severidad_media_no_escala_a_critica(self):
        raw = {"results": [{
            "issue_text": "x", "issue_severity": "MEDIUM", "issue_confidence": "HIGH",
            "test_id": "B101", "test_name": "assert_used", "filename": "a.py",
            "line_number": 1, "line_range": [1], "code": "assert True",
        }]}
        vulns = normalize_bandit(raw, "repo1", "scan1")
        assert vulns[0]["severity"] == "medium"

    def test_resultados_vacios_devuelve_lista_vacia(self):
        assert normalize_bandit({"results": []}, "repo1", "scan1") == []


class TestNormalizeOsv:

    def test_normaliza_vulnerabilidad_con_fix_disponible(self):
        raw = {
            "results": [{
                "source": {"path": "requirements.txt"},
                "packages": [{
                    "package": {"name": "flask", "version": "1.0"},
                    "vulnerabilities": [{
                        "id": "GHSA-xxxx",
                        "summary": "Vulnerabilidad conocida",
                        "severity": [{"type": "CVSS_V3", "score": "9.5"}],
                        "affected": [{"ranges": [{"events": [{"fixed": "2.0"}]}]}],
                        "aliases": ["CVE-2020-0001"],
                    }],
                }],
            }]
        }
        vulns = normalize_osv(raw, "repo1", "scan1")
        assert len(vulns) == 1
        assert vulns[0]["severity"] == "critical"
        assert "2.0" in vulns[0]["remediation_recommendation"]


class TestDetectLanguages:

    def test_detecta_python_y_javascript(self, tmp_path):
        (tmp_path / "main.py").write_text("print(1)")
        (tmp_path / "index.js").write_text("console.log(1)")
        langs = detect_languages(str(tmp_path))
        assert "python" in langs
        assert "javascript" in langs

    def test_ignora_carpetas_de_dependencias(self, tmp_path):
        nested = tmp_path / "node_modules"
        nested.mkdir()
        (nested / "lib.js").write_text("x")
        langs = detect_languages(str(tmp_path))
        assert langs == []

    def test_repo_vacio_no_detecta_lenguajes(self, tmp_path):
        assert detect_languages(str(tmp_path)) == []