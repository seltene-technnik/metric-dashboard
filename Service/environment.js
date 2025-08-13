module.exports = function () {
    switch (process.env.NODE_ENV) {
        case 'development':
            return {
                "database": {
                    host: "100.27.170.30",
                    port: 3306,
                    user: "admin",
                    password: "Techadmin@7410",
                    database: "palm_beach_staging",
                    multipleStatements: true,
                    connectionLimit: 10
                },
            };
        case 'production':
            return {
                "database": {
                    host: "100.27.170.30",
                    port: 3306,
                    user: "admin",
                    password: "Techadmin@7410",
                    database: "palm_beach_staging",
                    multipleStatements: true,
                    connectionLimit: 10
                },
            };
        default:
            return {
                "database": {
                    host: "100.27.170.30",
                    port: 3306,
                    user: "admin",
                    password: "Techadmin@7410",
                    database: "palm_beach_staging",
                    multipleStatements: true,
                    connectionLimit: 10
                },
            };
    }
};