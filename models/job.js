"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if job already in database.
   *
   */

  static async create({ title, salary, equity, company_handle }) {
    const companyCheck = await db.query(`
      SELECT handle
      FROM companies
      WHERE handle =$1`, [company_handle]);

    if (!companyCheck.rows[0]) {
      throw new NotFoundError(`No such company: ${company_handle}`);
    }

    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    salary,
                    equity,
                    company_handle`, [
      title,
      salary,
      equity,
      company_handle,
    ]);

    const job = result.rows[0];

    return job;
  };

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(`
      SELECT id,
             title,
             salary,
             equity,
             company_handle
      FROM jobs
      ORDER BY id
    `);

    return jobsRes.rows;
  }

  /** TODO:  Find all jobs according to the filtered criteria*/

  /** TODO:  Takes an object of filter criteria and generates corresponding
  * SQL statements for the WHERE clause and sanitizes values
  * */

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async get(id) {
    const jobRes = await db.query(`
      SELECT id,
             title,
             salary,
             equity,
             company_handle
      FROM jobs
      WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No such job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs SET ${setCols} WHERE id = ${idVarIdx}
    RETURNING id, title, salary, equity, company_handle`;

    // console.log("querySql", querySql);
    const res = await db.query(querySql, [...values, id]);
    const job = res.rows[0];

    if (!job) throw new NotFoundError(`No such job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

}
module.exports = Job;