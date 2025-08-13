var connection = require('../config');
var express = require("express");
var router = express.Router();
const { v4: uuidv4 } = require('uuid');

/**
 * @author Gopi
 * @uses To save Excel data
 */
router.post('/saveExcelData', async function (req, res) {
    try {
        let schools = req.body.schools;
        let users = req.body.users;
        let schoolResponseArray = [];
        let usersResponseArray = [];
        if (schools.length > 0) {
            await deActivateUsers(users)
            for (i = 0; i < schools.length; i++) {
                const response = await schoolsDataInsertion(schools[i], 'post')
                schoolResponseArray.push(response);
                if (schoolResponseArray.length == schools.length) {
                    for (i = 0; i < users.length; i++) {
                        const userResponse = await usersDataInsertion(users[i])
                        usersResponseArray.push(userResponse);
                    }
                    if (usersResponseArray.length == usersResponseArray.length) {
                        res.json({
                            "statusCode": 200,
                            "message": "Excel data uploaded successfully"
                        })
                    }
                }
            }
        }
        else {
            res.json({
                "statusCode": 401,
                "message": "Please add the schools data"
            })
        }
    }
    catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        }
        res.send(response)
    }
})

async function deActivateUsers(updatedUsers) {
    // Worrying doesn't take away tomorrow's trouble, it takes away today's peace.
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Users WHERE roleId IN (2,3) AND isActive = 1`;
      
      connection.query(sql, (error, results) => {
        if (error) {
          return reject(error);
        }
        
        const updatedEmails = new Set(updatedUsers.map((user) => user.Email));
        const deletedUsers = results
          .filter((exuser) => !updatedEmails.has(exuser.email))
          .map((exuser) => exuser.id);
  
        if (deletedUsers.length === 0) {
          return resolve({ message: "No users to deactivate" });
        }
  
        const updateSql = `UPDATE Users SET isActive = 0 WHERE id IN (${deletedUsers.join(",")})`;
        
        connection.query(updateSql, (updateError, result) => {
          if (updateError) {
            return reject(updateError);
          }
          resolve({ message: "Users deactivated successfully", affectedRows: result.affectedRows });
        });
      });
    });
  }
  

/**
 * @author Gopi
 * @uses To insert school data
 */
async function schoolsDataInsertion(schoolDetails, type) {
    return new Promise(async (resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM Schools WHERE schoolId = ${schoolDetails.schoolId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO Schools(name, schoolId, county, createdAt) VALUES (${connection.escape(schoolDetails.schoolName)}, ${schoolDetails.schoolId}, ${connection.escape(schoolDetails.County)}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE Schools SET name = ${connection.escape(schoolDetails.schoolName)}, county = ${connection.escape(schoolDetails.County)}, updatedAt = now() WHERE schoolId = ${results[0].schoolId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        } else {
            let sql = `SELECT schoolId, name, county FROM Schools ORDER BY name ASC`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                }
                else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert users data
 */
async function usersDataInsertion(userDetails) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT id, email, schoolId FROM Users WHERE email = ${connection.escape(userDetails.Email)} AND schoolId = ${userDetails['School ID']}`
        connection.query(sql, async (error, results) => {
            if (error) {
                reject(error)
            }
            else {
                if (results.length == 0) {
                    let accessToken = uuidv4();
                    let sql = `INSERT INTO Users(email, firstName, lastName, roleId, schoolId, accessToken, createdAt) VALUES (${connection.escape(userDetails.Email)}, ${connection.escape(userDetails['First Name'])}, ${connection.escape(userDetails['Last Name'])}, ${userDetails.roleId}, ${userDetails['School ID']}, ${connection.escape(accessToken)}, now())`
                    connection.query(sql, (error, insertResponse) => {
                        if (error) {
                            reject(error)
                        }
                        else {
                            resolve(insertResponse)
                        }
                    })
                }
                else {
                    let sql = `UPDATE Users SET firstName = ${connection.escape(userDetails['First Name'])}, lastName = ${connection.escape(userDetails['Last Name'])}, roleId = ${userDetails.roleId}, updatedAt = now() WHERE email = ${connection.escape(results[0].email)} AND schoolId = ${results[0].schoolId}`
                    connection.query(sql, (error, updateResponse) => {
                        if (error) {
                            reject(error)
                        }
                        else {
                            resolve(updateResponse)
                        }
                    })
                }
            }
        })
    })
}

/**
 * @author Gopi
 * @uses To get Hierarchy data for admin
 */
router.get('/getHierarchyDataForAdmin', function (req, res) {
    try {
        const users = {
            "superAdmins": [],
            "schoolLevelUsers": [],
            "guestUsers": [],
        }
        let sql = `SELECT U.id, U.email, U.firstName, U.lastName, U.alternateEmail, U.roleId, U.schoolId FROM Users U JOIN Schools S ON S.schoolID = U.schoolId`
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
                results.map((data => {
                    (data.roleId == 1 || data.roleId == 2) ? users.superAdmins.push(data) : data.roleId == 3 ? users.schoolLevelUsers.push(data) : users.guestUsers.push(data)
                }))
                res.json({
                    "statusCode": 200,
                    "message": "Users fetched successfully",
                    "data": users
                })
            }
        })
    }
    catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        }
        res.send(response)
    }
})

/**
 * @author Gopi
 * @uses To Insert or Update Database from CSIP data file
 */
