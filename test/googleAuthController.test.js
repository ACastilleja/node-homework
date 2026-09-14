const request = require("supertest");
const { app,  server } = require("../app");
const prisma = require("../db/prisma");
const { OAuth2Client } = require("google-auth-library");


jest.mock("google-auth-library");

describe("POST /api/users/googleLogon", () => {
    const testEmail = "googleuser@example.com";
    const testName = "Google Test User";

    beforeEach(async () => {
        await prisma.user.deleteMany({
            where: { email: testEmail },
        });
        await prisma.$disconnect();
        await server.close();
    });

    test("1b. Should return 400 if authorization code is missing", async () => {
        const response = await request(app)
        .post("/api/users/googleLogon")
        .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("error", "Authorization code is required");
    });

    test("2b. Should successfully authenticate an existing user and set JWT cookie", async () => {
        const existingUser = await prisma.user.create({
            data: {
                name: testName,
                email: testEmail,
                hashedPassword: "OAUTH_USER_NO_PASSWORD",
            },
        });

        const mockGetToken = jest.fn().mockResolvedValue({
            tokens: { id_token: "mock-id-token" },
        });
        const mockVerifyIdToken = jest.fn().mockResolvedValue({
            getPayload: () => ({ email: testEmail, name: testName }),
        });
        const mockSetCredentials = jest.fn();

        OAuth2Client.prototype.getToken = mockGetToken;
        OAuth2Client.prototype.verifyIdToken = mockVerifyIdToken;
        OAuth2Client.prototype.setCredentials = mockSetCredentials;

        const response = await request(app)
        .post("/api/users/googleLogon")
        .send({ authorizationCode: "valid-mock-code" });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("name", testName);
        expect(response.body).toHaveProperty("csrfToken");

        const cookies = response.headers["set-cookie"];
        expect(cookies).toBeDefined();
        expect(cookies[0]).toMatch(/jwt=/);
        
    });

    test("3b. Should create a new user if one does not exist and authenticate successfully", async () => {
        const initialUser = await prisma.user.findUnique({
            where: { email: testEmail },
        });
        expect(initialUser).toBeNull();

        OAuth2Client.prototype.getToken = jest.fn().mockResolvedValue({
            tokens: { id_token: "mock-id-token" },
        });
        OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue({
            getPayload: () => ({ email: testEmail, name: testName }),
        });
        OAuth2Client.prototype.setCredentials = jest.fn();

        const response = await request(app)
        .post("/api/users/googleLogon")
        .send({ code: "valid-mock-code" });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("name",testName);
        expect(response.body).toHaveProperty("csrfToken");

        const createdUser = await prisma.user.findUnique({
            where: { email: testEmail },
        });
        expect(createdUser).not.toBeNull();
        expect(createdUser.email).toBe(testEmail);
    });

    test("4b. Should return 401 if Google OAuth token verification fails", async () => {
        OAuth2Client.prototype.getToken = jest
        .fn()
        .mockRejectedValue(new Error("Invalid authorizaiton code"));

        const response = await request(app)
        .post("/api/users/googleLogon")
        .send({ authorizationCode: "invalid-code" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Google authentication failed");
    });

});