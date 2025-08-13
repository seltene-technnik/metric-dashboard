var connection = require('../config');
var express = require("express");
var router = express.Router();
var isAddYearActive = false;

/**
 * @author Gopi
 * @uses To get planning action items
 */
router.post('/items', function (req, res) {
    try {
        let sql = `SELECT PA.id AS priorityAreaId, PA.schoolId, PA.type, AP.id AS actionPlanId, AP.year, AP.value, AP.sequence FROM PriorityAreas PA JOIN ActionPlanning AP ON PA.id = AP.priorityAreaId WHERE PA.schoolId = ${req.body.schoolId} AND PA.type = ${connection.escape(req.body.priorityType)} AND PA.isDeleted = 0 ORDER BY PA.id, AP.year, AP.sequence`;
        connection.query(sql, function (error, results, fields) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Error while performing planning items',
                    error: error.message,
                    data: ""
                })
            } else {
                let goalObject = {}
                if (results.length > 0) {
                    results.forEach((goal, goalIndex) => {
                        if (goalObject[goal.priorityAreaId] == undefined) {
                            goalObject[goal.priorityAreaId] = {}
                            goalObject[goal.priorityAreaId][goal.year] = [{
                                "year": goal.year,
                                "id": goal.actionPlanId,
                                "value": goal.value,
                                "sequence": goal.sequence
                            }]
                        } else if (goalObject[goal.priorityAreaId][goal.year] == undefined) {
                            goalObject[goal.priorityAreaId][goal.year] = [{
                                "year": goal.year,
                                "id": goal.actionPlanId,
                                "value": goal.value,
                                "sequence": goal.sequence
                            }]
                        } else {
                            goalObject[goal.priorityAreaId][goal.year].push({
                                "year": goal.year,
                                "id": goal.actionPlanId,
                                "value": goal.value,
                                "sequence": goal.sequence
                            })
                        }
                        if (results.length - 1 == goalIndex) {
                            res.json({
                                statusCode: 200,
                                message: 'success',
                                error: "",
                                data: goalObject
                            })
                        }

                    })
                } else {
                    res.json({
                        statusCode: 200,
                        message: 'success',
                        error: "",
                        data: {}
                    })
                }
            }
        })
    } catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        }
        res.send(response)
    }
});

/**
 * @author Gopi
 * @uses To get planning action items
 */
