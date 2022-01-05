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
  it("should response the GET method", async () => {
    return request(app)
      .get("/v1/dao")
      .then((response) => {
        expect(response.statusCode).toBe(200);
      });
  }, 5000);
});

describe("Test the v1 dao helper funcs", () => {
  xit(
    "should response data and error false - from method fetchLatestCommitSha",
    (done) => {
      expect.assertions(2);
      fetchLatestCommitSha()
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
        "2a1dd57555f8f85c5eae9e409f0d03dc9e8d4202"
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
});

xit(
  "should response data and error false - from method fetchFileContent",
  async () => {
    // expect.assertions(2);
    const ret = await fetchFileContent("rinkeby");
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
    const ret = await fetchFileContent("invalid_name_rinkeby");
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
    };

    const ret = await createTree(config);
    console.log(JSON.stringify(ret, null, 4));
    expect(ret).toHaveProperty("data");
    expect(ret).toHaveProperty("error", true);
  },
  TIMEOUT
);

describe("Test all functions together", () => {
  it(
    "should change rinkeby.json on github - from method postCreateTreeRoute",
    async () => {
      let res = {
        send: console.log,
      };

      const fileRet = await fetchFileContent("rinkeby");
      const fileContent = fileRet.data;

      const daoAddress = "0x2323";
      const daoMetadata = {
        name: "SomeTestDAO",
        description: "Some awesome description DAO",
      };
      const newDaoList = fileContent.gardens;

      //TODO Could remove defaults variables, getting smaller file
      // newDaoList.map((dao) => {
      //   dao["links"]["community"];
      //   dao["links"]["documentation"];
      //   return dao;
      // });

      newDaoList.push({
        address: daoAddress,
        name: daoMetadata.name,
        description: daoMetadata.description,
        // forum: daoMetadata.forum,
        // links: daoMetadata.links,
        // logo:
        //   daoMetadata.logo &&
        //   `${ASSETS_FOLDER_BASE}/${daoMetadata.name}/logo.${daoMetadata.logo.imageExtension}`,
        // logo_type:
        //   daoMetadata.logo_type &&
        //   `${ASSETS_FOLDER_BASE}/${daoMetadata.name}/logo_type.${daoMetadata.logo_type.imageExtension}`,
        // token_logo:
        //   daoMetadata.token_logo &&
        //   `${ASSETS_FOLDER_BASE}/${daoMetadata.name}/token_logo.${daoMetadata.token_logo.imageExtension}`,
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

it.todo("test createTree method");
it.todo("test createCommit method");
it.todo("test changeHeadsCommitSha method");
