
const API_BASE_URL = "http://192.168.0.104:8001";

const serverSelect = document.getElementById("serverSelect");
const serverInfo = document.getElementById("serverInfo");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const statusBox = document.getElementById("status");

let servers = [];

function setStatus(message) {
    statusBox.textContent = message;
}

function getServerBaseUrl(server) {
    if (!server?.url?.host || server?.url?.port == null) {
        throw new Error(
            "Server configuration is missing host or port."
        );
    }

    return `http://${server.url.host}:${server.url.port}`;
}

function renderServers() {
    serverSelect.replaceChildren();

    if (servers.length === 0) {
        serverSelect.add(new Option("No servers found", ""));
        serverSelect.disabled = true;
        uploadBtn.disabled = true;
        serverInfo.textContent = "No servers available.";
        return;
    }

    serverSelect.add(new Option("Choose a server...", ""));

    servers.forEach((server, index) => {
        const name = server.name ?? server.dirname ?? `Server ${index + 1}`;
        const host = server.url?.host ?? "unknown";
        const port = server.url?.port ?? "?";

        serverSelect.add(
            new Option(`${name} — ${host}:${port}`, String(index))
        );
    });

    serverSelect.disabled = false;
    uploadBtn.disabled = false;
    serverInfo.textContent = `${servers.length} server(s) available.`;
}

async function loadServers() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/get-server-nodes`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch servers: HTTP ${response.status}`
            );
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error(
                result.message || "Invalid server-list response."
            );
        }

        servers = result.data;
        renderServers();

        setStatus("Servers loaded successfully.");
    } catch (err) {
        serverSelect.replaceChildren(
            new Option("Failed to load servers", "")
        );

        serverSelect.disabled = true;
        uploadBtn.disabled = true;

        serverInfo.textContent = "Could not load servers.";
        setStatus(err.message);
    }
}

serverSelect.addEventListener("change", () => {
    if (serverSelect.value === "") {
        serverInfo.textContent =
            `${servers.length} server(s) available.`;
        return;
    }

    const server = servers[Number(serverSelect.value)];

    try {
        serverInfo.textContent =
            `Upload endpoint: ${getServerBaseUrl(server)}/sendfile/:fileName`;
    } catch (err) {
        serverInfo.textContent = err.message;
    }
});

uploadBtn.addEventListener("click", async () => {
    if (serverSelect.value === "") {
        setStatus("Please select a server.");
        return;
    }

    const file = fileInput.files?.[0];

    if (!file) {
        setStatus("Please select a file.");
        return;
    }

    const server = servers[Number(serverSelect.value)];

    let uploadUrl;

    try {
        uploadUrl =
            `${getServerBaseUrl(server)}/sendfile/${encodeURIComponent(file.name)}`;
    } catch (err) {
        setStatus(err.message);
        return;
    }

    uploadBtn.disabled = true;

    setStatus(
        `Uploading ${file.name} (${file.size} bytes)...`
    );

    try {
        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/octet-stream"
            },
            body: file
        });

        const responseText = await response.text();

        let result;

        try {
            result = responseText
                ? JSON.parse(responseText)
                : {};
        } catch {
            result = { message: responseText };
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                `Upload failed: HTTP ${response.status}`
            );
        }

        setStatus(
            `Upload successful!\n` +
            `Server: ${server.name ?? server.dirname}\n` +
            `File: ${file.name}\n` +
            `Bytes sent: ${result.bytesReceived ?? file.size}`
        );
    } catch (err) {
        setStatus(
            `Upload failed: ${err.message}\n\n` +
            `Check server availability, the route, and CORS settings.`
        );
    } finally {
        uploadBtn.disabled = servers.length === 0;
    }
});

loadServers();