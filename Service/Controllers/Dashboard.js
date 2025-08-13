var xlsx = require('xlsx');
var express = require('express');
var connection = require('../config');
var router = express.Router();
var workbook = undefined

router.post('/loadWorkbookOld', function (req, res) {
    try {
        (async () => {
            workbook = await xlsx.readFile('./assets/CSIP Data.xlsx');
            const workSheet = xlsx.utils.sheet_to_json(workbook.Sheets['All Data']);
            const schoolIndex = workSheet.findIndex(school => school['School ID'] == req.body.schoolId)
            if (schoolIndex != -1) {
                const school = workSheet[schoolIndex];
                const performance = {
                    "reading": school['Academic Performance'] != undefined ? (Number(school['Academic Performance']) * 100).toFixed(2) : 0,
                    "math": school['__EMPTY'] != undefined ? (Number(school['__EMPTY']) * 100).toFixed(2) : 0
                }
                const essentials = {
                    "overallPerformance": school['5Essentials Performance Summary'],
                    "effectiveLeaders": school['__EMPTY_1'],
                    "collaborativeTeachers": school['__EMPTY_2'],
                    "involvedFamilies": school['__EMPTY_3'],
                    "supportiveEnvironment": school['__EMPTY_4'],
                    "ambitiousInstruction": school['__EMPTY_5']
                }
                const catholic = {
                    "stronglyAgree": school['Catholic Identity Summary - I believe that God is present in my life.'] != undefined ? (Number(school['Catholic Identity Summary - I believe that God is present in my life.']) * 100).toFixed(2) : 0,
                    "agree": school['__EMPTY_6'] != undefined ? (Number(school['__EMPTY_6']) * 100).toFixed(2) : 0,
                    "disagree": school['__EMPTY_7'] != undefined ? (Number(school['__EMPTY_7']) * 100).toFixed(2) : 0,
                    "stronglyDisagree": school['__EMPTY_8'] != undefined ? (Number(school['__EMPTY_8']) * 100).toFixed(2) : 0,
                }
                const enrollment = {
                    "2013": school['Enrollment Summary'],
                    "2014": school['__EMPTY_9'],
                    "2015": school['__EMPTY_10'],
                    "2016": school['__EMPTY_11'],
                    "2017": school['__EMPTY_12'],
                    "2018": school['__EMPTY_13'],
                    "2019": school['__EMPTY_14'],
                    "2020": school['__EMPTY_15'],
                    "2021": school['__EMPTY_16'],
                    "2022": school['__EMPTY_17'],
                    "2023": school['__EMPTY_18']
                }
                const avgEnrollment = school['__EMPTY_19'];
                const academicFlags = {
                    "I-Ready Reading % Meeting Typical Annual Growth Below 75%": school['i-Ready Growth'],
                    "I-Ready Math % Meeting Typical Annual Growth Below 75%": school['__EMPTY_20'],
                }
                const essentialsFlags = {
                    "5-Essentials Overall Rating = Weak or Very Weak": school['5Essentials Flags'],
                    "Low Response Rate Concern": school['__EMPTY_21'],
                    "<  3 out of 5 Essentials categorized as Strong": school['__EMPTY_22']
                }
                const catholicIdentity = {
                    '< 75% of students “Strongly Agree” that “God is present in their life”': school['Catholic Identity']
                }
                const enrollmentOperationsFlag = {
                    "Enrollment Drop from FY21-22 >5%": school['Enrollment & Operations Flags'],
                    "FY22 Enrollment <240": school['__EMPTY_23'],
                    "FY22 Avg K-2 Enrollment <20": school['__EMPTY_24']
                }
                const blueRibbon = {
                    "Spring": school['Blue Ribbon Calculator'],
                    "Fall": school['__EMPTY_25']
                }
                const response = {
                    "performance": performance,
                    "essentials": essentials,
                    "catholic": catholic,
                    "enrollment": enrollment,
                    "avgEnrollment": avgEnrollment,
                    "academicFlags": academicFlags,
                    "essentialsFlags": essentialsFlags,
                    "catholicIdentity": catholicIdentity,
                    "enrollmentOperationsFlag": enrollmentOperationsFlag,
                    "CIScorecards": school['CI Scorecards'],
                    "blueRibbon": blueRibbon
                }
                res.json({
                    "statusCode": 200,
                    "message": "success",
                    "error": "",
                    "data": response
                })
            } else {
                res.json({
                    "statusCode": 200,
                    "message": "success",
                    "error": "",
                    "data": {}
                })
            }

        })();
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
 * @author Manjunath
 * @uses To get School data on schoolId
 */
router.post('/loadWorkbook', async function (req, res) {
    try {
        let sql = `SELECT * FROM Schools WHERE schoolId = ${req.body.schoolId} AND isActive = 1`
        connection.query(sql, async function (error, result) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Something Went Wrong',
                    error: error,
                    data: []
                })
            } else {
                if (result.length == 0) {
                    res.json({
                        statusCode: 400,
                        message: 'School Doesn\'t exists',
                        error: 'School Doesn\'t exists',
                        data: []
                    })
                } else {
                    const AcademicPerformance = await SchoolAcademicPerformance(req);
                    const EssentialsSummary = await EssentialsPerformanceSummary(req);
                    const catholic = await ARKPerformanceSummary(req);
                    const academicFlags = await ReadyGrowth(req);
                    const essentialsFlags = await EssentialsFlags(req);
                    const CatholicIdentity = await catholicIdentity(req);
                    const enrollmentOperationsFlag = await EnrollmentOperationFlags(req);
                    // const CISScoreCard = await cisScoreCard(req);
                    const enrollment = await enrollmentSummary(req);
                    const BlueRibbon = await blueRibbon(req);
                    const response = {
                        'performance': AcademicPerformance,
                        "essentials": EssentialsSummary,
                        "catholic": catholic,
                        "enrollment": enrollment['enrollment'],
                        "avgEnrollment": enrollment['avgEnv'],
                        "academicFlags": academicFlags,
                        "essentialsFlags": essentialsFlags,
                        "catholicIdentity": CatholicIdentity,
                        "enrollmentOperationsFlag": enrollmentOperationsFlag,
                        // "CIScorecards": CISScoreCard,
                        "blueRibbon": BlueRibbon
                    }
                    res.json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": response
                    })
                }
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: []
        })
    }
})

