import sql from "./index.js";

const createSummarization = async (data) => {
  try {
    const response = await sql`
      INSERT INTO summarizations (title, link, startAt, endAt, transcript, summary)
      VALUES (${data.title}, ${data.link}, ${data.startAt}, ${data.endAt}, ${data.transcript}, ${data.summary})
    `;

    return response;
  } catch (error) {
    console.log(error);
  }
};

export default createSummarization;
