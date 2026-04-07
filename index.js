import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔐 API KEY desde Render
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 Memoria simple
let conversationHistory = [];

app.post("/", async (req, res) => {
  try {
    const requestType = req.body?.request?.type;

    // 🟣 CUANDO SE ABRE LA SKILL
    if (requestType === "LaunchRequest") {
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "SSML",
            ssml: "<speak>Bienvenido a tu asistente inteligente. ¿Qué deseas saber?</speak>",
          },
          shouldEndSession: false,
        },
      });
    }

    // 🟢 CUANDO EL USUARIO HABLA
    if (requestType === "IntentRequest") {
      const userText =
        req.body?.request?.intent?.slots?.text?.value || "Hola";

      console.log("Usuario dijo:", userText);

      // 📚 Guardar mensaje usuario
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
                "Eres un asistente virtual tipo Alexa, respondes en español, de forma natural, amigable y conversacional.",
            },
            ...conversationHistory,
          ],
        }),
      });

      const data = await response.json();

      console.log("Respuesta OpenAI:", JSON.stringify(data, null, 2));

      // 🧠 Leer respuesta
      let reply = "No entendí la respuesta";

      if (data.output && data.output.length > 0) {
        const content = data.output[0].content;
        if (content && content.length > 0) {
          reply = content[0].text || reply;
        }
      }

      // 📚 Guardar respuesta IA
      conversationHistory.push({
        role: "assistant",
        content: reply,
      });

      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "SSML",
            ssml: `<speak><prosody rate="92%" pitch="+3%">${reply}</prosody></speak>`,
          },
          shouldEndSession: false,
        },
      });
    }

    // 🔴 fallback
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "SSML",
          ssml: "<speak>No entendí la solicitud</speak>",
        },
        shouldEndSession: false,
      },
    });

  } catch (error) {
    console.error("Error:", error);

    return res.json({
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

// 🌐 Puerto Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});