/**
 * @author Manjunath
 * @uses To get SchoolAcademicPerformance data
 */
async function SchoolAcademicPerformance(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        const acdemicYearId = schoolDetails.body.acdemicYearId;
        let sql = `SELECT * FROM AcademicPerformanceSummary WHERE schoolId = ${schoolDetails.body.schoolId} AND isDeleted = 0 AND academicYearId = ${acdemicYearId}`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let performance
                try {
                    performance = {
                        "reading": result[0]['readingProficencyOverall'],
                        "math": result[0]['mathProficencyOverall'],
                        "ELAAvgOrBetter": result[0]['ELAAvgOrBetter'],
                        "MathAvgOrBetter": result[0]['MathAvgOrBetter'],
                        "ELAGrowthPercent": result[0]['ELAGrowthPercent'],
                        "MathGrowthPercent" : result[0]['MathGrowthPercent'],
                        "readingAvgChange" : result[0]['readingAvgChange'],
                        "mathAvgChange" : result[0]['mathAvgChange'],
                    }
                } catch {
                    performance = {
                        "reading": 0,
                        "math": 0,
                        "ELAAvgOrBetter": 0,
                        "MathAvgOrBetter": 0,
                    }
                }
                resolve(performance)
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get EssentialsPerformanceSummary data
 */
async function EssentialsPerformanceSummary(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        let sql = `SELECT overAllPerformance, effectiveLeaders, collaborativeTeachers, involvedFamilies, supportiveEnvironment, ambitiousInstruction FROM EssentialsPerformanceSummary WHERE schoolId = ${schoolDetails.body.schoolId} AND isDeleted = 0`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                if (result.length > 0) {
                    let essentials
                    try {
                        essentials = {
                            "overallPerformance": result[0]['overAllPerformance'],
                            "effectiveLeaders": result[0]['effectiveLeaders'],
                            "collaborativeTeachers": result[0]['collaborativeTeachers'],
                            "involvedFamilies": result[0]['involvedFamilies'],
                            "supportiveEnvironment": result[0]['supportiveEnvironment'],
                            "ambitiousInstruction": result[0]['ambitiousInstruction']
                        }
                    } catch {
                        essentials = {
                            "overallPerformance": null,
                            "effectiveLeaders": null,
                            "collaborativeTeachers": null,
                            "involvedFamilies": null,
                            "supportiveEnvironment": null,
                            "ambitiousInstruction": null
                        }
                    }
                    resolve(essentials)
                } else {
                    const essentials = {
                        "overallPerformance": null,
                        "effectiveLeaders": null,
                        "collaborativeTeachers": null,
                        "involvedFamilies": null,
                        "supportiveEnvironment": null,
                        "ambitiousInstruction": null
                    }
                    resolve(essentials)
                }
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get catholicIdentitySummary data
 */
async function catholicIdentitySummary(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        let sql = `SELECT stronglyAgree, agree, disagree, stronglyDisagree FROM CatholicIdentitySummary WHERE schoolId = ${schoolDetails.body.schoolId}`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let catholic
                try {
                    catholic = {
                        "stronglyAgree": result[0]['stronglyAgree'],
                        "agree": result[0]['agree'],
                        "disagree": result[0]['disagree'],
                        "stronglyDisagree": result[0]['stronglyDisagree']
                    }
                } catch {
                    catholic = {
                        "stronglyAgree": 0,
                        "agree": 0,
                        "disagree": 0,
                        "stronglyDisagree": 0
                    }
                }
                resolve(catholic)
            }
        })
    })
}
/**
 * @author Manjunath
 * @uses To get i-ReadyGrowth data
 */
