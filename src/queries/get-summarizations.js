import sql from "./index.js";

const getSummarizations = async () => {
  try {
    const response = await sql`
      SELECT * FROM summarizations ORDER by id
    `;

    return response;
  } catch (error) {
    console.log(error);
  }
};

export default getSummarizations;
