require("dotenv").config();

module.exports = {
  development: {
    // If DATABASE_URL exists, use it (for connecting to Render DB locally)
    // Otherwise use individual DB credentials
    // use_env_variable: process.env.DATABASE_URL ? "DATABASE_URL" : undefined,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "postgres",
    // dialectOptions: process.env.DATABASE_URL
    //   ? {
    //       ssl: {
    //         require: true,
    //         rejectUnauthorized: false,
    //       },
    //     }
    //   : {},
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