async function ReadyGrowth(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        const acdemicYearId = schoolDetails.body.acdemicYearId;
        let sql = `SELECT 
        NRF.negativeChangeInNce AS readingNCE, NMF.negativeChangeInNce AS mathNCE, RPF.proficientPercentLessThan50 AS reading, MPF.proficientPercentLessThan50 AS math
        FROM NceReadingFlag AS NRF
        JOIN NceMathFlag AS NMF ON NMF.schoolId = NRF.schoolId
        JOIN FlagReadingProfiency AS RPF ON RPF.schoolId = NRF.schoolId
        JOIN FlagMathProficiency AS MPF ON MPF.schoolId = NRF.schoolId
        WHERE NRF.schoolId = ${schoolDetails.body.schoolId} AND NRF.academicYearId = ${acdemicYearId} AND NMF.academicYearId = ${acdemicYearId} AND RPF.academicYearId = ${acdemicYearId} AND MPF.academicYearId = ${acdemicYearId}`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let academicFlags;
                try {
                    academicFlags = {
                        "Reading Percent Proficient is <50%": result[0]['reading'],
                        "Math Percent Proficient is <50%": result[0]['math'],
                        "Negative Change in Reading NCE": result[0]['readingNCE'],
                        "Negative Change in Math NCE": result[0]['mathNCE'],
                    }
                } catch {
                    academicFlags = {
                        "Reading Percent Proficient is <50%": 'N',
                        "Math Percent Proficient is <50%": 'N',
                        "Negative Change in Reading NCE": 'N',
                        "Negative Change in Math NCE": 'N'
                    }
                }
                resolve(academicFlags)
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get EssentialsFlags data
 */
async function EssentialsFlags(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        let sql = `SELECT essentialsWeakOrVeryWeakRating, essentialsLowResponseConcern, lessThan3OutOf5EssentialsCategorizedAsStrong FROM EssentialsFlags WHERE schoolId = ${schoolDetails.body.schoolId} AND isDeleted=0`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let essentialsFlags;
                try {
                    essentialsFlags = {
                        "5-Essentials Overall Rating = Weak or Very Weak": result[0]['essentialsWeakOrVeryWeakRating'],
                        "Low Response Rate Concern": result[0]['essentialsLowResponseConcern'],
                        "<  3 out of 5 Essentials categorized as Strong": result[0]['lessThan3OutOf5EssentialsCategorizedAsStrong']
                    }
                } catch {
                    essentialsFlags = {
                        "5-Essentials Overall Rating = Weak or Very Weak": 'N',
                        "Low Response Rate Concern": 'N',
                        "<  3 out of 5 Essentials categorized as Strong": 'N'
                    }
                }
                resolve(essentialsFlags)
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get CatholicIdentity data
 */
async function catholicIdentity(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        const acdemicYearId = schoolDetails.body.acdemicYearId;
        let sql = `SELECT greaterThan50PercentScored FROM ARKProficiencyFlag WHERE schoolId = ${schoolDetails.body.schoolId} AND isDeleted=0 AND academicYearId = ${acdemicYearId}`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let catholicIdentity;
                try {
                    catholicIdentity = {
                        '>50% of students scored "Low" on ARK': result[0]['greaterThan50PercentScored']
                    }
                } catch {
                    catholicIdentity = {
                        '>50% of students scored "Low" on ARK': 'N'
                    }
                }
                resolve(catholicIdentity)
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get EnrollmentOperationFlags data
 */
async function EnrollmentOperationFlags(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        const acdemicYearId = schoolDetails.body.acdemicYearId;
        let sql = `SELECT 
        EF.enrollmentLessThan240, KEF.averageEnrollment
        FROM EnrollmentFlag AS EF
        JOIN K2EnrollmentFlag AS KEF ON KEF.schoolId = EF.schoolId
        WHERE EF.schoolId = ${schoolDetails.body.schoolId} AND EF.academicYearId = ${acdemicYearId} AND KEF.academicYearId = ${acdemicYearId}`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let enrollmentOperationsFlag
                try {
                    enrollmentOperationsFlag = {
                        "Enrollment is <240": result[0]['enrollmentLessThan240'],
                        "Avg. enrollment is <20": result[0]['averageEnrollment']
                    }
                } catch {
                    enrollmentOperationsFlag = {
                        "Enrollment is <240": 'N',
                        "Avg. enrollment is <20": 'N'
                    }
                }
                resolve(enrollmentOperationsFlag)
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get CISScoreCard data
 */
async function cisScoreCard(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        let sql = `SELECT ciScorecardLink FROM CIScoreCards WHERE schoolId = ${schoolDetails.body.schoolId} AND isDeleted=0`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                if (result.length > 0) {
                    resolve(result[0]['ciScorecardLink'])
                } else {
                    resolve(null)
                }
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get enrollmentSummary data
 */
async function enrollmentSummary(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        let sql = `SELECT year, value, averageEnrollment FROM EnrollmentSummary WHERE schoolId = ${schoolDetails.body.schoolId} AND isDeleted=0 ORDER BY year`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let response;
                try {
                    const ENR = result.reduce((acc, item) => {
                        acc[item.year] = item.value;
                        return acc;
                    }, {})
                    response = {
                        'enrollment': ENR,
                        'avgEnv': result[0]['averageEnrollment']
                    }
                } catch {
                    response = {
                        'enrollment': {},
                        'avgEnv': null
                    }
                }
                resolve(response)
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get BlueRibbonCalculator data
 */
async function blueRibbon(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        const acdemicYearId = schoolDetails.body.acdemicYearId;
        let sql = `SELECT year, BRCSpring, BRCFall FROM BlueRibbonCalculator WHERE schoolId = ${schoolDetails.body.schoolId} AND isDeleted = 0 AND academicYearId = ${acdemicYearId}`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let blueRibbon;
                try {
                    blueRibbon = {
                        "year": result[0]['year'],
                        "Spring": result[0]['BRCSpring'],
                        "Fall": result[0]['BRCFall']
                    }
                } catch {
                    blueRibbon = {
                        "year": null,
                        "Spring": null,
                        "Fall": null
                    }
                }
                resolve(blueRibbon)
            }
        })
    })
}

/**
 * @author Manjunath
 * @uses To get ARKPerformanceSummary data
 */
async function ARKPerformanceSummary(schoolDetails) {
    return new Promise(async (resolve, reject) => {
        const acdemicYearId = schoolDetails.body.acdemicYearId;
        let sql = `SELECT ProficencyHigh,  ProficencyModerate, ProficencyLow FROM ARKPerformanceSummary WHERE schoolId = ${schoolDetails.body.schoolId} AND academicYearId = ${acdemicYearId}`
        connection.query(sql, (error, result) => {
            if (error) {
                reject(error)
            } else {
                let catholic
                try {
                    catholic = {
                        "high": result[0]['ProficencyHigh'],
                        "moderate": result[0]['ProficencyModerate'],
                        "low": result[0]['ProficencyLow'],
                    }
                } catch {
                    catholic = {
                        "high": 0,
                        "moderate": 0,
                        "low": 0,
                    }
                }
                resolve(catholic)
            }
        })
    })
}


/**
 * @author Manjunath
 * @uses to get proficiency by grade.
 */
router.post('/getProficiencyByGrade', async function (req, res) {
    try {
        const academicYearId = req.body.academicYearId;
        let sql = `SELECT RPBG.schoolId,
        RPBG.G2proficiencyPercent AS G2Read, 
        RPBG.G3proficiencyPercent AS G3Read,
        RPBG.G4proficiencyPercent AS G4Read,
        RPBG.G5proficiencyPercent AS G5Read,
        RPBG.G6proficiencyPercent AS G6Read,
        RPBG.G7proficiencyPercent AS G7Read,
        RPBG.G8proficiencyPercent AS G8Read,
        MPBG.G2proficiencyPercent AS G2Math,
        MPBG.G3proficiencyPercent AS G3Math,
        MPBG.G4proficiencyPercent AS G4Math,
        MPBG.G5proficiencyPercent AS G5Math,
        MPBG.G6proficiencyPercent AS G6Math,
        MPBG.G7proficiencyPercent AS G7Math,
        MPBG.G8proficiencyPercent AS G8Math
        FROM ReadingProficiencyByGrade AS RPBG
        JOIN MathProficiencyByGrade AS MPBG ON MPBG.schoolId = RPBG.schoolId
        WHERE RPBG.schoolId = ${req.body.schoolId} AND RPBG.academicYearId = ${academicYearId} AND MPBG.academicYearId = ${academicYearId}`
        connection.query(sql, async function (error, result) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Something Went Wrong',
                    error: error,
                    data: []
                })
            } else {
                if (result.length == 0) {
                    res.json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": result
                    })
                } else {
                    res.json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": result
                    })
                }
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: []
        })
    }
})

