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
                userId: global.user_id,
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

//Index
const index = async (req, res, next) => {
try {
    const tasks = await prisma.task.findMany({
        where: {
            userId: global.user_id,
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

    if (tasks.length === 0) {
        return res.status(404).json({ message: "Task not found." });
    }
    return res.status(200).json(tasks);
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
                    userId: global.user_id,
                },
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
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
                    userId: global.user_id,
                },
            },
            data: value,
            select: {
                id: true,
                title: true,
                isCompleted: true,
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
                    userId: global.user_id,
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
};