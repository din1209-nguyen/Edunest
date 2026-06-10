export const validateRequest =
  (schema, type = "body") =>
  (req, res, next) => {
    try {
      const dataToValidate = type === "query" ? req.query : req.body;
      const parsed = schema.safeParse(dataToValidate);
      if (!parsed.success) {
        const error = new Error(
          parsed.error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        );
        error.statusCode = 400;
        return next(error);
      }
      if (type === "query") {
        req.validatedQuery = parsed.data;
      } else {
        req.validatedBody = parsed.data;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
