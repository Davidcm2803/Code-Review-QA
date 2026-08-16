import { useState, useEffect } from "react";
import { Sliders, Sun, Moon, Monitor, Globe } from "lucide-react";

/**
 * PreferencesSection - Sección para administrar el tema visual e idioma.
 *
 * @param {Object} preferences - Objeto con las preferencias actuales (theme, language).
 * @param {function} onSavePreferences - Callback para notificar cambios al componente padre.
 */
export const PreferencesSection = ({
  preferences = { theme: "dark", language: "en" },
  onSavePreferences,
}) => {
  const [theme, setTheme] = useState(preferences.theme || "dark");
  const [language, setLanguage] = useState(preferences.language || "en");
  const [saved, setSaved] = useState(false);

  // Función para cambiar los atributos en <html> y aplicar el CSS
  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;

    if (selectedTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const systemTheme = prefersDark ? "dark" : "light";
      root.setAttribute("data-theme", systemTheme);
      root.classList.toggle("light", !prefersDark);
      root.classList.toggle("dark", prefersDark);
    } else {
      root.setAttribute("data-theme", selectedTheme);
      root.classList.toggle("light", selectedTheme === "light");
      root.classList.toggle("dark", selectedTheme === "dark");
    }
  };

  // Sincronizar únicamente el efecto secundario en el DOM al cambiar las props
  useEffect(() => {
    if (preferences.theme) {
      applyTheme(preferences.theme);
    }
  }, [preferences.theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme); // Aplica el cambio visual de inmediato
    setSaved(false);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    applyTheme(theme);
    if (onSavePreferences) {
      onSavePreferences({ theme, language });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary, #18181b)",
        border: "1px solid var(--border, #27272a)",
        borderRadius: "0.5rem",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--text-primary, #ffffff)",
            margin: "0 0 0.25rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Sliders size={18} />
          Preferences
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary, #a1a1aa)",
            margin: 0,
          }}
        >
          Customize your experience, appearance, and language options.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* Selector de Tema */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-primary, #ffffff)",
              marginBottom: "0.75rem",
            }}
          >
            Theme
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
            }}
          >
            {/* Opción Dark */}
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 0.5rem",
                borderRadius: "0.375rem",
                border:
                  theme === "dark"
                    ? "2px solid var(--primary, #10b981)"
                    : "1px solid var(--border, #3f3f46)",
                backgroundColor:
                  theme === "dark"
                    ? "rgba(16, 185, 129, 0.1)"
                    : "var(--bg-primary, #09090b)",
                color:
                  theme === "dark"
                    ? "var(--primary, #10b981)"
                    : "var(--text-primary, #ffffff)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Moon size={20} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Dark
              </span>
            </button>

            {/* Opción Light */}
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 0.5rem",
                borderRadius: "0.375rem",
                border:
                  theme === "light"
                    ? "2px solid var(--primary, #10b981)"
                    : "1px solid var(--border, #3f3f46)",
                backgroundColor:
                  theme === "light"
                    ? "rgba(16, 185, 129, 0.1)"
                    : "var(--bg-primary, #09090b)",
                color:
                  theme === "light"
                    ? "var(--primary, #10b981)"
                    : "var(--text-primary, #ffffff)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Sun size={20} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Light
              </span>
            </button>

            {/* Opción System */}
            <button
              type="button"
              onClick={() => handleThemeChange("system")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 0.5rem",
                borderRadius: "0.375rem",
                border:
                  theme === "system"
                    ? "2px solid var(--primary, #10b981)"
                    : "1px solid var(--border, #3f3f46)",
                backgroundColor:
                  theme === "system"
                    ? "rgba(16, 185, 129, 0.1)"
                    : "var(--bg-primary, #09090b)",
                color:
                  theme === "system"
                    ? "var(--primary, #10b981)"
                    : "var(--text-primary, #ffffff)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Monitor size={20} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                System
              </span>
            </button>
          </div>
        </div>

        {/* Selector de Idioma */}
        <div>
          <label
            htmlFor="language"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-primary, #ffffff)",
              marginBottom: "0.5rem",
            }}
          >
            <Globe size={16} />
            Language
          </label>
          <select
            id="language"
            name="language"
            value={language}
            onChange={handleLanguageChange}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--border, #3f3f46)",
              backgroundColor: "var(--bg-primary, #09090b)",
              color: "var(--text-primary, #ffffff)",
              outline: "none",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            <option value="en">English (US)</option>
            <option value="es">Español</option>
          </select>
        </div>

        {/* Mensaje de confirmación y Botón Save */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "0.5rem",
          }}
        >
          {saved ? (
            <span
              style={{
                fontSize: "0.875rem",
                color: "#10b981",
                fontWeight: 500,
              }}
            >
              Preferences saved!
            </span>
          ) : (
            <div />
          )}

          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              borderRadius: "0.375rem",
              border: "none",
              backgroundColor: "var(--primary, #10b981)",
              color: "#ffffff",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesSection;
