type CsvFile = {
  filename: string;
  content: string;
};

type FileSystemApi = {
  saveFile: (filename: string, content: string) => Promise<string | null>;
  writeText: (path: string, content: string) => Promise<void>;
};

type NotificationApi = {
  showNotification: (options: {
    title: string;
    body: string;
    type: "success" | "error" | "info";
    duration?: number;
  }) => Promise<void>;
};

function getDirectoryPath(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) {
    return "";
  }
  return path.slice(0, lastSlash);
}

function joinPath(base: string, filename: string): string {
  if (!base) {
    return filename;
  }
  return `${base}/${filename}`;
}

export async function exportCsvBundle(
  fileSystem: FileSystemApi,
  utils: NotificationApi,
  files: CsvFile[],
  primaryFilename: string,
) {
  try {
    const primaryContent = files[0]?.content ?? "";
    const primaryPath = await fileSystem.saveFile(primaryFilename, primaryContent);
    if (!primaryPath) {
      return;
    }
    const directory = getDirectoryPath(primaryPath);
    for (let i = 1; i < files.length; i += 1) {
      const file = files[i];
      await fileSystem.writeText(joinPath(directory, file.filename), file.content);
    }
    await utils.showNotification({
      title: "Export complete",
      body: `Saved ${files.length} CSV file(s).`,
      type: "success",
      duration: 2500,
    });
  } catch (error: any) {
    console.error(error);
    await utils.showNotification({
      title: "Export failed",
      body: error?.message ?? "Could not save export files.",
      type: "error",
      duration: 3500,
    });
  }
}

export function buildCsv(rows: string[][]): string {
  const escapeCell = (value: string) => {
    const sanitized = value ?? "";
    if (/[",\n\r]/.test(sanitized)) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return sanitized;
  };

  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}
