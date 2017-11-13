

const _ = require("lodash");

const defaultOpts = {};

/**
 * set default options
 * @param {Object} opt default options to override
 * @param {RedisClient} opt.redisClient ioredis client
 * @param {string} opt.message resubmission message to user default as  "please do not resubmission"
 * @param {number} opt.status http status when resubmission default as 400
 * @param {number} opt.timeout prevent resubmission in timeout senconds default as 60
 * @param {string} opt.prefix redis key prefix default as "resubmission#"
 * @returns {Object} this
 */
exports.options = (opt = {}) => _.extend(defaultOpts, opt) && exports;

/**
 * prevent resubmission
 * usage:
 *  app.post('/api',deresubmission({key:"business key"}),(req,res) =>{})
 * @param {string|function} opt.key a uniq business key of a function return this key
 * @return {middleware} return expressjs middleware
 */
exports.middleware = (middlewareOpt = {}) =>
  (req, res, next) => {
    const opt = _.extend({}, defaultOpts, middlewareOpt);
    let arrKeys = [opt.key];
    if (!opt.key) {
      throw new Error("opt.key should not be empty");
    }
    if (typeof opt.key === "function") {
      const keys = opt.key(req, res);
      if (Array.isArray(keys)) {
        arrKeys = keys;
      } else {
        arrKeys = [keys];
      }
    }
    const message = opt.message || "please do not resubmission";
    const status = opt.status || 400;
    const timeout = opt.timeout || 60;
    const pipeline = opt.redisClient.pipeline();
    const prefix = opt.prefix || "resubmission#";
    arrKeys.forEach((k) => {
      pipeline.setnx(prefix + k, "1");
      pipeline.expire(prefix + k, timeout);
    });
    return pipeline.exec().then((results) => {
      let isResubmission = false;
      results.forEach((result, i) => {
        if (i % 2 === 0 && (!result[1])) {
          isResubmission = true;
        }
      });
      if (isResubmission) {
        return res.status(status).send(message);
      }
      return next();
    });
  };