/**
 * @author Manjunath
 * @uses to get Chnage in NCE by grade.
 */
router.post('/getChangeInNCEByGrade', async function (req, res) {
    try {
        const academicYearId = req.body.academicYearId;
        let sql = `SELECT RPBG.schoolId,
        RPBG.G3ChangeInNce AS G3Read,
        RPBG.G4ChangeInNce AS G4Read,
        RPBG.G5ChangeInNce AS G5Read,
        RPBG.G6ChangeInNce AS G6Read,
        RPBG.G7ChangeInNce AS G7Read,
        RPBG.G8ChangeInNce AS G8Read,
        MPBG.G3ChangeInNce AS G3Math,
        MPBG.G4ChangeInNce AS G4Math,
        MPBG.G5ChangeInNce AS G5Math,
        MPBG.G6ChangeInNce AS G6Math,
        MPBG.G7ChangeInNce AS G7Math,
        MPBG.G8ChangeInNce AS G8Math
        FROM ReadingNceByGrade AS RPBG
        JOIN MathNceByGrade AS MPBG ON MPBG.schoolId = RPBG.schoolId
        WHERE RPBG.schoolId = ${req.body.schoolId} AND RPBG.academicYearId = ${academicYearId} AND MPBG.academicYearId = ${academicYearId}`
        connection.query(sql, async function (error, result) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Something Went Wrong',
                    error: error,
                    data: []
                })
            } else {
                if (result.length == 0) {
                    res.json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": result
                    })
                } else {
                    res.json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": result
                    })
                }
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: []
        })
    }
})

