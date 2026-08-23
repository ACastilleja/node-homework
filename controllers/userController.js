const prisma = require("../db/prisma");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const scrypt = util.promisify(crypto.scrypt);

//Helper functions
async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash){
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

//JWT and Cookie
const cookieFlags = (req) => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    };
};

const setJwtCookie = (req, res, user) => {
    const payload = { id: user.id, csrfToken: randomUUID() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 });
    return payload.csrfToken;
};


// Register
const register = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, {abortEarly: false});

    if(error) {
        return res.status(400).json({ message: "Validation failed", details: error.details, });
    }

    const hashedPassword = await hashPassword(value.password);
    delete value.password;

    try{
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: value.name,
                    email: value.email,
                    hashedPassword: hashedPassword,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                },
            });

            const welcomeTaskData = [
                { title: "Complete your profile", userId: newUser.id, priority: "medium" },
                { title: "Add your first task", userId: newUser.id, priority: "high" },
                { title: "Explore the app", userId: newUser.id, priority: "low" },
            ];

            await tx.task. createMany({ data: welcomeTaskData });

            const welcomeTasks = await tx.task.findMany({
                where: {
                    userId: newUser.id,
                    title: { in: welcomeTaskData.map((t) => t.title)},
                },
                select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    userId: true,
                    priority: true,
                },
            });
            return { user: newUser, welcomeTasks };
        });

        const csrfToken = setJwtCookie(req, res, result.user);

        return res.status(201).json({
            name: result.user.name,
            email: result.user.email,
            csrfToken,
        });

        
    }catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({ error: "Email already registered" });
        }
        return next(err);
    }
};

//Show

const show = async (req, res, next) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID"});
    }
    
    const allowedFields = ["id", "name", "email", "createdAt"];

    let selectClause = {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        Task: {
            where: { isCompleted: false },
            select: {
                id: true,
                title: true,
                priority: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        },
    };
    
    //Fields Query Parameter Support
    if (req.query.fields) {
        const requestedFields =  req.query.fields.split(",");
        const customSelect = {};

        customSelect.id = true;

        requestedFields.forEach((field) => {
            const trimmed = field.trim();
            if (allowedFields.includes(trimmed)) {
                customSelect[trimmed] = true;
            }
        });

        if (Object.keys(customSelect).length > 0) {
            selectClause = customSelect;
        }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: selectClause,
            
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (err) {
        return next(err);
    }
};

// Logon

const logon = async (req, res, next) => {
    let { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(401).json({ error: "Invalid credentials"});
    }

    email = email.trim().toLowerCase();

    try {

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const goodCredentials = await comparePassword(password, user.hashedPassword);
        if (!goodCredentials) {
            return res.status(401).json({ error: "Invalid credentials"});
        }

        const csrfToken = setJwtCookie(req, res, user);

    return res.status(200).json({
        name: user.name,
        email: user.email,
        csrfToken,
    });

    }catch (err) {
        return next(err);
    }  
};

// Logoff

const logoff = (req, res) => {
    res.clearCookie("jwt", cookieFlags(req));
    return res.status(200).json({ message: "Logged off successfully" });
};



module.exports = {
    register,
    logon,
    logoff,
    show,
};
