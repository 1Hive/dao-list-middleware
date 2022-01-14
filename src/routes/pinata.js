import fetch from "node-fetch";
import FormData from "form-data";

const ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_API_TOKEN = process.env.PINATA_API_TOKEN;

export const postPinFileToIPFS = async (req, res) => {
  try {
    let retObj = {};
    if (req.busboy) {
      req.busboy.on("file", async (name, file, info) => {
        const result = await uploadToPinata(file, info);
        console.log(result);
        console.log(name);
        console.log(info);
        retObj = {
          ...result,
        };
        res.send(retObj);
      });
      req.pipe(req.busboy);
    }

    return retObj;
  } catch (error) {
    console.error(error);
    return { data: { error }, error: true };
  }
};

export async function uploadToPinata(file, info) {
  try {
    const formData = new FormData();

    formData.append("file", file, {
      contentType: info.mimeType,
      filename: info.filename,
    });

    const result = await fetch(ENDPOINT, {
      // Your POST endpoint
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_API_TOKEN}`,
      },
      body: formData,
    });

    const data = await result.json();
    return { data, error: !result.ok };
  } catch (error) {
    console.error(error);
    return { error: true };
  }
}
