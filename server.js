const WebSocket = require('ws');
const http = require('http');

// Create an HTTP server
const server = http.createServer();

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

let viewerCounts = {}; // To track viewers per username

wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    const params = new URLSearchParams(req.url.replace('/?', ''));
    const username = params.get('username');
    
    if (!username) {
        console.log('No username provided, closing connection');
        ws.close(1008, 'Username not provided');
        return;
    }

    // Increment viewer count
    if (!viewerCounts[username]) {
        viewerCounts[username] = 0;
    }
    viewerCounts[username]++;
    
    console.log(`User ${username} connected, current viewers: ${viewerCounts[username]}`);

    // Broadcast the updated viewer count to all connected clients for this username
    broadcastViewerCount(username);

    ws.on('close', () => {
        console.log(`User ${username} disconnected`);
        
        // Decrement viewer count
        viewerCounts[username]--;
        if (viewerCounts[username] < 0) viewerCounts[username] = 0;

        // Broadcast the updated viewer count to all connected clients for this username
        broadcastViewerCount(username);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Function to broadcast viewer count to all clients
function broadcastViewerCount(username) {
    const message = JSON.stringify({ viewerCount: viewerCounts[username] });
    wss.clients.forEach((client) => {
        const params = new URLSearchParams(client.url.replace('/?', ''));
        const clientUsername = params.get('username');
        if (client.readyState === WebSocket.OPEN && clientUsername === username) {
            client.send(message);
        }
    });
}

// Listen on port 8080 (or another port of your choice)
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});