router.post('/saveCSIPData', async function (req, res) {
    try {
        const academicYearId = req.body.academicYearId
        let schools = req.body.schools;
        if (schools.length > 0) {
            try {
                const promises = schools.map(async (school) => {
                    const Schoolsresponse = await schoolsDataInsertion(school, 'post')
                    const academicPerformanceSummary = await academicPerformanceSummaryPromise(school, 'post', academicYearId)
                    // const studentDemographicInfo = await studentDemographicInfoPromise(school, 'post')
                    const ARKPerformanceSummary = await ARKPerformanceSummaryPromise(school, 'post', academicYearId)
                    const readingProficientPercent = await readingProficientPercentPromise(school, 'post', academicYearId)
                    const mathProficientPercent = await mathProficientPercentPromise(school, 'post', academicYearId)
                    const nceReadingFlag = await nceReadingFlagPromise(school, 'post', academicYearId)
                    const nceMathFlag = await nceMathFlagPromise(school, 'post', academicYearId)
                    const ARKProficiencyFlag = await ARKProficiencyFlagPromise(school, 'post', academicYearId)
                    const enrollmentFlag = await enrollmentFlagPromise(school, 'post', academicYearId)
                    const k2EnrollmentFlag = await k2EnrollmentFlagPromise(school, 'post', academicYearId)
                    const enrollmentCapacityFlag = await enrollmentCapacityFlagPromise(school, 'post', academicYearId)
                    const annualDataTargetpromise = await annualDataTarget(school, 'post', academicYearId)
                    const blueRibbonCalculatorpromise = await blueRibbonCalculator(school, academicYearId)
                });
                const enrollmentPromises = req.body.enrollmentSummary.map(async (item) => {
                    return enrollmentSummary(item, 'post');
                });
                const ARKProficiencyByGrade = req.body['ARK Proficiency by Grade'].map(async (item) => {
                    return ARKProficiencyByGradePromise(item, 'post', academicYearId);
                })
                // const blueRibonPerformance = req.body['Blue Ribbon Performance'].map(async (item) => {
                //     const blueRibbonReading = await blueRibbonReadingPromise(item, 'post', academicYearId)
                //     const blueRibbonMath = await blueRibbonMathPromise(item, 'post', academicYearId)
                //     const blueRibbonFlag = await blueRibbonFlagPromise(item, 'post', academicYearId)
                //     const gradeLevelpercent = await gradeLevelpercentPromise(item, 'post', academicYearId)
                // })
                const enrollmentByGrade = req.body['Enrollment by Grade'].map(async (item) => {
                    return enrollmentByGradePromise(item, 'post', academicYearId)
                })
                await Promise.all([...promises, ...enrollmentPromises, ...ARKProficiencyByGrade, ...enrollmentByGrade]);
                res.json({
                    statusCode: 200,
                    message: "Data Updated Successfully",
                    data: promises
                });
            } catch (error) {
                res.json({
                    statusCode: 400,
                    message: error.message,
                    error: error
                });
            }
        }
    } catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        }
        res.send(response)
    }
})

/**
 * @author Gopi
 * @uses To Insert or Update Database from CSIP data file
 */
router.post('/saveCSIPDataTwo', async function (req, res) {
    try {
        const academicYearId = req.body.academicYearId
        let mathNCEByGrade = req.body['Math NCE by Grade']
        if (mathNCEByGrade.length > 0) {
            try {
                const promises = mathNCEByGrade.map(async (school) => {
                    return averageChangeInMathNce(school, 'post', academicYearId)
                })
                const mathProficiencyByGrade = req.body['Math Proficiency by Grade'].map(async (school) => {
                    return mathProficiencyByGradePromise(school, 'post', academicYearId)
                })
                const readingNceByGrade = req.body['Reading NCE by Grade'].map(async (school) => {
                    return readingNceByGradePromise(school, 'post', academicYearId)
                })
                const readingProficiencyByGrade = req.body['Reading Proficiency by Grade'].map(async (school) => {
                    return readingProficiencyByGradePromise(school, 'post', academicYearId)
                })
                const demographic = req.body['Demographics Tab'].map(async (school) => {
                    // await Promise.all(
                        racialBreakdownPromise(school, 'post', academicYearId);
                        ethnicityBreakdownPromise(school, 'post', academicYearId);
                        return learningmodicationsandsupportsPromise(school, 'post', academicYearId);
                    // )
                })
                // const schoolCapacityByGrade = req.body['School Capacity by Grade'].map(async (school) => {
                //     return schoolCapacityByGradePromise(school, 'post', academicYearId)
                // })
                // const schoolCapacityByGrade = req.body['School Capacity by Grade'].map(async (school) => {
                //     return schoolCapacityByGradePromise(school, 'post', academicYearId)
                // })
                await Promise.all([...promises, ...mathProficiencyByGrade, ...readingNceByGrade, ...readingProficiencyByGrade, ...demographic]);
                res.json({
                    statusCode: 200,
                    message: "Data Updated Successfully",
                    data: promises
                });
            }
            catch (error) {
                res.json({
                    statusCode: 400,
                    message: error.message,
                    error: error
                });
            }
        }
    }
    catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        }
        res.send(response)
    }
})

