const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.json());

// ⚠️ NO pongas tu API aquí directamente en producción
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/", async (req, res) => {
    try {
        const userText = req.body.request.intent.slots.text.value;

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                input: userText
            })
        });

        const data = await response.json();

        const reply = data.output?.[0]?.content?.[0]?.text || "No entendí la respuesta";

        res.json({
            version: "1.0",
            response: {
                outputSpeech: {
                    type: "PlainText",
                    text: reply
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
                    text: "Hubo un error"
                },
                shouldEndSession: true
            }
        });
    }
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo"));