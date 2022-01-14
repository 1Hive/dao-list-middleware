// const request = require("supert/est");
import request from "supertest";
// const app = require("../app");
import app from "../app.js";
import {
  fetchLatestCommitSha,
  fetchBaseTreeSha,
  fetchFileContent,
  createTree,
  postCreateTreeRoute,
} from "../routes/daolist.js";

const ENDPOINT_BASE = "https://api.github.com/repos/kamikazebr/dao-list";
const OWNER_REPO = "kamikazebr";
const REPO = "dao-list";
const TIMEOUT = 15000;

describe("Test the root path", () => {
  it("should response the GET method", (done) => {
    request(app)
      .get("/")
      .then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });
});

describe("Test the v1 dao endpoint", () => {
  it("should response with 404 not found the GET method", async () => {
    return request(app)
      .get("/v1/dao")
      .then((response) => {
        expect(response.statusCode).toBe(404);
      });
  }, 5000);

  it("should response the POST method", async () => {
    return request(app)
      .post("/v1/dao")
      .set("Content-type", "application/json")
      .send({
        baseTreSha: "782c4fc92c1f7f113fe4cb5304f866c34839df6c",
        newContent: "{}",
        networkName: "rinkeby",
        latestCommitSha: "2a1dd57555f8f85c5eae9e409f0d03dc9e8d4202",
        daoMetadataName: "dao-list-middleware-Test",
        ownerRepo: OWNER_REPO,
        repo: REPO,
      })
      .then((response) => {
        expect(response.statusCode).toBe(200);
      });
  }, 5000);
});

describe("Test the v1 dao Assets endpoint", () => {
  it("should not response the GET method", async () => {
    return request(app)
      .get("/v1/daoAssets")
      .then((response) => {
        expect(response.statusCode).not.toBe(200);
      });
  }, 5000);

  it("should response the PUT method", async () => {
    return request(app)
      .put("/v1/daoAssets")
      .set("Content-type", "application/json")
      .send({
        folderName: "test",
        pathFileName: "testfile",
        contentBase64: "b2kK",
        commitMessage: "A file test",
        ownerRepo: OWNER_REPO,
        repo: REPO,
      })
      .then((response) => {
        expect(response.statusCode).toBe(200);
      });
  }, 5000);
});

xdescribe("Test the v1 dao helper funcs", () => {
  xit(
    "should response data and error false - from method fetchLatestCommitSha",
    (done) => {
      expect.assertions(2);
      fetchLatestCommitSha(OWNER_REPO, REPO)
        .then((ret) => {
          expect(ret).toHaveProperty("data");
          expect(ret).toHaveProperty("error", false);
        })
        .finally(done);
    },
    TIMEOUT
  );

  xit(
    "should response data and error false - from method fetchBaseTreeSha",
    async () => {
      expect.assertions(2);
      const ret = await fetchBaseTreeSha(
        "2a1dd57555f8f85c5eae9e409f0d03dc9e8d4202",
        OWNER_REPO,
        REPO
      );
      console.log(ret);
      expect(ret).toHaveProperty(
        "data",
        "782c4fc92c1f7f113fe4cb5304f866c34839df6c"
      );
      expect(ret).toHaveProperty("error", false);
    },
    TIMEOUT
  );

  xit(
    "should response data and error false - from method fetchFileContent",
    async () => {
      // expect.assertions(2);
      const ret = await fetchFileContent("rinkeby", OWNER_REPO, REPO);
      // console.log(JSON.stringify(ret, null, 4));
      console.log(ret);

      expect(ret).toHaveProperty("data");
      expect(ret).toHaveProperty("error", false);
    },
    TIMEOUT
  );

  xit(
    "should response data with message error and error true - from method fetchFileContent",
    async () => {
      // expect.assertions(2);
      const ret = await fetchFileContent(
        "invalid_name_rinkeby",
        OWNER_REPO,
        REPO
      );
      console.log(JSON.stringify(ret, null, 4));
      expect(ret).toHaveProperty("data");
      expect(ret).toHaveProperty("error", true);
    },
    TIMEOUT
  );

  xit(
    "should create some Tree - from method createTree",
    async () => {
      // expect.assertions(2);
      let config = {
        baseTreeSha,
        fileContent,
        networkName: "invalid_name_rinkeby",
        ownerRepo: OWNER_REPO,
        repo: REPO,
      };

      const ret = await createTree(config);
      console.log(JSON.stringify(ret, null, 4));
      expect(ret).toHaveProperty("data");
      expect(ret).toHaveProperty("error", true);
    },
    TIMEOUT
  );
});

describe("Test all functions together", () => {
  it(
    "should change rinkeby.json on github - from method postCreateTreeRoute",
    async () => {
      let res = {
        send: console.log,
      };

      const fileRet = await fetchFileContent("rinkeby", OWNER_REPO, REPO);
      const fileContent = fileRet.data;

      const daoAddress = "0x2323";
      const daoMetadata = {
        name: "SomeTestDAO",
        description: "Some awesome description DAO",
      };
      const newDaoList = fileContent.gardens;

      const ASSETS_FOLDER_BASE = `https://raw.githubusercontent.com/kamikazebr/dao-list/master/assets`;

      newDaoList.push({
        address: daoAddress,
        name: daoMetadata.name,
        description: daoMetadata.description,
        forum: daoMetadata.forum,
        links: daoMetadata.links,
        logo:
          daoMetadata.logo &&
          `${ASSETS_FOLDER_BASE}/${daoMetadata.name}/logo.${daoMetadata.logo.imageExtension}`,
        logo_type:
          daoMetadata.logo_type &&
          `${ASSETS_FOLDER_BASE}/${daoMetadata.name}/logo_type.${daoMetadata.logo_type.imageExtension}`,
        token_logo:
          daoMetadata.token_logo &&
          `${ASSETS_FOLDER_BASE}/${daoMetadata.name}/token_logo.${daoMetadata.token_logo.imageExtension}`,
      });

      const newContent = {
        ...fileContent,
        gardens: newDaoList,
      };

      let req = {
        body: {
          baseTreSha: "782c4fc92c1f7f113fe4cb5304f866c34839df6c",
          newContent,
          networkName: "rinkeby",
          latestCommitSha: "2a1dd57555f8f85c5eae9e409f0d03dc9e8d4202",
          daoMetadataName: "dao-list-middleware-Test",
          ownerRepo: OWNER_REPO,
          repo: REPO,
        },
      };
      const retCreateCommit = await postCreateTreeRoute(req, res);
      console.log(JSON.stringify(retCreateCommit, null, 4));

      expect(retCreateCommit).toHaveProperty("data");
      expect(retCreateCommit.data).toHaveProperty("commitSha");
      expect(retCreateCommit.data).toHaveProperty("newTreeSha");
      expect(retCreateCommit.data).toHaveProperty("baseTreSha");
      expect(retCreateCommit.data).toHaveProperty("latestCommitSha");

      expect(retCreateCommit).toHaveProperty("error", false);
    },
    TIMEOUT
  );
});

describe("Test Pinata Upload", () => {
  it("should response the POST method", async () => {
    return (
      request(app)
        .post("/v1/pinata/pinFileToIPFS")
        // .set("Content-type", "application/json")
        .attach("file", "./README.md")
        .then((response) => {
          // console.log(response.body);
          expect(response.body).toHaveProperty("IpfsHash");
          expect(response.statusCode).toBe(200);
        })
    );
  }, 5000);
});

it.todo("test createTree method");
it.todo("test createCommit method");
it.todo("test changeHeadsCommitSha method");
