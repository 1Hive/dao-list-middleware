import fetch from "node-fetch";

const ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_API_TOKEN = process.env.PINATA_API_TOKEN;

export const postPinFileToIPFS = async (req, res) => {
  try {
    console.log(req.files);
    if (req.busboy) {
      req.busboy.on("file", (name, file, info) => {
        // ...
        console.log(file);
        console.log(name);
        console.log(info);
      });
      req.pipe(req.busboy);
    }
    // let [file] = req.files;

    // const result = await uploadToPinata(file);
    const result = false;

    const retObj = {
      data: result,
      error: result.error,
    };
    res.send(retObj);

    return retObj;
  } catch (error) {
    console.error(error);
    return { data: { error }, error: true };
  }
};

export async function uploadToPinata(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

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
