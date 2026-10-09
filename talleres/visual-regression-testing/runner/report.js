import { writeFile } from "node:fs/promises";

const row = (comparison) => `
  <section class="${comparison.different ? "different" : "same"}">
    <h2>${comparison.name} · ${comparison.viewport.width}×${comparison.viewport.height} · ${comparison.mismatch}%</h2>
    <p><code>${comparison.capturedPath.base}</code> (${comparison.steps.length} pasos)</p>
    <div class="images">
      ${["base", "release", "diff"]
        .map((kind) => `<figure><img src="screenshots/${comparison.name}-${kind}.png" alt="${kind}"><figcaption>${kind}</figcaption></figure>`)
        .join("")}
    </div>
  </section>`;

export async function writeReport(summary, file) {
  const { comparisons } = summary.results;
  const different = comparisons.filter((comparison) => comparison.different).length;
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reporte VRT</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; }
    section { border-left: 6px solid #16a34a; padding: 0 16px; margin-bottom: 32px; }
    section.different { border-color: #dc2626; }
    .images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    img { width: 100%; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>Reporte VRT</h1>
  <p>${different} de ${comparisons.length} comparaciones superan el umbral de ${summary.config.threshold}%.</p>
  ${comparisons.map(row).join("")}
</body>
</html>
`;
  await writeFile(file, html);
}
