import { z } from "zod";
import ytdl from "ytdl-core";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { unlink } from "node:fs";
import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "node:crypto";
import { AssemblyAI } from "assemblyai";

import { Database } from "./local-database.js";
import getSummarizations from "./queries/get-summarizations.js";
import createSummarization from "./queries/create-summarization.js";

const server = Fastify();
const assemblyAiClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

await server.register(cors, { "Access-Control-Allow-Origin": "*" });

const database = new Database();

const audioSchema = z.object({
  title: z.string(),
  link: z
    .string()
    .regex(
      new RegExp(/https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/)
    ),
  startAt: z.number(),
  endAt: z.number(),
});

server.post("/summarizations", async (request, response) => {
  /**
   * ✅ Receber os dados do meu front-end
   * ✅ Validar os dados recebidos do meu front-end
   * ✅ Transformar o video do link em um áudio e salvar ele temporariamente na pasta public/audios
   * ✅ Enviar o audio para a API do assemblyai e pegar o resumo e transcrição
   * ✅ Salvar as informações do resumo no banco de dados local
   * ✅ Excluir o audio depois de criar a transcrição
   *
   * ✅ Criar o banco de dados PostgreSQL.
   * ✅ Conexão do back-end com o bando de dados PostgreSQL.
   * ✅ Salvar nossos dados no banco de dados.
   *
   * ✅ Pegar os resumos criados do banco de dados e retornar para o client
   */

  try {
    const { title, link, startAt, endAt } = request.body;
    const validatedData = audioSchema.parse({ title, link, startAt, endAt });

    const videoReadableStream = ytdl(validatedData.link, {
      quality: "lowestaudio",
    });

    const filename = `${randomUUID()}.mp3`;
    const outputFolder = "public/audios/";

    const ffmpegCommand = ffmpeg(videoReadableStream)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .seekInput(validatedData.startAt)
      .duration(validatedData.endAt - validatedData.startAt)
      .format("mp3")
      .output(`${outputFolder}${filename}`);

    await new Promise((resolve, reject) => {
      ffmpegCommand.on("end", resolve);
      ffmpegCommand.on("error", reject);
      ffmpegCommand.run();
    });

    const params = {
      audio: `${outputFolder}${filename}`,
      summarization: true,
      summary_model: "informative",
      summary_type: "bullets",
    };

    const transcript = await assemblyAiClient.transcripts.transcribe(params);

    validatedData.transcript = transcript.text;
    validatedData.summary = transcript.summary;

    await createSummarization(validatedData);

    unlink(`${outputFolder}${filename}`, (err) => {
      if (err) return console.log(err);
      console.log(`${outputFolder}${filename} deleted successfully`);
    });

    return response.status(201).send({ success: true });
  } catch (error) {
    return response.status(500).send({ success: false, message: error });
  }
});

server.get("/summarizations", async(request, response) => {
  const summarizations = await getSummarizations();

  return response.status(200).send(summarizations);
});

server.put("/summarizations/:id", (request, response) => {
  const summarizationId = request.params.id;
  const { title, link, startAt, endAt } = request.body;

  database.update(summarizationId, {
    title: title,
    link: link,
    startAt: startAt,
    endAt: endAt,
  });

  return response.status(204);
});

server.delete("/summarizations/:id", (request, response) => {
  const summarizationId = request.params.id;
  database.delete(summarizationId);

  return response.status(200);
});

server.listen({ port: 3030 });

console.log("Server listening on port: 3030");
