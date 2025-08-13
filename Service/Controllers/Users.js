var xlsx = require('xlsx');
var express = require('express');
var router = express.Router();
var connection = require('../config');

const file = xlsx.readFile('./assets/Archdiocese Hierarchy.xlsx')
const adminSheet = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[0]]);
const regionalSheet = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[1]]);
const principalSheet = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[2]]);
const schools = adminSheet.map(school => {
    return { "schoolId": school['School ID'], "name": school['Schools'], "users": true }
})

/**
 * @author Manjunath
 * @uses To sign up user
 */
router.post('/signUp', function (req, res) {
    try {
        const email = req.body.email.toLowerCase();
        let sql = `SELECT * from Users WHERE email = ${connection.escape(email)}`;
        connection.query(sql, (error, result) => {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Error while fetching user',
                    error: error,
                    data: {}
                })
            } else {
                if (result.length != 0) {
                    res.json({
                        statusCode: 401,
                        message: "User already Exists",
                        error: "",
                        data: {}
                    })
                } else {
                    let sql = `INSERT INTO Users(firstName,lastName,email,roleId)VALUES(${connection.escape(req.body.firstName)},${connection.escape(req.body.lastName)},${connection.escape(email)},${req.body.roleId})`;
                    connection.query(sql, (error, result) => {
                        if (error) {
                            res.json({
                                statusCode: 400,
                                message: 'Error While Creating Account',
                                error: error,
                                data: {}
                            })
                        } else {
                            res.json({
                                statusCode: 200,
                                message: "success",
                                error: '',
                                data: result
                            })
                        }
                    })
                }
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        })
    }
})

/**
 * @author Manjunath
 * @uses To login
 */
router.post('/login', function (req, res) {
    try {
        const email = req.body.email.toLowerCase();
        let sql = `SELECT * from Users WHERE email = ${connection.escape(email)} AND isActive = 1`;
        connection.query(sql, (error, results) => {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: error,
                    error: error,
                    data: ''
                })
            } else {
                if (results.length == 0) {
                    res.json({
                        "statusCode": 401,
                        "message": "Unauthorized",
                        "error": "",
                        "data": {}
                    })
                } else {
                    let firstName = results[0]['firstName']
                    let lastName = results[0]['lastName']
                    let email = results[0]['email']
                    let roleId = results[0]['roleId']
                    let userId = results[0]['id']
                    if (results[0]['roleId'] == 1 || results[0]['roleId'] == 2) {
                        let sql = `SELECT * FROM Schools ORDER BY name ASC`
                        connection.query(sql, (error, results) => {
                            if (error) {
                                res.json({
                                    statusCode: 400,
                                    message: 'Error while fetching Schools',
                                    error: error,
                                    data: ''
                                })
                            } else {
                                const adminSchools = results.map(school => {
                                    return { "schoolId": school['schoolId'], "name": school['name'], "county" : school['county'], "users": true }
                                })
                                const user = {
                                    'firstName': firstName,
                                    'lastName': lastName,
                                    'email': email,
                                    'roleId': roleId,
                                    'schools': adminSchools,
                                    'userId' : userId
                                }
                                res.json({
                                    statusCode: 200,
                                    message: 'Success',
                                    error: '',
                                    data: user
                                })
                            }
                        })
                    } else if (results[0]['roleId'] == 3) {
                        let sql = `SELECT s.schoolId, s.name, s.county FROM Users u JOIN Schools s ON s.schoolId = u.schoolId WHERE (u.email = ${connection.escape(email)} OR u.alternateEmail = ${connection.escape(email)}) ORDER BY s.name ASC`
                        connection.query(sql, (error, results) => {
                            if (error) {
                                res.json({
                                    statusCode: 400,
                                    message: 'Error while fetching Schools',
                                    error: error,
                                    data: ''
                                })
                            } else {
                                const principalSchools = results.map(school => {
                                    return { "schoolId": school['schoolId'], "name": school['name'], "county" : school['county'], "users": true }
                                })
                                guestUsers(email, results => {
                                    if (results.length == 0) {
                                        const user = {
                                            'firstName': firstName,
                                            'lastName': lastName,
                                            'email': email,
                                            'roleId': roleId,
                                            'schools': principalSchools,
                                            'userId' : userId
                                        }
                                        res.json({
                                            "statusCode": 200,
                                            "message": "Success",
                                            "error": "",
                                            "data": user
                                        })
                                    } else {
                                        const schools = [...principalSchools, ...results];
                                        const uniqueSchools = [...new Set(schools.map(o => JSON.stringify(o)))].map(s => JSON.parse(s));
                                        const user = {
                                            'firstName': firstName,
                                            'lastName': lastName,
                                            'email': email,
                                            'roleId': roleId,
                                            'schools': uniqueSchools,
                                            'userId' : userId
                                        }
                                        res.json({
                                            "statusCode": 200,
                                            "message": "Success",
                                            "error": "",
                                            "data": user
                                        })
                                    }
                                })
                            }
                        })
                    } else if (results[0]['roleId'] == 4) {
                        guestUsers(results[0]['email'], results => {
                            if (results.length == 0) {
                                const user = {
                                    'firstName': firstName,
                                    'lastName': lastName,
                                    'email': email,
                                    'roleId': roleId,
                                    'schools': [],
                                    'userId' : userId
                                }
                                res.json({
                                    "statusCode": 401,
                                    "message": "success",
                                    "error": "",
                                    "data": user
                                })
                            } else {
                                const user = {
                                    'firstName': results[0].firstName,
                                    'lastName': results[0].lastName,
                                    'email': results[0].email,
                                    'roleId': roleId,
                                    'schools': results,
                                    'userId' : userId
                                }
                                res.json({
                                    "statusCode": 200,
                                    "message": "Success",
                                    "error": "",
                                    "data": user
                                })
                            }
                        })
                    } else {
                        res.json({
                            statusCode: 400,
                            message: 'Invalid User',
                            error: 'Invalid User',
                            data: ''
                        })
                    }
                }
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        })
    }
})

