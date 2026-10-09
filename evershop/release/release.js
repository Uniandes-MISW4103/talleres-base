// EverShop "release" for the VRT workshop.
window.addEventListener("load", () => {
  const banner = document.createElement("div");
  banner.id = "release-banner";
  document.body.prepend(banner);

  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const render = () => {
    const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
    const time = [left / 3600, (left % 3600) / 60, left % 60]
      .map((part) => String(Math.floor(part)).padStart(2, "0"))
      .join(":");
    banner.textContent = `Oferta de temporada: termina en ${time}`;
  };
  render();
  setInterval(render, 1000);
});
