var express = require('express');
var router = express.Router();
var _ = require('underscore'),
    Q = require('q');

var Projects = require('../models/projects'),
    Parts = require('../models/parts'),
    Members = require('../models/members'),
    Plans = require('../models/plans');

// 添加项目介面
router.get('/add', function(req, res, next) {
    res.render('project/add', {
        title: '添加项目'
    });
});

// 添加项目请求
router.post('/add', function(req, res, next) {
    req.body.start_at = new Date(req.body.start_at);
    req.body.complete_at = new Date(req.body.complete_at);
    req.body.create_at = new Date();
    req.body.belong_to = req.session.user_id;

    var newProject = new Projects(req.body);
    newProject.save(function(err, project, numAffected) {
        if (err) {
            var errorMsg = [];
            _.each(err.errors, function(val, key, list) {
                errorMsg.push(val.message)
            });
            console.error(errorMsg);
            return res.render('project/add', {
                title: '添加项目',
                error_tip: '添加项目\n' + errorMsg.join('\n')
            });
        }
        return res.redirect('/projects/' + project._id + '/parts');
    });
});

// 项目配置介面
router.get('/:id/settings', function(req, res, next) {
    var projectId = req.params.id;
    Projects.findById(projectId)
        .populate({
            path: 'parts',
            select: 'name'
        })
        .exec(function(err, project) {
            if (err) return console.error(err);
            if (project) {
                res.render('project/settings', {
                    title: '项目配置 - ' + project.name,
                    project: project
                });
            } else {
                next();
            }
        });
});

// 项目配置更新请求
router.put('/:id/settings', function(req, res, next) {
    var projectId = req.params.id;

    Projects.findOneAndUpdate({
        _id: projectId
    }, req.body, {
        new: true // 为真则返回修改后的文档
    }, function(err, project) {
        if (err) return console.error(err);

        if (project) {
            project.populate({
                path: 'parts',
                select: 'name'
            }, function(err, populateProject) {
                if (err) return console.error(err);
                res.render('project/settings', {
                    title: '项目配置 - ' + populateProject.name,
                    project: populateProject
                });
            });
        } else {
            next();
        }
    });
});

// 分组介面
router.get('/:id/parts', function(req, res, next) {
    var id = req.params.id;
    /* Parts.where({
        belong_to: id
    }).exec() */
    Projects.findById(id)
        .populate({
            path: 'parts',
            select: {
                name: 1,
                belong_to: -1
            }
        })
        .select({
            name: 1,
            parts: 1
        })
        .exec(function(err, project) {
            if (err) return console.error(err);
            if (project) {
                res.render('project/parts', {
                    title: '分组管理 - ' + project.name,
                    project: project
                });
            } else {
                next();
            }
        });
});

// 添加分组
router.post('/:id/parts', function(req, res, next) {
    var id = req.params.id;

    var newPart = new Parts({
        name: req.body.name,
        belong_to: id
    });

    Projects.findById(id)
        .select({
            parts: 1
        })
        .exec(function(err, project) {
            if (err) {
                console.error(err);
                return res.json({
                    status: false
                });
            }
            // 未找到
            if (!project) {
                return res.json({
                    status: false
                });
            }
            // 查找到一个 project
            // 先保存part
            newPart.save(function(err, part, numAffected) {
                if (err) {
                    console.error(err);
                    return res.json({
                        status: false
                    });
                }
                if (_.isArray(project.parts)) {
                    project.parts.push(part._id);
                } else {
                    project.parts = [part._id];
                }
                // 再更新project
                Projects.findByIdAndUpdate(id, {
                    $set: {
                        parts: project.parts
                    }
                }, {
                    upsert: true
                }, function(err, raw) {
                    if (err) {
                        console.error(err);
                        return res.json({
                            status: false
                        });
                    }
                    // 更新成功
                    res.json({
                        status: true,
                        part: part
                    });
                });
            });
        });
});

