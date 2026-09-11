const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "postmessage"
);

const googleLogon = async (req, res) => {
    try{
        const authorizationCode = req.body.code || req.body.authorizationCode;

        if(!authorizationCode) {
            return res.status(400).json({ error: "Authorization code is required" });
        }

        const {tokens } = await client.getToken(authorizationCode);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    hashedPassword: "OAUTH_USER_NO_PASSWORD",
                },
            });
        }


        const csrfToken = crypto.randomBytes(16).toString("hex");

        const token = jwt.sign(
            {
                id: user.id,
                csrfToken: csrfToken
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return res.status(200).json({
            name: user.name,
            csrfToken: csrfToken,
            
        });
    } catch (error) {
        console.error("Google OAuth Error:", error);
        return res.status(401).json({ error: "Google authentication failed" });
    }
};

module.exports = {
    googleLogon,
};