/**
 * @author Gopi
 * @uses To login with user credentials
 */
router.post('/login2', function (req, res) {
    try {
        const email = req.body.email.toLowerCase();
        let sql = `SELECT id, email, firstName, lastName, roleId, schoolId FROM Users WHERE email = ${connection.escape(email)} AND isActive = 1`
        connection.query(sql, (error, results) => {
            if (error) {
                res.json({
                    "statusCode": 400,
                    "error": error,
                    "message": error.message,
                    "data": []
                })
            }
            else {
                if (results.length > 0) {
                    res.json({
                        "statusCode": 200,
                        "message": "Login Successful",
                        "data": results[0]
                    })
                }
                else {
                    res.json({
                        "statusCode": 401,
                        "message": "No user found",
                        "data": []
                    })
                }
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        })
    }
});

function guestUsers(email, callback) {
    try {
        let sql = `SELECT S.name, S.county, S.schoolID AS schoolId, U.firstName, U.lastName, U.email, 'false' AS 'users' FROM Users U JOIN SchoolGuests SG ON SG.userId = U.id JOIN Schools S ON S.schoolID = SG.schoolID AND U.email = ${connection.escape(email)} AND U.isActive = 1 AND SG.isActive = 1`;
        connection.query(sql, function (error, results, fields) {
            if (error) {
                callback([])
            } else {
                callback(results)
            }
        })
    } catch (error) {
        callback([])
    }
}


/**
 * @author Nagendra
 * @uses To get list of guest users
 */
router.get('/list', function (req, res) {
    try {
        let sql = `SELECT U.id, CONCAT(U.firstName, ' ', U.lastName) AS 'name', U.email, SG.isActive, CONCAT(SUBSTRING(U.firstName, 1, 1), SUBSTRING(U.lastName, 1, 1)) AS profile FROM Users U JOIN SchoolGuests SG ON SG.userId = U.id AND SG.schoolId = ${req.query.schoolID}`;
        connection.query(sql, function (error, results, fields) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Error while performing list',
                    error: error.message,
                    data: ""
                })
            } else {
                res.json({
                    statusCode: 200,
                    message: 'success',
                    error: "",
                    data: results
                })
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        })
    }
});

