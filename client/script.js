const API_BASE_URL = "http://192.168.0.104:8000";

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const statusBox = document.getElementById("status");

function setStatus(message) {
    statusBox.textContent = message;
}

uploadBtn.disabled = false;
setStatus("Select a file to upload.");

uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files?.[0];

    if (!file) {
        setStatus("Please select a file.");
        return;
    }

    const uploadUrl = `${API_BASE_URL}/sendfile/${encodeURIComponent(file.name)}`;

    uploadBtn.disabled = true;
    setStatus(`Uploading ${file.name} (${file.size} bytes)...`);

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
            result = responseText ? JSON.parse(responseText) : {};
        } catch {
            result = { message: responseText };
        }

        if (!response.ok) {
            throw new Error(
                result.message || `Upload failed: HTTP ${response.status}`
            );
        }

        setStatus(
            `Upload successful!\n` +
            `File: ${file.name}\n` +
            `Bytes sent: ${result.bytesReceived ?? file.size}`
        );
    } catch (err) {
        setStatus(
            `Upload failed: ${err.message}\n\n` +
            `Check server availability, the route, and CORS settings.`
        );
    } finally {
        uploadBtn.disabled = false;
    }
});