router.post('/save', function (req, res) {
    try {
        let areasCount = 0
        req.body.areas.forEach(async (area, areaIndex) => {
            if (area.id != null) {
                await new Promise((resolve, reject) => {
                    let count = 0
                    area.year1.forEach(goal => {
                        let sql = `UPDATE ActionPlanning SET value = ${connection.escape(goal.value)} WHERE id = ${goal.id} AND priorityAreaId = ${area.id} AND schoolId = ${req.body.schoolId} AND type = ${connection.escape(req.body.priorityType)}`;
                        connection.query(sql, function (error, results, fields) {
                            if (error) {
                                resolve()
                            } else {
                                count++;
                                if (count == area.year1.length) {
                                    areasCount++;
                                    if ((areaIndex == req.body.areas.length - 1) && (req.body.areas.length * 3 == areasCount)) {
                                        res.json({
                                            statusCode: 200,
                                            message: 'success',
                                            error: "",
                                            data: []
                                        })
                                    }
                                    resolve();
                                }
                            }
                        })
                    });
                })
                await new Promise((resolve, reject) => {
                    let count = 0
                    area.year2.forEach(goal => {
                        let sql = `UPDATE ActionPlanning SET value = ${connection.escape(goal.value)} WHERE id = ${goal.id} AND priorityAreaId = ${area.id} AND schoolId = ${req.body.schoolId} AND type = ${connection.escape(req.body.priorityType)}`;
                        connection.query(sql, function (error, results, fields) {
                            if (error) {
                                resolve()
                            } else {
                                count++;
                                if (count == area.year2.length) {
                                    areasCount++;
                                    if ((areaIndex == req.body.areas.length - 1) && (req.body.areas.length * 3 == areasCount)) {
                                        res.json({
                                            statusCode: 200,
                                            message: 'success',
                                            error: "",
                                            data: []
                                        })
                                    }
                                    resolve();
                                }
                            }
                        })
                    });
                })
                await new Promise((resolve, reject) => {
                    let count = 0
                    area.year3.forEach(goal => {
                        let sql = `UPDATE ActionPlanning SET value = ${connection.escape(goal.value)} WHERE id = ${goal.id} AND priorityAreaId = ${area.id} AND schoolId = ${req.body.schoolId} AND type = ${connection.escape(req.body.priorityType)}`;
                        connection.query(sql, function (error, results, fields) {
                            if (error) {
                                resolve()
                            } else {
                                count++;
                                if (count == area.year3.length) {
                                    areasCount++;
                                    if ((areaIndex == req.body.areas.length - 1) && (req.body.areas.length * 3 == areasCount)) {
                                        res.json({
                                            statusCode: 200,
                                            message: 'success',
                                            error: "",
                                            data: []
                                        })
                                    }
                                    resolve();
                                }
                            }
                        })
                    });
                })
            } else {
                let sql = `INSERT INTO PriorityAreas(schoolId, type)VALUES(${req.body.schoolId}, ${connection.escape(req.body.priorityType)})`;
                connection.query(sql, async function (error, results, fields) {
                    if (error) {
                        res.json({
                            statusCode: 400,
                            message: 'Error while performing priority area',
                            error: error.message,
                            data: ""
                        })
                    } else {
                        let priorityAreaId = results.insertId;
                        await new Promise((resolve, reject) => {
                            let count = 0
                            area.year1.forEach(goal => {
                                let sql = `INSERT INTO ActionPlanning(priorityAreaId, schoolId, type, year, value, sequence)VALUES(${priorityAreaId}, ${req.body.schoolId}, ${connection.escape(req.body.priorityType)}, ${connection.escape(goal.year)}, ${connection.escape(goal.value)}, ${goal.sequence})`;
                                connection.query(sql, function (error, results, fields) {
                                    if (error) {
                                        resolve()
                                    } else {
                                        count++;
                                        if (count == area.year1.length) {
                                            areasCount++;
                                            if ((areaIndex == req.body.areas.length - 1) && (req.body.areas.length * 3 == areasCount)) {
                                                res.json({
                                                    statusCode: 200,
                                                    message: 'success',
                                                    error: "",
                                                    data: []
                                                })
                                            }
                                            resolve();
                                        }
                                    }
                                })
                            });
                        })
                        await new Promise((resolve, reject) => {
                            let count = 0
                            area.year2.forEach(goal => {
                                let sql = `INSERT INTO ActionPlanning(priorityAreaId, schoolId, type, year, value, sequence)VALUES(${priorityAreaId}, ${req.body.schoolId}, ${connection.escape(req.body.priorityType)}, ${connection.escape(goal.year)}, ${connection.escape(goal.value)}, ${goal.sequence})`;
                                connection.query(sql, function (error, results, fields) {
                                    if (error) {
                                        resolve()
                                    } else {
                                        count++;
                                        if (count == area.year2.length) {
                                            areasCount++;
                                            if ((areaIndex == req.body.areas.length - 1) && (req.body.areas.length * 3 == areasCount)) {
                                                res.json({
                                                    statusCode: 200,
                                                    message: 'success',
                                                    error: "",
                                                    data: []
                                                })
                                            }
                                            resolve();
                                        }
                                    }
                                })
                            });
                        })
                        await new Promise((resolve, reject) => {
                            let count = 0
                            area.year3.forEach(goal => {
                                let sql = `INSERT INTO ActionPlanning(priorityAreaId, schoolId, type, year, value, sequence)VALUES(${priorityAreaId}, ${req.body.schoolId}, ${connection.escape(req.body.priorityType)}, ${connection.escape(goal.year)}, ${connection.escape(goal.value)}, ${goal.sequence})`;
                                connection.query(sql, function (error, results, fields) {
                                    if (error) {
                                        resolve()
                                    } else {
                                        count++;
                                        if (count == area.year3.length) {
                                            areasCount++;
                                            if ((areaIndex == req.body.areas.length - 1) && (req.body.areas.length * 3 == areasCount)) {
                                                res.json({
                                                    statusCode: 200,
                                                    message: 'success',
                                                    error: "",
                                                    data: []
                                                })
                                            }
                                            resolve();
                                        }
                                    }
                                })
                            });
                        })
                    }
                })
            }
        })
    } catch (error) {
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        }
        res.send(response)
    }
});

/**
 * @author Gopi
 * @uses To get planning action items
 */
router.post('/delete', function (req, res) {
    try {
        let sql = `UPDATE PriorityAreas SET isDeleted = 1 WHERE id = ${req.body.priorityAreaId} AND schoolId = ${req.body.schoolId}`;
        connection.query(sql, function (error, results, fields) {
            if (error) {
                res.json({
                    statusCode: 400,
                    message: 'Error while performing planning delete',
                    error: error.message,
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
        let response = {
            statusCode: 500,
            message: error,
            error: error,
            data: ""
        }
        res.send(response)
    }
});

/**
 * @author Manjunath
 * @uses To get add year status
 */
router.get('/checkAddYearStatus', function (req, res) {
    try {
        if (isAddYearActive) {
            res.json({
                statusCode: 200,
                message: 'success',
                error: "",
                data: 'enable'
            })
        } else {
            res.json({
                statusCode: 200,
                message: 'success',
                error: "",
                data: 'disable'
            })
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
});


module.exports = router;

/**
 * @author Manjunath
 * @uses To update add year status
 */
module.exports.unlockAddYear = () => {
    isAddYearActive = true;
};