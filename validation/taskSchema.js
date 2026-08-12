const Joi = require("joi");

//Create
const taskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).required(),
    isCompleted: Joi.boolean().default(false),
    is_completed: Joi.boolean().optional(),
});

//Update
const patchTaskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).optional(),
    isCompleted: Joi.boolean().optional(),
    is_completed: Joi.boolean().optional(),
})
.min(1)
.messages({
    "object.min": "At least one field must be provided to update."
    });

module.exports = {
    taskSchema,
    patchTaskSchema,
};