async function blueRibbonCalculator(schoolDetails, academicYearId) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM BlueRibbonCalculator WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
        connection.query(sql, (error, results) => {
            if (error) {
                reject(error)
            } else {
                if (results.length == 0) {
                    let sql = `INSERT INTO BlueRibbonCalculator(schoolId, year, BRCSpring, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, 2024, '${schoolDetails.blueRibbonCalculator}', ${academicYearId}, now())`
                    connection.query(sql, (error, insertRes) => {
                        if (error) {
                            reject(error)
                        }
                        else {
                            resolve(insertRes)
                        }
                    })
                } else {
                    let sql = `UPDATE BlueRibbonCalculator SET BRCSpring = '${schoolDetails.blueRibbonCalculator}', updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                    connection.query(sql, (error, updateRes) => {
                        if (error) {
                            reject(error)
                        }
                        else {
                            resolve(updateRes)
                        }
                    })
                }
            }
        });
    })
}

/**
 * @author Gopi
 * @uses To insert & get averageChangeInMathNce
 */
async function averageChangeInMathNce(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM MathNceByGrade WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    let g3 = schoolDetails['Avg. Change in Math NCE - by Grade']['Avg. Change in NCE G3']
                    g3 = typeof g3 === 'number' ? g3 : null;
                    let g4 = schoolDetails['Avg. Change in Math NCE - by Grade']['Avg. Change in NCE G4']
                    g4 = typeof g4 === 'number' ? g4 : null;
                    let g5 = schoolDetails['Avg. Change in Math NCE - by Grade']['Avg. Change in NCE G5']
                    g5 = typeof g5 === 'number' ? g5 : null;
                    let g6 = schoolDetails['Avg. Change in Math NCE - by Grade']['Avg. Change in NCE G6']
                    g6 = typeof g6 === 'number' ? g6 : null;
                    let g7 = schoolDetails['Avg. Change in Math NCE - by Grade']['Avg. Change in NCE G7']
                    g7 = typeof g7 === 'number' ? g7 : null;
                    let g8 = schoolDetails['Avg. Change in Math NCE - by Grade']['Avg. Change in NCE G8']
                    g8 = typeof g8 === 'number' ? g8 : null;
                    if (results.length == 0) {
                        let sql = `INSERT INTO MathNceByGrade(schoolId, G3ChangeInNce, G4ChangeInNce, G5ChangeInNce, G6ChangeInNce, G7ChangeInNce, G8ChangeInNce, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${g3}, ${g4}, ${g5}, ${g6}, ${g7}, ${g8}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE MathNceByGrade SET G3ChangeInNce = ${g3}, G4ChangeInNce = ${g4}, G5ChangeInNce = ${g5}, G6ChangeInNce = ${g6}, G7ChangeInNce = ${g7}, G8ChangeInNce = ${g8}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, G3ChangeInNce, G4ChangeInNce, G5ChangeInNce, G6ChangeInNce, G7ChangeInNce, G8ChangeInNce, createdAt FROM MathNceByGrade WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get mathProficiencyByGrade
 */
async function mathProficiencyByGradePromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM MathProficiencyByGrade WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO MathProficiencyByGrade(schoolId, G2ProficiencyPercent, G3ProficiencyPercent, G4ProficiencyPercent, G5ProficiencyPercent, G6ProficiencyPercent, G7ProficiencyPercent, G8ProficiencyPercent, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${schoolDetails['Math Proficiency by Grade']['% Proficency G2']}, ${schoolDetails['Math Proficiency by Grade']['% Proficency G3']}, ${schoolDetails['Math Proficiency by Grade']['% Proficency G4']}, ${schoolDetails['Math Proficiency by Grade']['% Proficency G5']}, ${schoolDetails['Math Proficiency by Grade']['% Proficency G6']}, ${schoolDetails['Math Proficiency by Grade']['% Proficency G7']}, ${schoolDetails['Math Proficiency by Grade']['% Proficency G8']}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE MathProficiencyByGrade SET G2ProficiencyPercent = ${schoolDetails['Math Proficiency by Grade']['% Proficency G2']}, G3ProficiencyPercent = ${schoolDetails['Math Proficiency by Grade']['% Proficency G3']}, G4ProficiencyPercent = ${schoolDetails['Math Proficiency by Grade']['% Proficency G4']}, G5ProficiencyPercent = ${schoolDetails['Math Proficiency by Grade']['% Proficency G5']}, G6ProficiencyPercent = ${schoolDetails['Math Proficiency by Grade']['% Proficency G6']}, G7ProficiencyPercent = ${schoolDetails['Math Proficiency by Grade']['% Proficency G7']}, G8ProficiencyPercent = ${schoolDetails['Math Proficiency by Grade']['% Proficency G8']}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, G2ProficiencyPercent, G3ProficiencyPercent, G4ProficiencyPercent, G5ProficiencyPercent, G6ProficiencyPercent, G7ProficiencyPercent, G8ProficiencyPercent, createdAt FROM MathProficiencyByGrade WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get readingNceByGrade
 */
async function readingNceByGradePromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM ReadingNceByGrade WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    let g3 = schoolDetails['Avg. Change in Reading NCE - by Grade']['Avg. Change in NCE G3']
                    g3 = typeof g3 === 'number' ? g3 : null;
                    let g4 = schoolDetails['Avg. Change in Reading NCE - by Grade']['Avg. Change in NCE G4']
                    g4 = typeof g4 === 'number' ? g4 : null;
                    let g5 = schoolDetails['Avg. Change in Reading NCE - by Grade']['Avg. Change in NCE G5']
                    g5 = typeof g5 === 'number' ? g5 : null;
                    let g6 = schoolDetails['Avg. Change in Reading NCE - by Grade']['Avg. Change in NCE G6']
                    g6 = typeof g6 === 'number' ? g6 : null;
                    let g7 = schoolDetails['Avg. Change in Reading NCE - by Grade']['Avg. Change in NCE G7']
                    g7 = typeof g7 === 'number' ? g7 : null;
                    let g8 = schoolDetails['Avg. Change in Reading NCE - by Grade']['Avg. Change in NCE G8']
                    g8 = typeof g8 === 'number' ? g8 : null;
                    if (results.length == 0) {
                        let sql = `INSERT INTO ReadingNceByGrade(schoolId, G3ChangeInNce, G4ChangeInNce, G5ChangeInNce, G6ChangeInNce, G7ChangeInNce, G8ChangeInNce, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${g3}, ${g4}, ${g5}, ${g6}, ${g7}, ${g8}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE ReadingNceByGrade SET G3ChangeInNce = ${g3}, G4ChangeInNce = ${g4}, G5ChangeInNce = ${g5}, G6ChangeInNce = ${g6}, G7ChangeInNce = ${g7}, G8ChangeInNce = ${g8}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, G3ChangeInNce, G4ChangeInNce, G5ChangeInNce, G6ChangeInNce, G7ChangeInNce, G8ChangeInNce, createdAt FROM ReadingNceByGrade WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get readingProficiencyByGrade
 */
async function readingProficiencyByGradePromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM ReadingProficiencyByGrade WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO ReadingProficiencyByGrade(schoolId, G2proficiencyPercent, G3proficiencyPercent, G4proficiencyPercent, G5proficiencyPercent, G6proficiencyPercent, G7proficiencyPercent, G8proficiencyPercent, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${schoolDetails['Reading Proficiency by Grade']['% Proficency G2']}, ${schoolDetails['Reading Proficiency by Grade']['% Proficency G3']}, ${schoolDetails['Reading Proficiency by Grade']['% Proficency G4']}, ${schoolDetails['Reading Proficiency by Grade']['% Proficency G5']}, ${schoolDetails['Reading Proficiency by Grade']['% Proficency G6']}, ${schoolDetails['Reading Proficiency by Grade']['% Proficency G7']}, ${schoolDetails['Reading Proficiency by Grade']['% Proficency G8']}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE ReadingProficiencyByGrade SET G2proficiencyPercent = ${schoolDetails['Reading Proficiency by Grade']['% Proficency G2']}, G3proficiencyPercent = ${schoolDetails['Reading Proficiency by Grade']['% Proficency G3']}, G4proficiencyPercent = ${schoolDetails['Reading Proficiency by Grade']['% Proficency G4']}, G5proficiencyPercent = ${schoolDetails['Reading Proficiency by Grade']['% Proficency G5']}, G6proficiencyPercent = ${schoolDetails['Reading Proficiency by Grade']['% Proficency G6']}, G7proficiencyPercent = ${schoolDetails['Reading Proficiency by Grade']['% Proficency G7']}, G8proficiencyPercent= ${schoolDetails['Reading Proficiency by Grade']['% Proficency G8']}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, G2proficiencyPercent, G3ProficiencyPercent, G4ProficiencyPercent, G5ProficiencyPercent, G6ProficiencyPercent, G7ProficiencyPercent, G8ProficiencyPercent, createdAt FROM ReadingProficiencyByGrade WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get schoolCapacityByGrade
 */
async function schoolCapacityByGradePromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM EnrollmentCapacity WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO EnrollmentCapacity(schoolId, prek3AvailableSections, prek4AvailableSections, kgAvailableSections, gradeOneAvailableSections, gradeTwoAvailableSections, gradeThreeAvailableSections, gradeFourAvailableSections, gradeFiveAvailableSections, gradeSixAvailableSections, gradeSevenAvailableSections, gradeEightAvailableSections, totalSections, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${schoolDetails['Enrollment Capacity']['PreK3 Available Sections']}, ${schoolDetails['Enrollment Capacity']['PreK4 Available Sections']}, ${schoolDetails['Enrollment Capacity']['KG Available Sections']}, ${schoolDetails['Enrollment Capacity']['Grade 1 Available Sections']}, ${schoolDetails['Enrollment Capacity']['Grade 2 Available Sections']}, ${schoolDetails['Enrollment Capacity']['Grade 3 Available Sections']}, ${schoolDetails['Enrollment Capacity']['Grade 4 Available Sections']}, ${schoolDetails['Enrollment Capacity']['Grade 5 Available Sections']}, ${schoolDetails['Enrollment Capacity']['Grade 6 Available Sections']}, ${schoolDetails['Enrollment Capacity']['Grade 7 Available Sections']}, ${schoolDetails['Enrollment Capacity']['Grade 8 Available Sections']}, ${schoolDetails['Enrollment Capacity']['Total Sections']}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE EnrollmentCapacity SET prek3AvailableSections = ${schoolDetails['Enrollment Capacity']['PreK3 Available Sections']}, prek4AvailableSections = ${schoolDetails['Enrollment Capacity']['PreK4 Available Sections']}, kgAvailableSections = ${schoolDetails['Enrollment Capacity']['KG Available Sections']}, gradeOneAvailableSections = ${schoolDetails['Enrollment Capacity']['Grade 1 Available Sections']}, gradeTwoAvailableSections = ${schoolDetails['Enrollment Capacity']['Grade 2 Available Sections']}, gradeThreeAvailableSections = ${schoolDetails['Enrollment Capacity']['Grade 3 Available Sections']}, gradeFourAvailableSections= ${schoolDetails['Enrollment Capacity']['Grade 4 Available Sections']}, gradeFiveAvailableSections = ${schoolDetails['Enrollment Capacity']['Grade 5 Available Sections']}, gradeSixAvailableSections = ${schoolDetails['Enrollment Capacity']['Grade 6 Available Sections']}, gradeSevenAvailableSections = ${schoolDetails['Enrollment Capacity']['Grade 7 Available Sections']}, gradeEightAvailableSections = ${schoolDetails['Enrollment Capacity']['Grade 8 Available Sections']}, totalSections = ${schoolDetails['Enrollment Capacity']['Total Sections']}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, prek3AvailableSections, prek4AvailableSections, kgAvailableSections, gradeOneAvailableSections, gradeTwoAvailableSections, gradeThreeAvailableSections, gradeFourAvailableSections, gradeFiveAvailableSections, gradeSixAvailableSections, gradeSevenAvailableSections, gradeEightAvailableSections, totalSections, createdAt FROM EnrollmentCapacity WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get academicPerformanceSummary
 */
async function academicPerformanceSummaryPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM AcademicPerformanceSummary WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO AcademicPerformanceSummary(schoolId, readingProficencyOverall, mathProficencyOverall, readingAvgChange, mathAvgChange, ELAGrowthPercent, MathGrowthPercent, ELAAvgOrBetter, MathAvgOrBetter, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails.readingProficencyOverall)}, ${schoolDetails.mathProficencyOverall}, ${schoolDetails.readingAvgChangeInNCE}, ${schoolDetails.mathAvgChangeInNCE}, ${schoolDetails.ELAGrowthPercent}, ${schoolDetails.MathGrowthPercent}, ${schoolDetails.ELAAvgOrBetter}, ${schoolDetails.MathAvgOrBetter}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE AcademicPerformanceSummary SET readingProficencyOverall = ${schoolDetails.readingProficencyOverall}, mathProficencyOverall = ${schoolDetails.mathProficencyOverall}, readingAvgChange = ${schoolDetails.readingAvgChangeInNCE}, mathAvgChange = ${schoolDetails.mathAvgChangeInNCE}, ELAGrowthPercent = ${schoolDetails.ELAGrowthPercent}, MathGrowthPercent = ${schoolDetails.MathGrowthPercent}, ELAAvgOrBetter = ${schoolDetails.ELAAvgOrBetter}, MathAvgOrBetter = ${schoolDetails.MathAvgOrBetter}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, readingProficencyOverall, mathProficencyOverall, readingAvgChange, mathAvgChange, ELAGrowthPercent, MathGrowthPercent, ELAAvgOrBetter, MathAvgOrBetter FROM AcademicPerformanceSummary WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

async function racialBreakdownPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM racialBreakdown WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO racialBreakdown(schoolId, catholic, americanIndian, asian, blackOrAfricanAmerican, nativeHawaiian, middleEastern, hispanic, white, twoOrMoreRaces, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${connection.escape(schoolDetails['Catholic']['% Catholic'])}, ${schoolDetails['Racial Breakdown']['% American Indian']}, ${schoolDetails['Racial Breakdown']['% Asian']}, ${schoolDetails['Racial Breakdown']['% Black/African American']}, ${schoolDetails['Racial Breakdown']['% Native Hawaiian']}, ${schoolDetails['Racial Breakdown']['% Middle Eastern']}, ${schoolDetails['Racial Breakdown']['% Hispanic']}, ${schoolDetails['Racial Breakdown']['% White']}, ${schoolDetails['Racial Breakdown']['% Two or More Races']}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE racialBreakdown SET catholic = ${connection.escape(schoolDetails['Catholic']['% Catholic'])}, americanIndian = ${schoolDetails['Racial Breakdown']['% American Indian']}, asian = ${schoolDetails['Racial Breakdown']['% Asian']}, blackOrAfricanAmerican = ${schoolDetails['Racial Breakdown']['% Black/African American']}, nativeHawaiian = ${schoolDetails['Racial Breakdown']['% Native Hawaiian']}, middleEastern = ${schoolDetails['Racial Breakdown']['% Middle Eastern']}, hispanic = ${schoolDetails['Racial Breakdown']['% Hispanic']}, white = ${schoolDetails['Racial Breakdown']['% White']}, twoOrMoreRaces = ${schoolDetails['Racial Breakdown']['% Two or More Races']},  updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM racialBreakdown WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}
async function ethnicityBreakdownPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM ethnicityBreakdown WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO ethnicityBreakdown(schoolId, hispanic, haitian, notHispanicNotHaitain, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${connection.escape(schoolDetails['Ethnicity Breakdown']['% Hispanic'])}, ${schoolDetails['Ethnicity Breakdown']['% Haitian']}, ${schoolDetails['Ethnicity Breakdown']['% Not Hispanic Not Haitain']},  ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE ethnicityBreakdown SET hispanic = ${connection.escape(schoolDetails['Ethnicity Breakdown']['% Hispanic'])}, haitian = ${schoolDetails['Ethnicity Breakdown']['% Haitian']}, notHispanicNotHaitain = ${schoolDetails['Ethnicity Breakdown']['% Not Hispanic Not Haitain']}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM ethnicityBreakdown WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}
async function learningmodicationsandsupportsPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM learningmodicationsandsupports WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO learningmodicationsandsupports(schoolId, title1, ell, accomodationPlan, ilp, fes_ua, ftc, fes_eo, vpk, schoolReadiness, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${connection.escape(schoolDetails['Learning Modications and Supports']['% Title 1'])}, ${schoolDetails['Learning Modications and Supports']['% ELL']}, ${schoolDetails['Learning Modications and Supports']['% Accomodation Plan']}, ${schoolDetails['Learning Modications and Supports']['% ILP']}, ${schoolDetails['Learning Modications and Supports']['% FES_UA']}, ${schoolDetails['Learning Modications and Supports']['% FTC']}, ${schoolDetails['Learning Modications and Supports']['% FES-EO']}, ${schoolDetails['Learning Modications and Supports']['% VPK']}, ${schoolDetails['Learning Modications and Supports']['% School Readiness']}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE learningmodicationsandsupports SET 
                        title1 = ${connection.escape(schoolDetails['Catholic']['% Title 1'])}, ell = ${schoolDetails['Learning Modications and Supports']['% ELL']}, accomodationPlan = ${schoolDetails['Learning Modications and Supports']['% Accomodation Plan']}, ilp = ${schoolDetails['Learning Modications and Supports']['% ILP']}, fes_ua = ${schoolDetails['Learning Modications and Supports']['% FES_UA']}, ftc = ${schoolDetails['Learning Modications and Supports']['% FTC']}, fes_eo = ${schoolDetails['Learning Modications and Supports']['% FES-EO']}, vpk = ${schoolDetails['Learning Modications and Supports']['% VPK']}, schoolReadiness = ${schoolDetails['Learning Modications and Supports']['% School Readiness']},  updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM learningmodicationsandsupports WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get studentdemographic information
 */
async function studentDemographicInfoPromise(schoolDetails, type) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM StudentDemographicInformation WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO StudentDemographicInformation(schoolId, studentsPovertyPercent, studentsPlanPercent, studentsScholarShipPercent, createdAt) VALUES (${schoolDetails.schoolId}, ${schoolDetails.studentsInPoverty}, ${schoolDetails.studentsOnPlan}, ${schoolDetails.studentsOnScholarship}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE StudentDemographicInformation SET studentsPovertyPercent = ${schoolDetails.studentsInPoverty}, studentsPlanPercent = ${schoolDetails.studentsOnPlan}, studentsScholarShipPercent = ${schoolDetails.studentsOnScholarship}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, studentsPovertyPercent, studentsPlanPercent, studentsScholarShipPercent FROM StudentDemographicInformation WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get ARKPerformanceSummary information
 */
async function ARKPerformanceSummaryPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM ARKPerformanceSummary WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO ARKPerformanceSummary(schoolId, ProficencyHigh, ProficencyModerate, ProficencyLow, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${schoolDetails.ARKHigh}, ${schoolDetails.ARKModerate}, ${schoolDetails.ARKLow}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE ARKPerformanceSummary SET ProficencyHigh = ${schoolDetails.ARKHigh}, ProficencyModerate = ${schoolDetails.ARKModerate}, ProficencyLow = ${schoolDetails.ARKLow}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, ProficencyHigh, ProficencyModerate, ProficencyLow FROM ARKPerformanceSummary WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To Insert & get EnrollmentSummary information
 */
async function enrollmentSummary(details, type) {
    return new Promise(async (resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM EnrollmentSummary WHERE schoolId = ${details.schoolId} AND year = ${details.year}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO EnrollmentSummary(schoolId, year, value, averageEnrollment, createdAt) VALUES (${connection.escape(details.schoolId)}, ${connection.escape(details.year)}, ${connection.escape(details.value)}, ${connection.escape(details.avgEnrollment)}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE EnrollmentSummary SET value = ${connection.escape(details.value)}, averageEnrollment = ${connection.escape(details.avgEnrollment)}, updatedAt = now() WHERE schoolId = ${results[0].schoolId} AND year = ${details.year}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        } else {
            let sql = `SELECT schoolId, year, value, averageEnrollment FROM EnrollmentSummary WHERE isDeleted = 0 ORDER BY year`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(revertEnrollmentSummary(result))
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get readingProficientPercent information
 */
async function readingProficientPercentPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId, proficientPercentLessThan50 FROM FlagReadingProfiency WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO FlagReadingProfiency(schoolId, proficientPercentLessThan50, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails['readingProficient<50'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE FlagReadingProfiency SET proficientPercentLessThan50 = ${connection.escape(schoolDetails['readingProficient<50'])}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, proficientPercentLessThan50 AS ReadingproficientPercentLessThan50 FROM FlagReadingProfiency WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get MathProficientPercent information
 */
async function mathProficientPercentPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM FlagMathProficiency WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO FlagMathProficiency(schoolId, proficientPercentLessThan50, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails['mathProficient<50'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE FlagMathProficiency SET proficientPercentLessThan50 = ${connection.escape(schoolDetails['mathProficient<50'])}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, proficientPercentLessThan50 AS MathproficientPercentLessThan50 FROM FlagMathProficiency WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get nceReadingFlag information
 */
async function nceReadingFlagPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId, negativeChangeInNce FROM NceReadingFlag WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO NceReadingFlag(schoolId, negativeChangeInNce, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails.negativeChangeInReadingNCE)}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE NceReadingFlag SET negativeChangeInNce = ${connection.escape(schoolDetails.negativeChangeInReadingNCE)}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, negativeChangeInNce AS ReadingnegativeChangeInNce FROM NceReadingFlag WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get nceMathFlag information
 */
async function nceMathFlagPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM NceMathFlag WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO NceMathFlag(schoolId, negativeChangeInNce, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails.NegativeChangeInMathNCE)}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE NceMathFlag SET negativeChangeInNce = ${connection.escape(schoolDetails.NegativeChangeInMathNCE)}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, negativeChangeInNce AS MathnegativeChangeInNce FROM NceMathFlag WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get ARKProficiencyFlag information
 */
async function ARKProficiencyFlagPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM ARKProficiencyFlag WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO ARKProficiencyFlag(schoolId, greaterThan50PercentScored, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails.studentsScoreLowOnARK)}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE ARKProficiencyFlag SET greaterThan50PercentScored = ${connection.escape(schoolDetails.studentsScoreLowOnARK)}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, greaterThan50PercentScored FROM ARKProficiencyFlag WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get enrollmentFlag information
 */
async function enrollmentFlagPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM EnrollmentFlag WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO EnrollmentFlag(schoolId, enrollmentLessThan240, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails['Enrollment<240'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE EnrollmentFlag SET enrollmentLessThan240 = ${connection.escape(schoolDetails['Enrollment<240'])}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, enrollmentLessThan240 FROM EnrollmentFlag WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get ARKProficiencyFlag information
 */
async function k2EnrollmentFlagPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM K2EnrollmentFlag WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO K2EnrollmentFlag(schoolId, averageEnrollment, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails['AvgEnrollment<20'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE K2EnrollmentFlag SET averageEnrollment = ${connection.escape(schoolDetails['AvgEnrollment<20'])}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, averageEnrollment FROM K2EnrollmentFlag WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get ARKProficiencyFlag information
 */
async function enrollmentCapacityFlagPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM EnrollmentCapacityFlag WHERE schoolId = ${schoolDetails.schoolId} AND isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO EnrollmentCapacityFlag(schoolId, capacitypercent, schoolUnderCapacity, academicYearId, createdAt) VALUES (${schoolDetails.schoolId}, ${connection.escape(schoolDetails.percentOfCapacity)}, ${connection.escape(schoolDetails.schoolIsUnderCapacity)}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE EnrollmentCapacityFlag SET capacitypercent = ${connection.escape(schoolDetails.percentOfCapacity)}, schoolUnderCapacity = ${connection.escape(schoolDetails.schoolIsUnderCapacity)}, updatedAt = now() WHERE schoolId = ${schoolDetails.schoolId} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, capacitypercent, schoolUnderCapacity FROM EnrollmentCapacityFlag WHERE isDeleted = 0 AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get ARKProficiencyFlag information
 */
async function ARKProficiencyByGradePromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM ARKProficiencyByGrade WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO ARKProficiencyByGrade(schoolId, Grade2High, Grade2Med, Grade2Low, Grade3High, Grade3Med, Grade3Low, Grade4High, Grade4Med, Grade4Low, Grade5High, Grade5Med, Grade5Low, Grade6High, Grade6Med, Grade6Low, Grade7High, Grade7Med, Grade7Low, Grade8High, Grade8Med, Grade8Low, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 2 High']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 2 Med']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 2 Low']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 3 High']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 3 Med']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 3 Low']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 4 High']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 4 Med']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 4 Low']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 5 High']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 5 Med']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 5 Low']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 6 High']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 6 Med']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 6 Low']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 7 High']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 7 Med']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 7 Low']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 8 High']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 8 Med']}, ${schoolDetails['ARK Proficiency by Grade']['Grade 8 Low']}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE ARKProficiencyByGrade SET Grade2High = ${schoolDetails['ARK Proficiency by Grade']['Grade 2 High']}, Grade2Med = ${schoolDetails['ARK Proficiency by Grade']['Grade 2 Med']}, Grade2Low = ${schoolDetails['ARK Proficiency by Grade']['Grade 2 Low']}, Grade3High = ${schoolDetails['ARK Proficiency by Grade']['Grade 3 High']}, Grade3Med = ${schoolDetails['ARK Proficiency by Grade']['Grade 3 Med']}, Grade3Low = ${schoolDetails['ARK Proficiency by Grade']['Grade 3 Low']}, Grade4High = ${schoolDetails['ARK Proficiency by Grade']['Grade 4 High']}, Grade4Med = ${schoolDetails['ARK Proficiency by Grade']['Grade 4 Med']}, Grade4Low = ${schoolDetails['ARK Proficiency by Grade']['Grade 4 Low']}, Grade5High = ${schoolDetails['ARK Proficiency by Grade']['Grade 5 High']}, Grade5Med = ${schoolDetails['ARK Proficiency by Grade']['Grade 5 Med']}, Grade5Low = ${schoolDetails['ARK Proficiency by Grade']['Grade 5 Low']}, Grade6High = ${schoolDetails['ARK Proficiency by Grade']['Grade 6 High']}, Grade6Med = ${schoolDetails['ARK Proficiency by Grade']['Grade 6 Med']}, Grade6Low = ${schoolDetails['ARK Proficiency by Grade']['Grade 6 Low']}, Grade7High = ${schoolDetails['ARK Proficiency by Grade']['Grade 7 High']}, Grade7Med = ${schoolDetails['ARK Proficiency by Grade']['Grade 7 Med']}, Grade7Low = ${schoolDetails['ARK Proficiency by Grade']['Grade 7 Low']}, Grade8High = ${schoolDetails['ARK Proficiency by Grade']['Grade 8 High']}, Grade8Med = ${schoolDetails['ARK Proficiency by Grade']['Grade 8 Med']}, Grade8Low =  ${schoolDetails['ARK Proficiency by Grade']['Grade 8 Low']}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM ARKProficiencyByGrade WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get blueRibbonReading information
 */
async function blueRibbonReadingPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM BlueRibbonReading WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO BlueRibbonReading (schoolId, grade3, grade4, grade5, grade6, grade7, grade8, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 3'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 4'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 5'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 6'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 7'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 8'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE BlueRibbonReading SET grade3 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 3'])}, grade4 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 4'])}, grade5 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 5'])}, grade6 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 6'])}, grade7 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 7'])}, grade8 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 8'])}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM BlueRibbonReading WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get blueRibbonMath information
 */
async function blueRibbonMathPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM BlueRibbonMath WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO BlueRibbonMath (schoolId, grade3, grade4, grade5, grade6, grade7, grade8, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 3'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 4'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 5'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 6'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 7'])},  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 8'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE BlueRibbonMath SET grade3 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 3'])}, grade4 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 4'])}, grade5 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 5'])}, grade6 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 6'])}, grade7 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 7'])}, grade8 =  ${connection.escape(schoolDetails['Blue Ribbon - Reading']['Grade 8'])}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM BlueRibbonMath WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get blueRibbonFlag information
 */
async function blueRibbonFlagPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM BrFlag WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO BrFlag (schoolId, meetsBlueRibbonCriteria, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${connection.escape(schoolDetails['BR Flag']['School Meets Blue Ribbon Criteria'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE BrFlag SET meetsBlueRibbonCriteria = ${connection.escape(schoolDetails['BR Flag']['School Meets Blue Ribbon Criteria'])}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM BrFlag WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get gradeLevelpercent information
 */
async function gradeLevelpercentPromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM BrGradeLevelPercent WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO BrGradeLevelPercent (schoolId, value, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${connection.escape(schoolDetails['Percent of Grade Levels Meeting BR Criteria'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE BrGradeLevelPercent SET value = ${connection.escape(schoolDetails['Percent of Grade Levels Meeting BR Criteria'])}, updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM BrGradeLevelPercent WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To insert & get enrollmentByGrade information
 */
async function enrollmentByGradePromise(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT id, schoolId FROM EnrollmentByGrade WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO EnrollmentByGrade (schoolId, Elpk2, Elpk3, Elpk4, Elkind, El1, El2, El3, El4, El5, El6, El7, El8, academicYearId, createdAt) VALUES (${schoolDetails['School ID']}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-PK2'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-PK3'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-PK4'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-Kind'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-1'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-2'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-3'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-4'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-5'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-6'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-7'])}, ${connection.escape(schoolDetails['Enrollment by Grade']['EL-8'])}, ${academicYearId}, now())`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE EnrollmentByGrade SET Elpk2 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-PK2'])}, Elpk3 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-PK3'])}, Elpk4 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-PK4'])}, Elkind = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-Kind'])}, El1 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-1'])}, El2 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-2'])}, El3 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-3'])}, El4 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-4'])}, El5 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-5'])}, El6 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-6'])}, El7 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-7'])}, El8 = ${connection.escape(schoolDetails['Enrollment by Grade']['EL-8'])},  updatedAt = now() WHERE schoolId = ${schoolDetails['School ID']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT * FROM EnrollmentByGrade WHERE isDeleted = 0`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

