const Joi = require("joi");

//Create
const taskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).required(),
    isCompleted: Joi.boolean().default(false),
    
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
});

//Update
const patchTaskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).optional(),
    isCompleted: Joi.boolean().optional(),
    
    priority: Joi.string().valid("low", "medium", "high").optional(),
})
.min(1)
.messages({
    "object.min": "At least one field must be provided to update."
    });

module.exports = {
    taskSchema,
    patchTaskSchema,
};


