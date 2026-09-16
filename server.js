const express = require("express");
const cors = require("cors");
const { buildSchema } = require("graphql");
const { createHandler } = require("graphql-http/lib/use/express");

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use(
  cors({
    origin: [
      "https://jayant-p-poc.oktademo.cloud",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// --------------------------------------------------
// GraphQL Schema
// --------------------------------------------------

const schema = buildSchema(`
  type Address {
    street: String
    houseNumber: String
    houseNumberAddition: String
    postalCode: String
    city: String
    country: String
  }

  input AddressInput {
    country: String!
    postalCode: String!
    city: String!
    street: String!
    houseNumber: String!
    houseNumberAddition: String
  }

  type AddressValidation {
    valid: Boolean!
    message: String
    normalizedAddress: Address
  }

  type Query {
    validateAddress(input: AddressInput!): AddressValidation!
  }
`);

// --------------------------------------------------
// GraphQL Resolver
// --------------------------------------------------

const root = {
  validateAddress: ({ input }) => {

    console.log("Address received:", input);

    // ------------------------------------------------
    // TEMPORARY TEST
    // Force GraphQL validation failure for:
    // NL + 3011 AA
    // ------------------------------------------------

    if (
      input.country === "NL" &&
      input.postalCode.toUpperCase() === "3011 AA"
    ) {

      console.log(
        "TEMP TEST: Returning GraphQL valid:false"
      );

      return {
        valid: false,
        message: "Address could not be verified.",
        normalizedAddress: null
      };
    }

    // ------------------------------------------------
    // Netherlands postal-code validation
    // Format: 1234 AB
    // ------------------------------------------------

    if (input.country === "NL") {

      const nlPostalCode =
        /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;

      if (!nlPostalCode.test(input.postalCode)) {

        return {
          valid: false,
          message: "Invalid Dutch postal code.",
          normalizedAddress: null
        };
      }

      return {
        valid: true,
        message: null,

        normalizedAddress: {
          street: input.street,
          houseNumber: input.houseNumber,
          houseNumberAddition:
            input.houseNumberAddition || "",
          postalCode: input.postalCode,
          city: input.city,
          country: input.country
        }
      };
    }

    // ------------------------------------------------
    // Belgium postal-code validation
    // Format: 1234
    // ------------------------------------------------

    if (input.country === "BE") {

      const bePostalCode =
        /^[1-9][0-9]{3}$/;

      if (!bePostalCode.test(input.postalCode)) {

        return {
          valid: false,
          message: "Invalid Belgian postal code.",
          normalizedAddress: null
        };
      }

      return {
        valid: true,
        message: null,

        normalizedAddress: {
          street: input.street,
          houseNumber: input.houseNumber,
          houseNumberAddition:
            input.houseNumberAddition || "",
          postalCode: input.postalCode,
          city: input.city,
          country: input.country
        }
      };
    }

    // ------------------------------------------------
    // Unsupported country
    // ------------------------------------------------

    return {
      valid: false,
      message: "Unsupported country.",
      normalizedAddress: null
    };
  }
};

// --------------------------------------------------
// GraphQL Endpoint
// --------------------------------------------------

app.all(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: root
  })
);

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "PostNL GraphQL POC"
  });
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `PostNL GraphQL POC running on port ${PORT}`
  );
});
