
const fs  = require("fs")
const path  = require("path")

const {STORAGE_AUTH_KEY_SECRET} = process.env

const WORKER_URL = "https://data.deepfetch.de5.net";
const headers = {
    "X-Custom-Auth-Key": STORAGE_AUTH_KEY_SECRET
}

describe("MP4", () => {
    it("PUT mp4", async () => {
        const filePath = path.join(__dirname, "audio.mp4");
        console.log(filePath)
        // read binary
        const mp4Data = fs.readFileSync(filePath);
        console.log("mp4Data",mp4Data.length)

        const res = await fetch(`${WORKER_URL}/audio.mp4`, {
            method: "PUT",
            headers: {
                ...headers,
                "content-type": "video/mp4",
            },
            body: mp4Data,
        });

        console.log("PUT status:", res.status);
        console.log("PUT text:", await res.text());
    });

    it("GET mp4", async () => {
        const res = await fetch(`${WORKER_URL}/audio.mp4`, {
            method: "GET",
            headers,
        });

        console.log("GET status:", res.status);

        const buffer = await res.arrayBuffer();
        console.log("MP4 size bytes:", buffer.byteLength);

    });
});



describe("PLAIN_TEXT", () => {

    it("PUT plain", async () => {
        const res = await fetch(
            `${WORKER_URL}/plain.txt`,
            {
                method:"PUT",
                body:"plain text",                // BODY (data)
                headers
            }
        );
        console.log("PUT text:", await res.text());

    });

    it("GET Plain", async () => {
        const url = `${WORKER_URL}/plain.txt`
        console.log(url)
        const res = await fetch(url, {
            method: "GET",
        });

        console.log("GET text:", await res.text());
    });

});