/**
 * @author Manjunath
 * @uses to get ARK Proficiency by grade
 */
router.post('/getARKproficiencyByGrade', async function (req, res) {
    try {
        let sql = `SELECT * FROM ARKProficiencyByGrade WHERE schoolId = ${req.body.schoolId} AND academicYearId = ${req.body.academicYearId}`
        connection.query(sql, async function (error, result) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Something Went Wrong',
                    error: error,
                    data: []
                })
            } else {
                if (result.length == 0) {
                    res.status(200).json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": result
                    })
                } else {
                    res.status(200).json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": result
                    })
                }
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: []
        })
    }
})

/**
 * @author Manjunath
 * @uses to get Enrollment by grade.
 */
router.post('/getenrollmentByGrade', async function (req, res) {
    try {
        let sql = `SELECT * FROM EnrollmentByGrade WHERE schoolId = ${req.body.schoolId} AND academicYearId = ${req.body.academicYearId}`
        connection.query(sql, async function (error, result) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Something Went Wrong',
                    error: error,
                    data: []
                })
            } else {
                if (result.length == 0) {
                    res.status(200).json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": result
                    })
                } else {
                    res.status(200).json({
                        "statusCode": 200,
                        "message": "success",
                        "error": "",
                        "data": result
                    })
                }
            }
        })
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: []
        })
    }
})

