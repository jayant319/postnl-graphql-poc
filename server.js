const express = require("express");
const cors = require("cors");
const { buildSchema } = require("graphql");
const { createHandler } = require("graphql-http/lib/use/express");

const app = express();

const PORT = process.env.PORT || 3000;

/* CORS */
app.use(
  cors({
    origin: "https://jayant-p-poc.oktademo.cloud",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

/* GraphQL Schema */
const schema = buildSchema(`
  type Query {
    validateAddress(input: AddressInput!): AddressValidationResult!
  }

  input AddressInput {
    country: String!
    postalCode: String!
    city: String!
    street: String!
    houseNumber: String!
    houseNumberAddition: String
  }

  type AddressValidationResult {
    valid: Boolean!
    message: String
    normalizedAddress: NormalizedAddress
  }

  type NormalizedAddress {
    street: String
    houseNumber: String
    houseNumberAddition: String
    postalCode: String
    city: String
    country: String
  }
`);

/* Address Validation */
function validateAddress({ input }) {

  const {
    country,
    postalCode,
    city,
    street,
    houseNumber,
    houseNumberAddition
  } = input;

  /* Required fields */
  if (
    !country ||
    !postalCode ||
    !city ||
    !street ||
    !houseNumber
  ) {
    return {
      valid: false,
      message: "Required address information is missing.",
      normalizedAddress: null
    };
  }

  /* Netherlands */
  if (country === "NL") {

    const nlPostalCode =
      /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;

    if (!nlPostalCode.test(postalCode)) {
      return {
        valid: false,
        message: "Invalid Dutch postal code.",
        normalizedAddress: null
      };
    }
  }

  /* Belgium */
  if (country === "BE") {

    const bePostalCode =
      /^[1-9][0-9]{3}$/;

    if (!bePostalCode.test(postalCode)) {
      return {
        valid: false,
        message: "Invalid Belgian postal code.",
        normalizedAddress: null
      };
    }
  }

  /* Mock successful validation */
  return {
    valid: true,
    message: null,

    normalizedAddress: {
      street: street,
      houseNumber: houseNumber,
      houseNumberAddition:
        houseNumberAddition || "",
      postalCode:
        postalCode
          .toUpperCase()
          .replace(/\s+/g, " "),
      city: city,
      country: country
    }
  };
}

/* Resolver */
const root = {
  validateAddress
};

/* GraphQL endpoint */
app.all(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: root
  })
);

/* Health check */
app.get("/", (req, res) => {
  res.json({
    status: "UP",
    service: "PostNL GraphQL Address Validation POC"
  });
});

/* Start server */
app.listen(PORT, () => {
  console.log(
    `GraphQL server running on port ${PORT}`
  );
});
