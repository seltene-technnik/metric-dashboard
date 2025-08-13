var connection = require('../config');
var express = require("express");
var router = express.Router();

/**
 * @author Gopi
 * @uses To save PD plan
 */
router.post('/savePdPlan', async function (req, res) {
    try {
        let pdPlanDataArray = req.body.pdPlanDataArray;
        const userId = req.body.userId || 1
        for (i = 0; i < pdPlanDataArray.length; i++) {
            let response = await insertPdPlanData(pdPlanDataArray[i], req.body.schoolId, userId, req.body.academicYearId)
        }
        res.json({
            "statusCode": 200,
            "message": "PDPlan data saved successfully",
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
 * @uses async function to save PD plan
 */
async function insertPdPlanData(pdPlanData, schoolId, userId, academicYearId) {
    return new Promise((resolve, reject) => {
        const adtCheck = pdPlanData.adtCheck === true || pdPlanData.adtCheck == 1 ? 1 : 0
        if (pdPlanData.id == undefined) {
            let sql = `INSERT INTO PdPlan (schoolId, pdPlanDate, pdPlanTitle, flaggingIndicator, PdPlanFocusArea, pdPlanDescription, PdPlanFundingSource, pdPlanPrincipalActions, adtCheck, academicYearId, createdBy, createdAt) VALUES (${schoolId}, ${connection.escape(pdPlanData.pdPlanDate)}, ${connection.escape(pdPlanData.pdPlanTitle)}, ${connection.escape(pdPlanData.flaggingIndicator)}, ${connection.escape(pdPlanData.PdPlanFocusArea)}, ${connection.escape(pdPlanData.pdPlanDescription)}, ${connection.escape(pdPlanData.PdPlanFundingSource)}, ${connection.escape(pdPlanData.pdPlanPrincipalActions)}, ${adtCheck}, ${academicYearId}, ${userId}, now())`
            connection.query(sql, (error, result) => {
                if (error) {
                    console.log(error)
                    reject(error)
                }
                else {
                    resolve(result)
                }
            })
        }
        else {
            let sql = `UPDATE PdPlan SET pdPlanDate = ${connection.escape(pdPlanData.pdPlanDate)}, pdPlanTitle = ${connection.escape(pdPlanData.pdPlanTitle)}, flaggingIndicator = ${connection.escape(pdPlanData.flaggingIndicator)}, PdPlanFocusArea = ${connection.escape(pdPlanData.PdPlanFocusArea)}, pdPlanDescription = ${connection.escape(pdPlanData.pdPlanDescription)}, PdPlanFundingSource = ${connection.escape(pdPlanData.PdPlanFundingSource)}, pdPlanPrincipalActions = ${connection.escape(pdPlanData.pdPlanPrincipalActions)}, adtCheck = ${adtCheck}, createdBy = ${userId}, updatedAt = now() WHERE id = ${pdPlanData.id} AND schoolId = ${pdPlanData.schoolId}`
            connection.query(sql, (error, result) => {
                if (error) {
                    console.log(error)
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
 * @uses To get PDPlan data
 */
router.post('/getPDPlanData', function (req, res) {
    try {
        let sql = `SELECT * FROM PdPlan WHERE schoolId = ${req.body.schoolId} AND academicYearId = ${req.body.academicYearId} AND deleted = 0`
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
                    "message": "PDPlan data  fetched successfully",
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
router.post('/deletePDPlan', function (req, res) {
    try {
        let sql = `UPDATE PdPlan SET deleted = 1 WHERE id = ${req.body.pdPlanId}`
        connection.query(sql, (error, results) => {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Error while performing deleting items',
                    error: error.message,
                    data: ""
                })
            }
            else {
                res.json({
                    "statusCode": 200,
                    "message": "PDPlan data deleted successfully",
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