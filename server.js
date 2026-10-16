import http from "node:http";
import handler from "serve-handler";

const port = process.env.PORT || 3000;

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: "dist",
    rewrites: [
      { source: "**", destination: "/index.html" },
    ],
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Production server running at http://0.0.0.0:${port}`);
});