/**
 * @author Gopi
 * @uses To get data of every schools
 */
router.get('/getAllSchoolsData', async function (req, res) {
    try {
        const academicYearId = req.query.academicYearId;
        const Schools = await schoolsDataInsertion(req, 'get')
        const academicPerformanceSummary = await academicPerformanceSummaryPromise(req, 'get', academicYearId);
        // const studentDemographicInfo = await studentDemographicInfoPromise(req, 'get', academicYearId);
        const ARKPerformanceSummary = await ARKPerformanceSummaryPromise(req, 'get', academicYearId);
        const readingProficientPercent = await readingProficientPercentPromise(req, 'get', academicYearId);
        const mathProficientPercent = await mathProficientPercentPromise(req, 'get', academicYearId);
        const nceReadingFlag = await nceReadingFlagPromise(req, 'get', academicYearId);
        const nceMathFlag = await nceMathFlagPromise(req, 'get', academicYearId);
        const ARKProficiencyFlag = await ARKProficiencyFlagPromise(req, 'get', academicYearId);
        const enrollmentFlag = await enrollmentFlagPromise(req, 'get', academicYearId)
        const k2EnrollmentFlag = await k2EnrollmentFlagPromise(req, 'get', academicYearId)
        const enrollmentCapacityFlag = await enrollmentCapacityFlagPromise(req, 'get', academicYearId)
        const EnrollmentSummary = await enrollmentSummary(req, 'get');
        const ARKProficiencyByGrade = await ARKProficiencyByGradePromise(req, 'get', academicYearId);
        const blueRibbonReading = await blueRibbonReadingPromise(req, 'get', academicYearId);
        const blueRibbonMath = await blueRibbonMathPromise(req, 'get', academicYearId);
        const blueRibbonFlag = await blueRibbonFlagPromise(req, 'get', academicYearId);
        const gradeLevelpercent = await gradeLevelpercentPromise(req, 'get', academicYearId);
        const enrollmentByGrade = await enrollmentByGradePromise(req, 'get', academicYearId);
        const averageChangeInMath = await averageChangeInMathNce(req, 'get', academicYearId);
        const mathProficiencyByGrade = await mathProficiencyByGradePromise(req, 'get', academicYearId);
        const readingNceByGrade = await readingNceByGradePromise(req, 'get', academicYearId);
        const readingProficiencyByGrade = await readingProficiencyByGradePromise(req, 'get', academicYearId);
        const schoolCapacityByGrade = await schoolCapacityByGradePromise(req, 'get', academicYearId);
        const schoolIds = Schools.map(school => {
            return { "schoolId": school.schoolId };
        });
        const response = {
            'Schools': Schools,
            'School ID': schoolIds,
            'Academic Performance Summary': academicPerformanceSummary,
            'Student Demographic Information': studentDemographicInfo,
            'ARK Performance Summary': ARKPerformanceSummary,
            'Enrollment Summary': EnrollmentSummary,
            'Flag Reading Overall Proficency': readingProficientPercent,
            'Flag Math Overall Proficency': mathProficientPercent,
            'NCE Reading Flag': nceReadingFlag,
            'NCE Math Flag': nceMathFlag,
            'ARK Proficiency Flag': ARKProficiencyFlag,
            'Enrollment Flag': enrollmentFlag,
            'K-2 Enrollment Flag': k2EnrollmentFlag,
            'Enrollment Capacity Flag': enrollmentCapacityFlag,
            
            
            // 'ARKProficiencyByGrade': ARKProficiencyByGrade,
            // 'blueRibbonReading': blueRibbonReading,
            // 'blueRibbonMath': blueRibbonMath,
            // 'blueRibbonFlag': blueRibbonFlag,
            // 'gradeLevelpercent': gradeLevelpercent,
            // 'enrollmentByGrade': enrollmentByGrade,
            // 'averageChangeInMath': averageChangeInMath,
            // 'mathProficiencyByGrade': mathProficiencyByGrade,
            // 'readingNceByGrade': readingNceByGrade,
            // 'readingProficiencyByGrade': readingProficiencyByGrade,
            // 'schoolCapacityByGrade': schoolCapacityByGrade
        }
        res.json({
            statusCode: 200,
            message: "Data Fetched Successfully",
            data: response,
            error: ''
        });
    } catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: []
        }
        res.send(response)
    }
})

