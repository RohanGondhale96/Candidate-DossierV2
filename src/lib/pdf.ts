// Client-side PDF export: rasterize the rendered resume page (so it matches the
// chosen template exactly) into a real, downloadable A4 PDF. Uses html2canvas +
// jsPDF (dynamically imported so they stay out of the server bundle).
// Editor-only chrome (.no-print controls, hidden sections) is excluded.

export async function exportResumeToPdf(filename: string): Promise<void> {
  const el = document.querySelector(".resume-page") as HTMLElement | null;
  if (!el) throw new Error("Resume element not found");

  const [{ default: html2canvas }, jspdf] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const { jsPDF } = jspdf;

  // Ensure self-hosted (@fontsource) fonts are fully loaded before capture,
  // otherwise html2canvas may rasterize with a fallback font.
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    ignoreElements: (node) => {
      const cls = typeof node.className === "string" ? node.className : "";
      return (
        node.classList?.contains("no-print") || cls.includes("print:hidden")
      );
    },
  });

  const img = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(img, "JPEG", 0, position, pageW, imgH);
  heightLeft -= pageH;

  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(img, "JPEG", 0, position, pageW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
