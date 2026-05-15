async function test() {
    const urls = [
        'https://n8n.santisoft.cl/webhook/img-rrss-auto',
        'https://n8n.santisoft.cl/webhook-test/img-rrss-auto'
    ];

    for (const url of urls) {
        console.log(`\nTesting ${url}...`);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idea: "Test post idea",
                    businessType: "Restaurant",
                    type: "Post"
                })
            });
            console.log(`Status: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.log(`Response (first 500 chars): ${text.substring(0, 500)}`);
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
    }
}

test();