/**
 * @author Manjunath
 * @uses To get all users
 */
router.get('/getAllUsers', async function (req, res) {
    try {
        let sql = `SELECT email, firstName, lastName, alternateEmail, roleId, schoolId FROM Users`
        connection.query(sql, (error, result) => {
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
                    data: result
                })
            }
        })
    } catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: []
        }
        res.send(response)
    }
})

/**
  * @author Gopi
  * @uses to format enrollment summary to its original state
  */
function revertEnrollmentSummary(enrollmentSummary) {
    const formattedData = [];
    enrollmentSummary.forEach((obj) => {
        const yearKey = `FY${obj.year}`;
        const schoolObj = formattedData.find((item) => item['schoolId'] === obj.schoolId);

        if (!schoolObj) {
            const newSchoolObj = { 'schoolId': obj.schoolId };
            newSchoolObj[yearKey] = obj.value !== null ? obj.value.toString() : 'N/A';
            if (obj.hasOwnProperty('averageEnrollment')) {
                newSchoolObj['K-2 Total Enrollment'] = obj.averageEnrollment !== null ? obj.averageEnrollment.toString() : 'N/A';
            }
            formattedData.push(newSchoolObj);
        } else {
            schoolObj[yearKey] = obj.value !== null ? obj.value.toString() : 'N/A';
            if (obj.hasOwnProperty('averageEnrollment')) {
                schoolObj['K-2 Total Enrollment'] = obj.averageEnrollment !== null ? obj.averageEnrollment.toString() : 'N/A';
            }
        }
    });
    return formattedData;
}