// 删除分组
router.delete('/:projectId/parts/:partId', function(req, res, next) {
    var projectId = req.params.projectId,
        partId = req.params.partId;

    Projects.findById(projectId)
        .select({
            parts: 1
        })
        .exec(function(err, project) {
            if (err) {
                console.error(err);
                return res.json({
                    status: false
                });
            }
            // 未找到project 或者 project.parts中不存在partId
            var partIdIndex = project.parts.indexOf(partId);
            if (!project || partIdIndex < 0) {
                return res.json({
                    status: false
                });
            }

            var newParts = project.parts.filter(function(elem, idx) {
                return idx !== partIdIndex;
            });
            // 查找到一个 project
            // 先更新project
            Projects.findByIdAndUpdate(project._id, {
                $set: {
                    parts: newParts
                }
            }, {
                upsert: true
            }, function(err, raw) {
                if (err) {
                    console.error(err);
                    return res.json({
                        status: false
                    });
                }
                // 再删除part
                Parts.remove({
                    _id: partId
                }, function(err) {
                    if (err) return console.error(err);


                });
                // project.parts更新成功
                // 无论part删除成功与否都要返回 true
                // 因为project已更新
                res.json({
                    status: true
                });
            });

        });
});

// 计划列表介面
router.get('/:id/plans', function(req, res, next) {
    var id = req.params.id;

    Projects.findById(id)
        .populate({
            path: 'plans'
        })
        .select({
            name: 1,
            plans: 1
        })
        .exec(function(err, project) {
            if (err) return console.error(err);
            if (project) {
                res.render('project/plans', {
                    title: '计划管理 - ' + project.name,
                    project: project
                });
            } else {
                next();
            }
        });
});

// 计划添加介面
router.get('/:id/plans/add', function(req, res, next) {
    var id = req.params.id;

    Projects.findById(id)
        .populate([{
            path: 'parts',
            select: 'name'
        }, {
            path: 'members',
            select: 'name contact'
        }])
        .select({
            name: 1,
            parts: 1,
            members: 1
        })
        .exec(function(err, project) {
            if (err) return console.error(err);
            if (project) {
                res.render('project/planAdd', {
                    title: '计划管理 - ' + project.name,
                    project: project
                });
            } else {
                next();
            }
        });
});

// 计划添加接口
router.post('/:id/plans/add', function(req, res, next) {
    var id = req.params.id;
    var picId = req.body['pic._id'],
        charge_partId = req.body['charge_part._id'];

    Q.fcall(Members.findById(picId, function(err, pic) {
        if (err) return console.error(err);
        if (pic) {
            req.body.pic = {
                _id: pic._id,
                name: pic.name,
                contact: pic.contact
            };
        }
    })).then(Parts.findById(charge_partId, function(err, charge_part) {
        if (err) return console.error(err);
        if (charge_part) {
            req.body.charge_part = {
                _id: charge_part._id,
                name: charge_part.name
            };
        }
    })).catch(function(err) {
        console.error(err);
    }).done(function() {
        req.body.start_at = new Date(req.body.start_at);
        req.body.complete_at = new Date(req.body.complete_at);
        req.body.belong_to = req.session.user_id;

        var newPlan = new Plans(req.body);
        Projects.findById(id)
            .select({
                plans: 1
            })
            .exec(function(err, project) {
                if (err) {
                    console.error(err);
                    return res.json({
                        status: false
                    });
                }
                // 未找到
                if (!project) {
                    return res.json({
                        status: false
                    });
                }
                // 查找到一个 project
                // 先保存plan
                newPlan.save(function(err, plan, numAffected) {
                    if (err) {
                        var errorMsg = [];
                        _.each(err.errors, function(val, key, list) {
                            errorMsg.push(val.message)
                        });
                        return res.json({
                            status: false,
                            error: errorMsg
                        });
                    }

                    if (_.isArray(project.plans)) {
                        project.plans.push(plan._id);
                    } else {
                        project.plans = [plan._id];
                    }
                    // 再更新project
                    Projects.findByIdAndUpdate(id, {
                        $set: {
                            plans: project.plans
                        }
                    }, {
                        upsert: true
                    }, function(err, raw) {
                        if (err) {
                            var errorMsg = [];
                            _.each(err.errors, function(val, key, list) {
                                errorMsg.push(val.message)
                            });
                            return res.json({
                                status: false,
                                error: errorMsg
                            });
                        }
                        // 更新成功
                        res.json({
                            status: true,
                            plan: plan
                        });
                    });
                });
            });
    });
});

