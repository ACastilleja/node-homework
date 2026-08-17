const prisma = require("../db/prisma");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
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


// Register
const register = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, {abortEarly: false});

    if(error) {
        return res.status(400).json({ message: "Validation failed", details: error.details, });
    }

    const hashedPassword = await hashPassword(value.password);
    delete value.password;

    let user = null;
    

    try{
        user = await prisma.user.create({
            data: {
                name: value.name,
                email: value.email,
                hashedPassword: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
    }catch (err) {
        if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
            return res.status(400).json({ message: "User already exists."});
        }
        return next(err);
    }

    global.user_id = user.id;

    return res.status(201).json({
        name: user.name,
        email: user.email,
    });
};

//Show

const show = async (req, res, next) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID"});
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
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
            },
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

        global.user_id = user.id;

    return res.status(200).json({
        name: user.name,
        email: user.email,
    });

    }catch (err) {
        return next(err);
    }  
};

// Logoff

const logoff = (req, res) => {
    global.user_id = null;
    return res.sendStatus(200);
};



module.exports = {
    register,
    logon,
    logoff,
    show,
};
