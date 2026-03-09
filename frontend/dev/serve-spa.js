const path = require("path");
const express = require("express");
const serveStatic = require("serve-static");
const history = require("connect-history-api-fallback");

const app = express();
const port = process.env.PORT || 3000;
const distDir = path.join(__dirname, "..", "dist");

app.use(
  history({
    verbose: false,
  })
);
app.use(
  serveStatic(distDir, {
    index: ["index.html"],
  })
);

app.listen(port, () => {
  console.log(`SPA server serving ${distDir} on http://localhost:${port}`);
});
