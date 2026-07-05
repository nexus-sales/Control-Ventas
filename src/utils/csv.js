// Neutraliza inyección de fórmulas CSV (OWASP CSV Injection): si una celda
// empieza por =, +, - o @, Excel/Sheets pueden interpretarla como fórmula al
// abrir el archivo exportado. Anteponer una comilla simple la fuerza a texto.
export function escapeCsvCell(value = "") {
  const text = String(value ?? "");
  const neutralized = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${neutralized.replace(/"/g, '""')}"`;
}
