console.log("TEST STARTED");

async function testAPI() {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "user",
              content: "Say hello in 1 short sentence"
            }
          ],
          max_tokens: 50
        })
      }
    );

    if (!response.ok) {
      console.log("HTTP ERROR:", response.status);
      console.log(await response.text());
      return;
    }

    const data = await response.json();

    console.log("FULL RESPONSE:", data);

    const answer = data?.choices?.[0]?.message?.content;

    console.log("RESULT:", answer || "NO VALID RESPONSE");

  } catch (error) {
    console.log("ERROR:", error);
  }
}

testAPI();