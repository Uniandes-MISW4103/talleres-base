export default {
  // Mismatch percentage above which a comparison is reported as a difference.
  threshold: 0.1,
  resemble: {
    ignore: "antialiasing",
    scaleToSameSize: true,
    output: { errorColor: { red: 255, green: 0, blue: 255 }, errorType: "movement", outputDiff: true },
  },
  // Each comparison opens `path` with `viewport`, runs `steps` in order and captures the page.
  // Steps: { click: selector }, { fill: [selector, value] }, { goto: path }, { waitFor: selector },
  // { waitForUrl: glob } (for example "**?color=*").
  comparisons: [
    {
      name: "producto",
      path: "/accessories/stainless-steel-thermos-yellow",
      viewport: { width: 1280, height: 800 },
      steps: [],
    },
  ],
};
