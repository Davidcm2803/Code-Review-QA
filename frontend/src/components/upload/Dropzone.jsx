import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { SUPPORTED_EXTENSIONS, MAX_FILE_SIZE_MB } from "../../lib/scan";

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

function readFileEntry(entry) {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

function readDirEntry(entry) {
  return new Promise((resolve, reject) => {
    const reader = entry.createReader();
    const allEntries = [];
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(allEntries);
        } else {
          allEntries.push(...batch);
          readBatch();
        }
      }, reject);
    };
    readBatch();
  });
}


async function collectFiles(entry, acc) {
  if (!entry) return;
  if (entry.isFile) {
    try {
      const file = await readFileEntry(entry);
      acc.push(file);
    } catch {
    }
  } else if (entry.isDirectory) {
    const children = await readDirEntry(entry);
    for (const child of children) {
      await collectFiles(child, acc);
    }
  }
}


async function extractFilesFromDataTransfer(dataTransfer) {
  const items = dataTransfer.items;
  if (!items || !items.length) {
    return Array.from(dataTransfer.files || []);
  }

  const supportsEntries = typeof items[0]?.webkitGetAsEntry === "function";
  if (!supportsEntries) {
    return Array.from(dataTransfer.files || []);
  }

  const entries = Array.from(items)
    .map((item) => item.webkitGetAsEntry())
    .filter(Boolean);

  const acc = [];
  for (const entry of entries) {
    await collectFiles(entry, acc);
  }
  return acc;
}

export default function Dropzone({ onFilesAdded, onError }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);

  const validateAndEmit = useCallback(
    (fileList) => {
      const files = Array.from(fileList);
      const valid = [];
      const errors = [];
      for (const file of files) {
        const ext = getExtension(file.name);
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
          errors.push(`${file.name}: extensión no soportada`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          errors.push(`${file.name}: supera ${MAX_FILE_SIZE_MB}MB`);
          continue;
        }
        valid.push(file);
      }
      if (errors.length) onError?.(errors);
      if (valid.length) onFilesAdded?.(valid);
    },
    [onFilesAdded, onError],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);

      const dataTransfer = e.dataTransfer;
      if (!dataTransfer) return;

      setScanning(true);
      extractFilesFromDataTransfer(dataTransfer)
        .then((files) => {
          if (files.length) validateAndEmit(files);
          else
            onError?.([
              "No se encontraron archivos válidos en lo que soltaste",
            ]);
        })
        .finally(() => setScanning(false));
    },
    [validateAndEmit, onError],
  );

  const handleChange = (e) => {
    if (e.target.files?.length) validateAndEmit(e.target.files);
    e.target.value = "";
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      style={{
        minHeight: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        textAlign: "center",
        cursor: "pointer",
        background: dragActive ? "rgba(34,197,94,0.06)" : "var(--card)",
        border: `1px dashed ${dragActive ? "#22c55e" : "var(--border)"}`,
        borderRadius: 8,
        transition: "background 0.15s, border-color 0.15s",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={SUPPORTED_EXTENSIONS.join(",")}
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(34,197,94,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <UploadCloud size={20} color="#22c55e" />
      </div>
      <div>
        <p
          style={{ fontSize: 14, fontWeight: 600, color: "#c8d8cc", margin: 0 }}
        >
          {scanning ? "Leyendo carpeta..." : "Suelta archivos aquí"}
        </p>
        <p style={{ fontSize: 13, color: "#8fa894", margin: "4px 0 0" }}>
          o haz click para buscar
        </p>
      </div>
      <p
        style={{
          fontSize: 11,
          color: "#4a5c50",
          fontFamily: "monospace",
          margin: 0,
        }}
      >
        {SUPPORTED_EXTENSIONS.join(", ")} · máx {MAX_FILE_SIZE_MB}MB c/u
      </p>
    </div>
  );
}
