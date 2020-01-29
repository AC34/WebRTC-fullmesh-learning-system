/**
 * load modules
 */
var WebSocket = require("ws").Server;
var server = new WebSocket({ port: 5001 });
var ProcessHandler = require("./ProcessHandler");
var ph = new ProcessHandler(server);

/**
 * entry point to the localhost:5001
 */
server.on("connection", function(ws, req) {
  ws.on("message", function(message) {
    ph.handleMessage(ws, message);
  });
  ws.on("close", function() {
		console.log("lost a client");
		ph.closeConnection(ws);
  });
});
