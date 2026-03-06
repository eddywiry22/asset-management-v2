const { badRequest } = require('../utils/response');

/**
 * Joi validation middleware factory.
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} target - Which part of the request to validate (default: 'body')
 */
const validate = (schema, target = 'body') =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return badRequest(res, 'Validation failed', errors);
    }

    // Replace with stripped / coerced value
    req[target] = value;
    return next();
  };

module.exports = validate;
