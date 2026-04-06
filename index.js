import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔐 API KEY desde variables de entorno (Render)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 Memoria simple (puedes mejorar luego)
let conversationHistory = [];

app.post("/", async (req, res) => {
  try {
    // 🗣️ Texto que manda Alexa
    const userText =
      req.body?.request?.intent?.slots?.text?.value ||
      "Hola";

    console.log("Usuario dijo:", userText);

    // 📚 Guardamos historial
    conversationHistory.push({
      role: "user",
      content: userText,
    });

    // 🚀 Llamada a OpenAI
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Responde siempre en español, de forma natural, amigable y como un asistente de voz.",
          },
          ...conversationHistory,
        ],
      }),
    });

    const data = await response.json();

    console.log("Respuesta OpenAI:", JSON.stringify(data, null, 2));

    // 🧠 Lectura segura de respuesta
    let reply = "No entendí la respuesta";

    if (data.output && data.output.length > 0) {
      const content = data.output[0].content;
      if (content && content.length > 0) {
        reply = content[0].text || reply;
      }
    }

    // 📚 Guardamos respuesta
    conversationHistory.push({
      role: "assistant",
      content: reply,
    });

    // 🎙️ Formato Alexa (SSML)
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "SSML",
          ssml: `<speak>${reply}</speak>`,
        },
        shouldEndSession: false,
      },
    });

  } catch (error) {
    console.error("Error:", error);

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "SSML",
          ssml: "<speak>Hubo un error, intenta nuevamente</speak>",
        },
        shouldEndSession: false,
      },
    });
  }
});

// 🌐 Puerto para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});