async function annualDataTarget(schoolDetails, type, academicYearId) {
    return new Promise((resolve, reject) => {
        if (type == 'post') {
            let sql = `SELECT * FROM AnnualDataTarget WHERE schoolId = ${schoolDetails['schoolId']} AND academicYearId = ${academicYearId}`
            connection.query(sql, (error, results) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (results.length == 0) {
                        let sql = `INSERT INTO AnnualDataTarget (schoolId, defaultADT, academicYearId) VALUES (${schoolDetails['schoolId']}, '${schoolDetails['defaultADT']}', ${academicYearId})`
                        connection.query(sql, (error, insertRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(insertRes)
                            }
                        })
                    }
                    else {
                        let sql = `UPDATE AnnualDataTarget SET defaultADT = ${connection.escape(schoolDetails['defaultADT'])} WHERE schoolId = ${schoolDetails['schoolId']} AND academicYearId = ${academicYearId}`
                        connection.query(sql, (error, updateRes) => {
                            if (error) {
                                reject(error)
                            }
                            else {
                                resolve(updateRes)
                            }
                        })
                    }
                }
            })
        }
        else {
            let sql = `SELECT schoolId, defaultADT FROM AnnualDataTarget`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        }
    })
}

router.post('/createAcademicYear', async function (req, res) {
    try {
        const acdemicYear = req.body.acdemicYear;
        let sql = `INSERT INTO academicYears (year) VALUES ('${acdemicYear}')`
        connection.query(sql, (error, insertRes) => {
            if (error) {
                res.status(500).json(error)
            }
            else {
                res.status(200).json(insertRes)
            }
        })
    } catch (error) {
        res.status(500).json(error)
    }
})

module.exports = router;