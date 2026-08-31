const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");


//Create
const create = async (req, res, next) => {
    const { error, value } = taskSchema.validate(req.body || {}, { abortEarly: false});
    if (error) {
        return res.status(400).json({message: error.message });
    }

    try {
        const isCompleted = value.isCompleted ?? value.is_completed ?? false;

        const task = await prisma.task.create({
            data: {
                title: value.title,
                isCompleted: isCompleted,
                priority: value.priority,
                userId: req.user.id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
            },
        });
        return res.status(201).json(task);
    } catch (err) {
        return next(err);
    }
};

//Bulk create task
const bulkCreate = async (req, res, next) => {
    const { tasks } = req.body || {};

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
            error: "Invalid request data. Expected an array of tasks.",
        });
    }
    const validTasks = [];
    for (const task of tasks) {
        const { error, value } = taskSchema.validate(task, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.details,
            });
        } 

        const isCompleted = value.isCompleted ?? value.is_completed ?? false;

        validTasks.push({
            title: value.title,
            isCompleted: isCompleted,
            priority: value.priority || "medium",
            userId: req.user.id,
        });
    }

    try {
        const result = await prisma.task.createMany({
            data: validTasks,
            skipDuplicates: false,
        });

        return res.status(201).json({
            message: "Bulk task creation successful",
            tasksCreated: result.count,
            totalRequested: validTasks.length,
        });
    } catch (err) {
        return next(err);
    }
};



//orderBy helper function
const getOrderBy = (query) => {
    const validSortFields = ["title", "priority", "createdAt", "id", "isCompleted"];
    const sortBy = query.sortBy || "createdAt";
    const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

    if (validSortFields.includes(sortBy)) {
    return { [sortBy]: sortDirection };
    }
    return { createdAt: "desc"};
};

//Index
const index = async (req, res, next) => {
try {

    const  { find, isCompleted, min_date, max_date} = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ error: "Invalid pagination parameters"});
    }

    const skip = (page - 1) * limit;

    const whereClause = {
        userId: req.user.id,
    };

    if (find) {
        whereClause.title = {
            contains: find,
            mode: "insensitive",
        };
    }

    if (isCompleted !== undefined) {
        whereClause.isCompleted = isCompleted === "true";
    }

    if (min_date || max_date) {
        whereClause.createdAt = {};
        if (min_date) {
            whereClause.createdAt.gte = new Date(min_date);
        }
        if (max_date) {
            whereClause.createdAt.lte = new Date(max_date);
        }
    }

    const tasks = await prisma.task.findMany({
        where: whereClause,
        select: {
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
            createdAt: true,
            User: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        skip: skip,
        take: limit,
        orderBy: getOrderBy(req.query),
    });

    if (!tasks || tasks.length === 0) {
        return res.status(404).json({ message: "No tasks found"});
    }

    const totalTasks = await prisma.task.count({
        where: whereClause,
    });

    const pagination = {
        page: page,
        limit: limit,
        total: totalTasks,
        pages: Math.ceil(totalTasks / limit),
        hasNext: page * limit < totalTasks,
        hasPrev: page > 1,
    };

    return res.status(200).json({
        tasks,
        pagination,
    });
} catch (err) {
    return next(err);
}
};

//Show
const show = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    if (isNaN(taskId)) {
        return res.status(400).json({ message: "The task ID passed is not valid."});
    }
    try{
        const task = await prisma.task.findUnique({
            where: {
                id_userId: {
                    id: taskId,
                    userId: req.user.id,
                },
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                User: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!task) {
            return res.status(404).json({ message: "The task was not found."});
        }
        
        return res.status(200).json(task);
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "The task was not found."});
        }
        return next(err);
    }
};

//Update
const update = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    if (isNaN(taskId)){
        return res.status(400).json({ message: "The task ID passed is not valid"});
    }
    const { error, value } = patchTaskSchema.validate(req.body || {}, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message})
    }
    if (Object.keys(value).length === 0) {
        return res.status(400).json({ message: "No fields provided to update."});
    }
    try {
        const updatedTask = await prisma.task.update({
            where: {
                id_userId: {
                    id: taskId,
                    userId: req.user.id,
                },
            },
            data: value,
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
            },
        });

        return res.status(200).json(updatedTask);
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "The task was not found." });
        }
        return next(err);
    }
};

//Delete
const deleteTask = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    if(isNaN(taskId)) {
        return res.status(400).json({ message: "The task ID passed is not valid."});
    }
    try {
        const deletedTask = await prisma.task.delete({
            where: {
                id_userId: {
                    id: taskId,
                    userId: req.user.id,
                },
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
            },
        });
        return res.status(200).json(deletedTask);
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "The task was not found." });
        }
        return next(err);
    }
};

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
    bulkCreate,
};