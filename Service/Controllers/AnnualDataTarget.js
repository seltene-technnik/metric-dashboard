var connection = require('../config');
var express = require("express");
var router = express.Router();

async function executeQuery (sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (error, results) => {
            if (error) {
                reject(error)
            } else {
                resolve(results)
            }
        })
    })
}

async function getannualDataTarget (schoolId, academicYearId) {
    try {
        let sql = `SELECT * FROM AnnualDataTarget WHERE schoolId = ${schoolId} AND academicYearId = ${academicYearId}`
        const results = await executeQuery(sql);
        return results;
    } catch (error) {
        throw error;
    }
}

async function updateAdditionalADT (schoolId, additionalADT, academicYearId) {
    try {
        const adt = additionalADT ? `'${JSON.stringify(additionalADT)}'`: null
        let sql = `UPDATE AnnualDataTarget SET additionalADT = ${adt} WHERE schoolId = ${schoolId} AND academicYearId = ${academicYearId}`
        const results = await executeQuery(sql);
        return results;
    } catch (error) {
        throw error;
    }
}

async function addADT (schoolId, defaultADT, additionalADT, academicYearId) {
    try {
        const adt = additionalADT ? `'${JSON.stringify(additionalADT)}'`: null
        let sql = `INSERT INTO AnnualDataTarget (schoolId, defaultADT, academicYearId, additionalADT) VALUES (${schoolId}, ${defaultADT}, ${academicYearId}, ${adt})`
        const results = await executeQuery(sql);
        return results;
    } catch (error) {
        throw error;
    }
}

router.post('/annualDataTarget', async function (req, res) {
    try {
        const results = await getannualDataTarget(req.body.schoolId, req.body.academicYearId)
        res.json({
            "statusCode": 200,
            "message": "Annual Data Target fetched successfully",
            "data": results
        })
    }
    catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        }
        res.status(500).json(response);
    }
})

router.post('/saveAdditonalData', async function (req, res) {
    try {
        const additionalADT = req.body.additionalADT
        const results = await getannualDataTarget(req.body.schoolId, req.body.academicYearId)
        if (results.length > 0) {
            const updateRes = await updateAdditionalADT(req.body.schoolId, additionalADT, req.body.academicYearId);
            res.json({
                "statusCode": 200,
                "message": "Annual Data Target updated successfully",
                "data": updateRes
            })
        } else {
            const insertRes = await addADT(req.body.schoolId, null, additionalADT, req.body.academicYearId);
            res.json({
                "statusCode": 200,
                "message": "Annual Data Target updated successfully",
                "data": insertRes
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
        res.status(500).json(response);
    }
})

module.exports = router;