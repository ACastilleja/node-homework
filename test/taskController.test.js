require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");
const {
    index,
    show,
    create,
    update,
    deleteTask,
} = require("../controllers/taskController");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

let user1 = null;
let user2 = null;
let saveRes = null;
let saveData= null;
let saveTaskId = null;

describe("testing task creation", () => {
    it("14. cant create a task without a user id", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            body: { title: "first task"},
        });
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        try {
        await waitForRouteHandlerCompletion(create, req, saveRes);
        } catch (e) {
            expect(e.name).toBe("TypeError");
        }
    });
});