// 删除计划接口
router.delete('/:projectId/plans/:planId', function(req, res, next) {
    var projectId = req.params.projectId,
        planId = req.params.planId;

    Projects.findById(projectId)
        .select({
            plans: 1
        })
        .exec(function(err, project) {
            if (err) {
                console.error(err);
                return res.json({
                    status: false
                });
            }
            // 未找到project 或者 project.plans中不存在planId
            var planIdIndex = project.plans.indexOf(planId);
            if (!project || planIdIndex < 0) {
                return res.json({
                    status: false
                });
            }

            var newPlans = project.plans.filter(function(elem, idx) {
                return idx !== planIdIndex;
            });
            // 查找到一个 project
            // 先更新project
            Projects.findByIdAndUpdate(project._id, {
                $set: {
                    plans: newPlans
                }
            }, {
                upsert: true
            }, function(err, raw) {
                if (err) {
                    console.error(err);
                    return res.json({
                        status: false
                    });
                }
                // 再删除plan
                Plans.remove({
                    _id: planId
                }, function(err) {
                    if (err) return console.error(err);


                });
                // project.plans更新成功
                // 无论plan删除成功与否都要返回 true
                // 因为project已更新
                res.json({
                    status: true
                });
            });

        });
});

// 成员管理介面
router.get('/:id/members', function(req, res, next) {
    var id = req.params.id;

    Projects.findById(id)
        .populate({
            path: 'members',
            select: {
                name: 1,
                contact: 1
            }
        })
        .select({
            name: 1,
            members: 1
        })
        .exec(function(err, project) {
            if (err) return console.error(err);
            if (project) {
                res.render('project/members', {
                    title: '成员管理 - ' + project.name,
                    project: project
                });
            } else {
                next();
            }
        });
});

// 成员添加接口
router.post('/:id/members', function(req, res, next) {
    var id = req.params.id;

    var newMember = new Members({
        name: req.body.name,
        contact: req.body.contact,
        belong_to: id
    });

    Projects.findById(id)
        .select({
            members: 1
        })
        .exec(function(err, project) {
            if (err) {
                console.error(err);
                return res.json({
                    status: false
                });
            }
            // 未找到
            if (!project) {
                return res.json({
                    status: false
                });
            }
            // 查找到一个 project
            // 先保存part
            newMember.save(function(err, member, numAffected) {
                if (err) {
                    console.error(err);
                    return res.json({
                        status: false
                    });
                }
                if (_.isArray(project.members)) {
                    project.members.push(member._id);
                } else {
                    project.members = [member._id];
                }
                // 再更新project
                Projects.findByIdAndUpdate(id, {
                    $set: {
                        members: project.members
                    }
                }, {
                    upsert: true
                }, function(err, raw) {
                    if (err) {
                        console.error(err);
                        return res.json({
                            status: false
                        });
                    }
                    // 更新成功
                    delete member.belong_to;
                    res.json({
                        status: true,
                        member: member
                    });
                });
            });
        });
});

// 删除成员
router.delete('/:projectId/members/:memberId', function(req, res, next) {
    var projectId = req.params.projectId,
        memberId = req.params.memberId;

    Projects.findById(projectId)
        .select({
            members: 1
        })
        .exec(function(err, project) {
            if (err) {
                console.error(err);
                return res.json({
                    status: false
                });
            }
            // 未找到project 或者 project.members中不存在memberId
            var memberIdIndex = project.members.indexOf(memberId);
            if (!project || memberIdIndex < 0) {
                return res.json({
                    status: false
                });
            }

            var newMembers = project.members.filter(function(elem, idx) {
                return idx !== memberIdIndex;
            });
            // 查找到一个 project
            // 先更新project
            Projects.findByIdAndUpdate(project._id, {
                $set: {
                    members: newMembers
                }
            }, {
                upsert: true
            }, function(err, raw) {
                if (err) {
                    console.error(err);
                    return res.json({
                        status: false
                    });
                }
                // 再删除part
                Parts.remove({
                    _id: memberId
                }, function(err) {
                    if (err) return console.error(err);


                });
                // project.parts更新成功
                // 无论member删除成功与否都要返回 true
                // 因为project已更新
                res.json({
                    status: true
                });
            });

        });
});

