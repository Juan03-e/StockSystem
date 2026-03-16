/**
 * Generic CSV export utility.
 * Converts an array of objects into a downloadable CSV file.
 */
export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const str = v === null || v === undefined ? "" : String(v);
    // Wrap in quotes if contains comma, newline, or quote
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
