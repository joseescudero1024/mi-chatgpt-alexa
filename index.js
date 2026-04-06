const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 Memoria simple por sesión
let conversationHistory = [];

app.post("/", async (req, res) => {
    try {
        const userText = req.body?.request?.intent?.slots?.text?.value || "Hola";

        // 🧠 Guardar historial (limitado a últimas 10 interacciones)
        conversationHistory.push({ role: "user", content: userText });
        if (conversationHistory.length > 10) {
            conversationHistory.shift();
        }

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                input: [
                    {
                        role: "system",
                        content: "Responde siempre en español, de forma clara, natural y conversacional."
                    },
                    ...conversationHistory
                ]
            })
        });

        const data = await response.json();

        const reply = data.output?.[0]?.content?.[0]?.text || "No entendí la respuesta";

        // 🧠 Guardar respuesta del bot
        conversationHistory.push({ role: "assistant", content: reply });

        // 🔊 Respuesta con voz más natural (SSML)
        res.json({
            version: "1.0",
            response: {
                outputSpeech: {
                    type: "SSML",
                    ssml: `<speak>${reply}</speak>`
                },
                shouldEndSession: false
            }
        });

    } catch (error) {
        console.error(error);
        res.json({
            version: "1.0",
            response: {
                outputSpeech: {
                    type: "PlainText",
                    text: "Hubo un error al procesar la solicitud"
                },
                shouldEndSession: true
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo"));