var connection = require('../config');
var express = require("express");
var router = express.Router();

/**
 * @author Gopi
 * @uses To save DataAssessment plan
 */
router.post('/saveDataAssesmentPlan', async function (req, res) {
    try {
        let dataAssesmentPlanArray = req.body.dataAssessmentPlanArray;
        const userId = req.body.userId ? req.body.userId : 1
        await Promise.all(dataAssesmentPlanArray.map(async data => {
            await insertDataAssesmentPlan(data, req.body.schoolId, userId, req.body.academicYearId)
        }))
        // for (i = 0; i < dataAssesmentPlanArray.length; i++) {
        //     let response = await insertDataAssesmentPlan(dataAssesmentPlanArray[i], req.body.schoolId, req.body.userId);
        // }
        res.json({
            "statusCode": 200,
            "message": "Data Assesment Plan saved successfully",
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
 * @uses To async function to save
 */
async function insertDataAssesmentPlan(assesmentData, schoolId, userId, academicYearId) {
    return new Promise((resolve, reject) => {
        const adtCheck = assesmentData.adtCheck === true || assesmentData.adtCheck == 1 ? 1 : 0
        if (assesmentData.id == undefined) {
            let sql = `INSERT INTO DataAssesmentPlan (schoolId, assesmentName, assesmentType, assessedBy, dataCollected, learningTarget, assessmentResponsibleMember, adtCheck, academicYearId, createdBy, createdAt) VALUES (${schoolId}, ${connection.escape(assesmentData.assesmentName)}, ${connection.escape(assesmentData.assesmentType)}, ${connection.escape(assesmentData.assessedBy)}, ${connection.escape(assesmentData.dataCollected)}, ${connection.escape(assesmentData.learningTarget)}, ${connection.escape(assesmentData.responsibleMember)}, ${adtCheck}, ${academicYearId}, ${userId}, now())`
            connection.query(sql, (error, result) => {
                if (error) {
                    reject(error)
                }
                else {
                    resolve(result)
                }
            })
        }
        else {
            let sql = `UPDATE DataAssesmentPlan SET assesmentName = ${connection.escape(assesmentData.assesmentName)}, assesmentType = ${connection.escape(assesmentData.assesmentType)}, assessedBy = ${connection.escape(assesmentData.assessedBy)}, dataCollected = ${connection.escape(assesmentData.dataCollected)}, learningTarget = ${connection.escape(assesmentData.learningTarget)}, assessmentResponsibleMember = ${connection.escape(assesmentData.assessmentResponsibleMember)}, adtCheck = ${adtCheck}, createdBy = ${userId}, updatedAt = now() WHERE id = ${assesmentData.id} AND schoolId = ${assesmentData.schoolId}`
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
 * @uses To get DataAssesment Plan 
 */
router.post('/getDataAssesmentPlan', function (req, res) {
    try {
        let sql = `SELECT * FROM DataAssesmentPlan WHERE schoolId = ${req.body.schoolId} AND academicYearId = ${req.body.academicYearId} AND deleted = 0`
        connection.query(sql, (error, results) => {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Error while performing planning items',
                    error: error.message,
                    data: ""
                })
            }
            else {
                res.json({
                    "statusCode": 200,
                    "message": "DataAssesment plan fetched successfully",
                    "data": results
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
 * @uses To soft delete DataAssesment Plan
 */
router.post('/deleteAssesmentPlan', function (req, res) {
    try {
        let sql = `UPDATE DataAssesmentPlan SET deleted = 1 WHERE id = ${req.body.dataAssesmentPlanId}`
        connection.query(sql, (error, results) => {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Error while performing planning items',
                    error: error.message,
                    data: ""
                })
            }
            else {
                res.json({
                    "statusCode": 200,
                    "message": "DataAssesment plan deleted successfully",
                    "data": results
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

module.exports = router;