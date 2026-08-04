const pool = require("../db/pg-pool");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");


//Create
const create = async (req, res) => {
    const { error, value } = taskSchema.validate(req.body || {}, { abortEarly: false});
    if (error) {
        return res.status(400).json({message: error.message });
    }

    const isCompleted = value.isCompleted ?? value.is_completed ?? false;

    const task = await pool.query(
        `INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING id, title, is_completed`, 
        [value.title, isCompleted, global.user_id]
    );
    return res.status(201).json(task.rows[0]);
};

//Index
const index = async (req, res) => {
const tasks = await pool.query(
    `SELECT id, title, is_completed FROM tasks WHERE user_id = $1`, [global.user_id]
);
if (tasks.rows.length === 0){
    return res.status(404).json({ message: "No tasks found for this user."});
}
return res.status(200).json(tasks.rows);
};

//Show
const show = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (isNaN(taskId)) {
        return res.status(400).json({ message: "The task ID passed is not valid."});
    }
    const task = await pool.query(
        `SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2`, [taskId, global.user_id]
    );
    if(task.rows.length === 0) {
        return res.status(404).json({ message: "Task not found."});
    }
    return res.status(200).json(task.rows[0]);
};

//Update
const update = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (isNaN(taskId)){
        return res.status(400).json({ message: "The task ID passed is not valid"});
    }
    const { error, value } = patchTaskSchema.validate(req.body || {}, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message})
    }
    const existingTask = await pool.query(
        "SELECT * FROM tasks WHERE id = $1 AND user_id = $2", [taskId, global.user_id]
    );
    if (existingTask.rows.length === 0) {
        return res.status(404).json({ message: "Task not found."});
    }

    const current = existingTask.rows[0];
    const updatedTitle = value.title !== undefined ? value.title : current.title;
    const updatedIsCompleted = value.isCompleted !== undefined ? value.isCompleted : current.is_completed;

    const updatedTask = await pool.query(
        `UPDATE tasks SET title = $1, is_completed = $2 WHERE id = $3 AND user_id = $4 RETURNING id, title, is_completed`, [updatedTitle, updatedIsCompleted, taskId, global.user_id]
    );
    return res.status(200).json(updatedTask.rows[0]);
};

//Delete
const deleteTask = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if(isNaN(taskId)) {
        return res.status(400).json({ message: "The task ID passed is not valid."});
    }
    const deletedTask = await pool.query(
        `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed`, [taskId, global.user_id]
    );
    if (!deletedTask || !deletedTask.rows || deletedTask.rows.length === 0) {
        return res.status(404).json({ message: "Task not found."});
    }
    return res.status(200).json(deletedTask.rows[0]);
};

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
};