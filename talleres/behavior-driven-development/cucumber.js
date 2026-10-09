// Do not modify this file: the evaluation runs it unchanged. Features and step definitions go in
// features/ (any .js file below features/ is loaded).
export default {
  paths: ["features/**/*.feature"],
  import: ["runner/**/*.js", "features/**/*.js"],
  format: ["progress", "html:results/report.html"],
};
