export function validate(schema) {
  return async function validationMiddleware(req, res, next) {
    try {
      let validatedData;

      // Complete Zod schema:
      // z.object({ body, params, query })
      if (typeof schema?.parseAsync === "function") {
        validatedData = await schema.parseAsync({
          body: req.body,
          params: req.params,
          query: req.query
        });
      } else {
        // Separate schemas:
        // { body: ..., params: ..., query: ... }
        validatedData = {
          body: schema?.body
            ? await schema.body.parseAsync(req.body)
            : req.body,

          params: schema?.params
            ? await schema.params.parseAsync(req.params)
            : req.params,

          query: schema?.query
            ? await schema.query.parseAsync(req.query)
            : req.query
        };
      }

      req.body = validatedData.body;
      req.params = validatedData.params;

      // Express 5 exposes req.query through a getter.
      req.validatedQuery = validatedData.query;

      next();
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        });
      }

      next(error);
    }
  };
}