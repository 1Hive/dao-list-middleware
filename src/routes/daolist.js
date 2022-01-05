import fetch from "node-fetch";
import axios from "axios";

const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;

export const ASSETS_FOLDER_BASE =
  "https://raw.githubusercontent.com/kamikazebr/dao-list/master/assets";

const ENDPOINT_BASE = "https://api.github.com/repos/kamikazebr/dao-list";
// const ENDPOINT_BASE = "https://api.github.com/repos/1Hive/dao-list";

export const fetchLatestCommitSha = async () => {
  const endpoint = `${ENDPOINT_BASE}/git/refs/heads/master`;
  try {
    const result = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
    });
    const data = await result.json();

    return { data: data.object.sha, error: !result.ok };
  } catch (err) {
    console.error(`Error requesting commit sha`, err);
    return { error: true };
  }
};

export const fetchBaseTreeSha = async (commitSha) => {
  console.log(GITHUB_API_TOKEN);

  const endpoint = `${ENDPOINT_BASE}/git/commits/${commitSha}`;
  try {
    const result = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
    });
    const data = await result.json();

    return { data: data.tree.sha, error: !result.ok };
  } catch (err) {
    console.error(`Error fetching base tree sha`, err);
    return { error: true };
  }
};

export const fetchFileContent = async (networkName) => {
  const network = networkName;
  const endpoint = `${ENDPOINT_BASE}/contents/${network}.json`;

  try {
    const result = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.VERSION.raw",
        "Content-Type": "application/json",
      },
    });

    let data;
    try {
      data = await result.json();
    } catch (err) {
      console.log("error parsing result ", err);
    }

    return { data, error: !result.ok };
  } catch (err) {
    console.error(`Error fetching garden list content`, err);
    return { error: true };
  }
};

export const createTree = async ({ baseTreSha, fileContent, networkName }) => {
  const endpoint = `${ENDPOINT_BASE}/git/trees`;

  if (!networkName) {
    throw new Error("networkName its not defined");
  }
  const network = networkName.toLowerCase();

  const bodyData = {
    base_tree: baseTreSha ?? undefined,
    tree: [
      {
        path: `${network}.json`,
        mode: "100644",
        type: "blob",
        content: JSON.stringify(fileContent, null, 4),
      },
    ],
  };

  console.log(bodyData);

  try {
    const result = await axios.post(endpoint, bodyData, {
      headers: {
        Authorization: `token ${GITHUB_API_TOKEN}`,
      },
    });
    const { data } = result;
    console.log(data);

    return { data: data.sha, error: !result.ok };
  } catch (err) {
    console.error(`Error createTree`, err);
    // return { error: true };
    throw err;
  }
};
const createCommit = async ({ latestCommitSha, newTreeSha, daoName }) => {
  const endpoint = `${ENDPOINT_BASE}/git/commits`;
  const bodyData = {
    parents: [latestCommitSha],
    tree: newTreeSha,
    message: ` ${daoName} added`,
  };
  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    const data = await result.json();
    console.log(data);
    return { data: data.sha, error: !result.ok };
  } catch (err) {
    console.error(`Error creating commit`, err);
    // return { error: true };
    throw err;
  }
};

const changeHeadsCommitSha = async (commitSha) => {
  const endpoint = `${ENDPOINT_BASE}/git/refs/heads/master`;
  const bodyData = {
    sha: commitSha,
  };
  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    const data = await result.json();
    console.log(data);
    console.log(result.ok);
    return { data: data, error: !result.ok };
  } catch (err) {
    console.error(`Error requesting tree sha`, err);
    // return { error: true };
    throw err;
  }
};

export const getLatestCommitRoute = async (req, res) => {
  const retu = await fetchLatestCommitSha();
  console.log(retu);
  return res.send(retu);
};

export const postApplyCommitRoute = async (req, res) => {
  const result = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `token ${GITHUB_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
  });
  const data = await result.json();

  return { data: data.sha, error: !result.ok };
};

export const postCreateTreeRoute = async (req, res) => {
  try {
    let {
      baseTreSha,
      newContent,
      networkName,
      latestCommitSha,
      daoMetadataName,
    } = req.body;

    const { data: newTreeSha } = await createTree({
      baseTreSha,
      fileContent: newContent,
      networkName,
    });
    // console.log(`newTreeSha:${newTreeSha}`);

    const { data: commitSha } = await createCommit({
      latestCommitSha,
      newTreeSha,
      daoName: daoMetadataName,
    });

    const result = await changeHeadsCommitSha(commitSha);
    // console.log(result);
    // res.send({ baseTreSha, latestCommitSha });
    return {
      data: { result, commitSha, newTreeSha, baseTreSha, latestCommitSha },
      error: false,
    };
  } catch (error) {
    console.error(error);
    return { data: { error }, error: true };
  }
};
