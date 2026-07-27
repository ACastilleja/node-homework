
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

//task counter
const taskCounter = (() => {
    let lastTaskNumber = 0;
    return ()=> {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
}) ();

//helper function to take out userId

const sanitizeTask = (task) => {
    const { userId, ...sanitized } = task;
    return sanitized;
};

//Create
const create = (req, res) => {
    const { error, value } = taskSchema.validate(req.body || {}, { abortEarly: false});
    if (error) {
        return res.status(400).json({message: error.message });
    }

    const newTask = {
        id: taskCounter(),
        userId: global.user_id.email,
        ...value,
    };

    global.tasks.push(newTask);
    return res.status(201).json(sanitizeTask(newTask));
};

//Index
const index = (req, res) => {
    const userTasks = global.tasks.filter(
        (task) => task.userId === global.user_id.email
    );

    if (userTasks.length === 0) {
        return res.status(404).json({message: "No tasks found for this user." })
    }

    const sanitizedTasks = userTasks.map(sanitizeTask);
    return res.satus(200).json(sanitizedTasks);
};

//Show
const show = (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({message: "The task ID passed is not valid."});
    }

    const task = global.tasks.find(
        (t) => t.id === taskId && t.userId === global.user_id.email);
    
        if (!task) {
            return res.status(404).json({message: "Task not found."});
        }
        return res.status(200).json(sanitizeTask(task));
};

//Update
const update = (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({message: "The task ID passed is not valid."});
    }
    
    const { error, value } = patchTaskSchema.validate(req.body || {}, { abortEarly: false});
    if (error) {
        return res.status(400).json({ message: error.message });
    }
    const task = global.tasks.find(
        (t) => t.id === taskId && t.userId === global.user_id.email);

        if (!task) {
            return res.status(404).json({message: "Task not found."});
        }

        Object.assign(task, value);

        return res.status(200).json(sanitizeTask(task));
};

//Delete
const deleteTask = (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({message: "The task ID passed is not valid."});
    }
    const indexToDelete = global.tasks.findIndex(
        (t) => t.id === taskId && t.userId ===global.user_id.email
    );
    if (indexToDelete === -1) {
        return res.status(404).json({ message: "Task not found."});
    }

    const [deletedTask] = global.tasks.splice(indexToDelete, 1);
    return res.status(200).json(sanitizeTask(deletedTask));
};

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
};