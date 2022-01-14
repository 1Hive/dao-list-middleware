import fetch from "node-fetch";
import axios from "axios";
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;

const OWNER_REPO = process.env.OWNER_REPO ?? "kamikazebr"; //1Hive
const REPO = "dao-list";

// export const ASSETS_FOLDER_BASE = `https://raw.githubusercontent.com/${OWNER_REPO}/${REPO}/master/assets`;

const ENDPOINT_BASE = `https://api.github.com/repos`;

export const fetchLatestCommitSha = async (ownerRepo, repo = "dao-list") => {
  if (!ownerRepo || (ownerRepo && ownerRepo.trim() === "")) {
    throw new Error("ownerRepo its not defined");
  }
  const endpoint = `${ENDPOINT_BASE}/${ownerRepo}/${repo}/git/refs/heads/master`;
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

export const fetchBaseTreeSha = async (
  commitSha,
  ownerRepo,
  repo = "dao-list"
) => {
  if (!ownerRepo || (ownerRepo && ownerRepo.trim() === "")) {
    throw new Error("ownerRepo its not defined");
  }
  const endpoint = `${ENDPOINT_BASE}/${ownerRepo}/${repo}/git/commits/${commitSha}`;
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

export const fetchFileContent = async (
  networkName,
  ownerRepo,
  repo = "dao-list"
) => {
  if (!ownerRepo || (ownerRepo && ownerRepo.trim() === "")) {
    throw new Error("ownerRepo its not defined");
  }
  const network = networkName;
  const endpoint = `${ENDPOINT_BASE}/${ownerRepo}/${repo}/contents/${network}.json`;

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

export const createTree = async ({
  baseTreSha,
  fileContent,
  networkName,
  ownerRepo,
  repo = "dao-list",
}) => {
  if (!ownerRepo || (ownerRepo && ownerRepo.trim() === "")) {
    throw new Error("ownerRepo its not defined");
  }
  const endpoint = `${ENDPOINT_BASE}/${ownerRepo}/${repo}/git/trees`;

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
const createCommit = async ({
  latestCommitSha,
  newTreeSha,
  daoName,
  ownerRepo,
  repo = "dao-list",
}) => {
  if (!ownerRepo || (ownerRepo && ownerRepo.trim() === "")) {
    throw new Error("ownerRepo its not defined");
  }
  const endpoint = `${ENDPOINT_BASE}/${ownerRepo}/${repo}/git/commits`;
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
    throw err;
  }
};

const changeHeadsCommitSha = async (
  commitSha,
  ownerRepo,
  repo = "dao-list"
) => {
  if (!ownerRepo || (ownerRepo && ownerRepo.trim() === "")) {
    throw new Error("ownerRepo its not defined");
  }
  const endpoint = `${ENDPOINT_BASE}/${ownerRepo}/${repo}/git/refs/heads/master`;
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
    throw err;
  }
};

export const postCreateTreeRoute = async (req, res) => {
  try {
    let {
      baseTreSha,
      newContent,
      networkName,
      latestCommitSha,
      daoMetadataName,
      ownerRepo,
      repo,
    } = req.body;

    const { data: newTreeSha } = await createTree({
      baseTreSha,
      fileContent: newContent,
      networkName,
      ownerRepo,
      repo,
    });
    // console.log(`newTreeSha:${newTreeSha}`);

    const { data: commitSha } = await createCommit({
      latestCommitSha,
      newTreeSha,
      daoName: daoMetadataName,
      ownerRepo,
      repo,
    });

    const result = await changeHeadsCommitSha(commitSha, ownerRepo, repo);
    // console.log(result);
    const retObj = {
      data: { result, commitSha, newTreeSha, baseTreSha, latestCommitSha },
      error: false,
    };
    res.send(retObj);

    return retObj;
  } catch (error) {
    console.error(error);
    return { data: { error }, error: true };
  }
};

export const putCreateAssets = async (req, res) => {
  try {
    let {
      pathFileName,
      commitMessage,
      contentBase64,
      folderName,
      ownerRepo,
      repo,
    } = req.body;

    const result = await createFileContent(
      folderName,
      pathFileName,
      contentBase64,
      commitMessage,
      ownerRepo,
      repo
    );

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

const createFileContent = async (
  folderName,
  fileName,
  base64,
  commitMsg,
  ownerRepo,
  repo = "dao-list"
) => {
  if (!ownerRepo || (ownerRepo && ownerRepo.trim() === "")) {
    throw new Error("ownerRepo its not defined");
  }
  const endpoint = `${ENDPOINT_BASE}/${ownerRepo}/${repo}/contents/assets/${folderName}/${fileName}`;

  const bodyData = {
    owner: OWNER_REPO,
    repo: REPO,
    path: fileName,
    message: commitMsg,
    content: base64,
  };
  try {
    const result = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    const data = await result.json();

    return { data: data, error: !result.ok };
  } catch (err) {
    console.error(`Error requesting createFileContent`, err);
    return { error: true };
  }
};