// 监控介面
router.get('/:id/monitor', function(req, res, next) {
    var id = req.params.id;

    Projects.findById(id)
        .populate({
            path: 'plans'
        })
        .exec(function(err, project) {
            if (err) {
                console.error(err);
                return next();
            }
            if (project) {
                _.each(project.plans, function(elem, index, list) {
                    var start_at = new Date(elem.start_at).valueOf(),
                        complete_at = new Date(elem.complete_at).valueOf();

                    elem.monitor = {
                        start_at_min: start_at - 86400000 * 30,
                        start_at_max: start_at + 86400000 * 30,
                        complete_at_min: complete_at - 86400000 * 60,
                        complete_at_max: complete_at + 86400000 * 30
                    };
                    if (!elem.reality) {
                        elem.monitor = {
                            start_at: start_at,
                            complete_at: complete_at,
                        };
                    } else {
                        elem.monitor = {
                            start_at: new Date(elem.reality.start_at).valueOf(),
                            complete_at: new Date(elem.reality.complete_at).valueOf(),
                            funds: elem.reality.funds,
                            manpower: elem.reality.manpower
                        };
                    }
                });

                res.render('project/monitor', {
                    title: '项目监控 - ' + project.name,
                    project: project
                });
            } else {
                next();
            }
        });
});

// 监控完成接口
router.put('/:projectId/monitor/:planId', function(req, res, next) {
    var projectId = req.params.projectId,
        planId = req.params.planId;

    Plans.findById(planId, function(err, plan) {
        var planResult;
        if (err) {
            console.error(err);
            return next();
        }
        if (plan) {
            try {
                planResult = {
                    complete: true,
                    reality: {
                        start_at: req.body.start_at,
                        complete_at: req.body.complete_at,
                        // 预计完成 - 实际完成
                        time_diff: (plan.complete_at - req.body.start_at) / 86400000,
                        funds: req.body.funds,
                        // 预计资金 - 实际资金
                        funds_diff: plan.funds - req.body.funds,
                        manpower: req.body.manpower
                    }
                }
                Plans.findOneAndUpdate({
                    _id: plan._id
                }, {
                    $set: planResult
                }, {
                    new: true
                }, function(err, plan) {
                    if (err) {
                        console.error(err);
                        return next();
                    }
                    if (plan) {
                        res.json({
                            status: true
                        });
                    } else {
                        next();
                    }
                });
            } catch (e) {
                console.error(err);
                return next();
            }
        } else {
            next();
        }
    });

    /* var planResult = {
        complete: true,
        reality: {
            start_at: req.body.start_at,
            complete_at: req.body.complete_at,
            // 差几天
            time_diff: (req.body.complete_at - req.body.start_at) / 86400000,
            funds: req.body.funds,
            // 差几元
            funds_diff: 
        }
    }

    Projects.findOneAndUpdate({
        _id: projectId
    }, {
        $set: {
            complete: true,
            reality: {
                start_at: req.body.start_at,
                complete_at: req.body.complete_at,
                time_delta: 
            }
        }
    }, {
        new: true // 为真则返回修改后的文档
    }, function(err, project) {
        if (err) return console.error(err);

        if (project) {
            project.populate({
                path: 'parts',
                select: 'name'
            }, function(err, populateProject) {
                if (err) return console.error(err);
                res.render('project/settings', {
                    title: '项目配置 - ' + populateProject.name,
                    project: populateProject
                });
            });
        } else {
            next();
        }
    }); */
});


module.exports = router;