/**
 * @author Nagendra
 * @uses To create new user as guest to school
 */
router.post('/create', function (req, res) {
    try {
        validateEmailExists(req.body.email, req.body.schoolID, result => {
            if (!result) {
                let sql = `INSERT INTO Users(firstName,lastName,email,roleId, schoolId)VALUES(${connection.escape(req.body.firstName)},${connection.escape(req.body.lastName)},${connection.escape(req.body.email)},${req.body.roleId}, ${req.body.schoolID})`;
                connection.query(sql, function (error, results, fields) {
                    if (error) {
                        res.json({
                            statusCode: 400,
                            message: 'Error while performing create',
                            error: error.message,
                            data: ""
                        })
                    } else {
                        let sql = `INSERT INTO SchoolGuests(schoolID, userId)VALUES(${req.body.schoolID}, ${results.insertId})`;
                        connection.query(sql, function (error, results, fields) {
                            if (error) {
                                res.json({
                                    statusCode: 400,
                                    message: 'Error while performing create',
                                    error: error.message,
                                    data: ""
                                })
                            } else {
                                res.json({
                                    statusCode: 200,
                                    message: 'success',
                                    error: "",
                                    data: results.insertId
                                })
                            }
                        })
                    }
                })
            } else {
                let sql = `SELECT * FROM Users U JOIN SchoolGuests SG ON SG.userId = U.id WHERE (U.email = ${connection.escape(req.body.email)} OR U.alternateEmail = ${connection.escape(req.body.email)}) AND SG.schoolID = ${req.body.schoolID}`;
                connection.query(sql, function (error, results, fields) {
                    if (error) {
                        res.json({
                            statusCode: 400,
                            message: error.message,
                            error: error,
                            data: ""
                        })
                    } else {
                        if (results.length > 0) {
                            res.json({
                                statusCode: 200,
                                message: 'User already exists',
                                error: "",
                                data: ""
                            })
                        } else {
                            let sql = `INSERT INTO SchoolGuests(schoolID, userId)VALUES(${req.body.schoolID}, ${result})`;
                            connection.query(sql, function (error, results, fields) {
                                if (error) {
                                    res.json({
                                        statusCode: 400,
                                        message: error.message,
                                        error: error,
                                        data: ""
                                    })
                                } else {
                                    res.json({
                                        statusCode: 200,
                                        message: 'success',
                                        error: "",
                                        data: results.insertId
                                    })
                                }
                            })
                        }
                    }
                })
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        })
    }
});

/**
 * @author Nagendra
 * @uses To update user isActive for Guest User
 */
router.post('/updateStatus', function (req, res) {
    try {
        let sql = `UPDATE SchoolGuests SET isActive = ${req.body.isActive} WHERE userId = ${req.body.userId} AND schoolId = ${req.body.schoolId}`;
        connection.query(sql, function (error, results, fields) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: error.message,
                    error: error,
                    data: ""
                })
            } else {
                res.json({
                    statusCode: 200,
                    message: 'success',
                    error: "",
                    data: ""
                })
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        })
    }
});

function validateEmailExists(email, schoolID, callback) {
    let sql = `SELECT * FROM Users WHERE (email = ${connection.escape(email)} OR alternateEmail = ${connection.escape(email)}) `
    connection.query(sql, (error, result) => {
        if (!error && result.length > 0) {
            callback(result[0].id)
        } else {
            callback(false)
        }
    })

}


module.exports = router;

