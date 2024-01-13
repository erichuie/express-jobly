"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */


describe("create", function () {
  const newJob = {
    title: "job",
    salary: 1000,
    equity: "0.5",
    company_handle: "c1",
  };
  test("creating a job in the database", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "job",
      salary: 1000,
      equity: "0.5",
      company_handle: "c1",
    });

    const result = await db.query(
      `
      SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id=$1;
      `, [job.id]
    );

    expect(result.rows[0]).toEqual({
      id: expect.any(Number),
      title: "job",
      salary: 1000,
      equity: "0.5",
      company_handle: "c1",
    });
  });

  test(
    "fail creating a job when company handle does not exist",
    async function () {
      const invalidJob = {
        title: "job",
        salary: 1000,
        equity: "0.5",
        company_handle: "error",
      };
      try {
        await Job.create(invalidJob);
        throw new Error("fail test, you shouldn't get here");
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
      // expect(async function(){
      //   await Job.create(invalidJob)
      // })
      //   .toThrow(NotFoundError);
    });
});

/************************************** findAll */
// ('j1', 100, '0.1', 'c1'),
//              ('j2', 200, '0.2', 'c2'),
//              ('j3', 300, '0.3', 'c3')
describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0.1",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.2",
        company_handle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.3",
        company_handle: "c3",
      },
    ]);
  });
});

/************************************** findFilteredJobs */
// TODO:



/************************************** get */

// CREATE TABLE jobs (
//   id SERIAL PRIMARY KEY,
//   title TEXT NOT NULL,
//   salary INTEGER CHECK (salary >= 0),
//   equity NUMERIC CHECK (equity <= 1.0),
//   company_handle VARCHAR(25) NOT NULL
//     REFERENCES companies ON DELETE CASCADE
// );

describe("get", function () {
  test("works", async function () {
    const job = await Job.get(1);

    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 100,
      equity: "0.1",
      company_handle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
    // expect(async () => await Job.get(-1))
    //   .toThrow(NotFoundError);
  });
});





/************************************** update */

describe("update", function () {
  const updateData = {
    title: "Updatedjobtitle",
    salary: 24320,
    equity: "0.5",
  };

  test("works", async function () {
    const newJob = await Job.update(testJobIds[0], updateData);
    expect(newJob).toEqual({
      id: testJobIds[0],
      company_handle: "c1",
      ...updateData
    });

    const result = await db.query(`
      SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id = $1
    `, [testJobIds[0]]);

    expect(result.rows).toEqual([
      {
        id: testJobIds[0],
        company_handle: "c1",
        ...updateData
      }
    ]);
  });

  test("job doesnt exist", async function () {
    try {
      const newJob = await Job.update(0, updateData);
      throw new Error("fail test shouldnt get there");
    }
    catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request no data", async function () {
    try {
      const newJob = await Job.update(0, {});
      throw new Error("fail test shouldnt get there");
    }
    catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query(
      "SELECT * FROM jobs WHERE id = $1", [testJobIds[0]]
    );
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});