/**
 * @author Gopi
 * @uses to get Flag Notification Academics.
 */
router.post('/loadFlagNotificationAcademics', function (req, res) {
    try {
        (async () => {
            let flagDataArray = []
            workbook = await xlsx.readFile('./assets/CSIP Miami FlagNotificaion Academics.xlsx');
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const range = xlsx.utils.decode_range(sheet['!ref']);
            for (let row = range.s.r; row <= range.e.r; row++) {
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellAddress = { r: row, c: col };
                    const cellRef = xlsx.utils.encode_cell(cellAddress);
                    const cellValue = sheet[cellRef] ? sheet[cellRef].v : undefined;
                    if (row === range.s.r) {
                    } else if (col === range.s.c) {
                        flagDataArray.push(cellValue)
                    } else {
                        flagDataArray.push(cellValue)
                    }
                }
            }
            let newArray = flagDataArray.filter((value) => value != null)
            res.json({
                "statusCode": 200,
                "message": "Flag data notification academics data fetched successfully",
                "data": newArray
            });
        })();
    } catch (error) {
        res.json({
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        })
    }
});

router.get('/getAcademicYears', async function(req, res) {
    try {
        let sql = `SELECT * FROM academicYears`
        connection.query(sql, (error, results) => {
            if (error) {
                res.status(500).json(error)
            } else {
                res.status(200).json(results)
            }
        })
    } catch (error) {
        res.status(500).json(error)
    }
})

module.exports = router;