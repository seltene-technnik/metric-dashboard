var http = require('http');
var express = require("express");
var app = express();
var cors = require('cors');
var originsWhitelist = [
    'https://palmbeach-dev.techo2.com/',
    'https://palmbeach-dev.techo2.com',
    // 'https://app.adomdashboard.com',
    // 'https://adomdashboard.com',
    // 'https://www.adomdashboard.com',
    'http://localhost:4200',
    'http://localhost:4201'
];

const userController = require('./Controllers/Users');
const dashboardController = require('./Controllers/Dashboard');
const planningController = require('./Controllers/Planning');
const adminController = require('./Controllers/admin');
const DataAssesmentPlanController = require('./Controllers/dataAssesmentPlan');
const PDPlanController = require('./Controllers/pdPlan');
const annualDataController = require('./Controllers/AnnualDataTarget');

var corsOptions = {
    origin: function (origin, callback) {
        var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
    },
    credentials: true
}
app.use(cors(corsOptions));
app.use(express.json({
    limit: '50mb',
    extended: true
}));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

var session = function (req, res, next) {
    next();
}

app.use('/users', session, userController);
app.use('/dashboard', session, dashboardController);
app.use('/planning', session, planningController);
app.use('/admin', adminController);
app.use('/dataAssesmentPlan', DataAssesmentPlanController);
app.use('/pdPlan', PDPlanController)
app.use('/annualData', annualDataController)

const server = http.createServer(app);

server.listen((process.env.NODE_PORT || 9000), () => {
    console.log(`Listening port : ${(process.env.NODE_PORT || 9000)}`)
});



// CREATE TABLE `stag_bkp`.`racialbreakdown` (
//   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
//   `catholic` DECIMAL(10,2) NULL,
//   `americanIndian` DECIMAL(10,2) NULL,
//   `asian` DECIMAL(10,2) NULL,
//   `blackOrAfricanAmerican` DECIMAL(10,2) NULL,
//   `nativeHawaiian` DECIMAL(10,2) NULL,
//   `middleEastern` DECIMAL(10,2) NULL,
//   `hispanic` DECIMAL(10,2) NULL,
//   `white` DECIMAL(10,2) NULL,
//   `twoOrMoreRaces` DECIMAL(10,2) NULL,
//   `academicYearId` INT NOT NULL,
//   `createdAt` DATETIME NULL DEFAULT NOW(),
//   `updatedAt` DATETIME NULL DEFAULT NOW(),
//   PRIMARY KEY (`id`),
//   UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);


// CREATE TABLE `stag_bkp`.`ethnicitybreakdown` (
//   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
//   `hispanic` VARCHAR(45) NULL,
//   `haitian` VARCHAR(45) NULL,
//   `notHispanicNotHaitain` VARCHAR(45) NULL,
//   `academicYearId` INT NOT NULL,
//   `createdAt` DATETIME NULL DEFAULT NOW(),
//   `updatedAt` DATETIME NULL DEFAULT NOW(),
//   PRIMARY KEY (`id`),
//   UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);

// CREATE TABLE `stag_bkp`.`learningmodicationsandsupports` (
//   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
//   `title1` DECIMAL(10,2) NULL,
//   `ell` DECIMAL(10,2) NULL,
//   `accomodationPlan` DECIMAL(10,2) NULL,
//   `ilp` DECIMAL(10,2) NULL,
//   `fes_ua` DECIMAL(10,2) NULL,
//   `ftc` DECIMAL(10,2) NULL,
//   `fes_eo` DECIMAL(10,2) NULL,
//   `vpk` DECIMAL(10,2) NULL,
//   `schoolReadiness` DECIMAL(10,2) NULL,
//   `academicYearId` INT NOT NULL,
//   `createdAt` DATETIME NULL DEFAULT NOW(),
//   `updatedAt` DATETIME NULL DEFAULT NOW(),
//   PRIMARY KEY (`id`),
//   UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);
