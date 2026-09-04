const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

describe("user object validation tests", () => {
    it("1. doesn't permit a trivial password", () => {
        const { error } = userSchema.validate(
            { name: "Bob", email: "bob@sample.com", password: "password" },
            { abortEarly: false },
        );
        expect(error?.details?.some((d) => d.context.key === "password")).toBe(true);
    });

    it("2. The user schema requires that an email be specified.", () => {
        const { error } = userSchema.validate(
            { name: "Bob", password: "StrongPass123!"},
            { abortEarly: false },
        );
        expect(error?.details?.some((d) => d.context.key === "email")).toBe(true);
    });

    it("3. The user schema does not accept an invalid email.", () => {
        const { error } = userSchema.validate(
            { name: "Bob", email: "not-an-email", password: "StrongPass123!"},
            { abortEarly: false },
        );
        expect(error?.details?.some((d) => d.context.key === "email")).toBe(true);
    });

    it("4. The user schema requires a password.", () => {
        const { error } = userSchema.validate(
            { name: "Bob", email: "bob@sample.com"},
            { abortEarly: false },
        );
        expect(error?.details?.some((d) => d.context.key === "password")).toBe(true);
    });

    it("5. The user schema requires name.", () => {
        const { error } = userSchema.validate(
            { email: "bob@sample.com", password: "StrongPass123!"},
            { abortEarly: false },
        );
        expect(error?.details?.some((d) => d.context.key === "name")).toBe(true);
    });

    it("6. The name must be valid (3 to 30 characters).", () => {
        const { error } = userSchema.validate(
            { name: "Me", email: "bob@sample.com", password: "StrongPass123!"},
            { abortEarly: false },
        );
        expect(error?.details?.some((d) => d.context.key === "name")).toBe(true);
    });

    it("7. If validation is performed on a valid user object, error comes back falsy.", () => {
        const { error } = userSchema.validate(
            { name: "Bob", email: "bob@sample.com", password: "StrongPass123!"},
            { abortEarly: false },
        );
        expect(error).toBeFalsy();
    });


});

describe("taskSchema object validation tests", () => {
    it("8. The task schema requires a title.", () => {
        const { error } = taskSchema.validate(
            { isCompleted: false },
            { abortEarly: false },
        );
        expect(
            error.details.find((detail) => detail.context.key == "title"),
        ).toBeDefined();
    });

    it("9. If an isCompleted value is specified, it must be valid.", () => {
        const { error } = taskSchema.validate(
            { title: "Buy groceries", isCompleted: "not-a-boolean" },
            { abortEarly: false },
        );
        expect(
            error.details.find((detail) => detail.context.key == "isCompleted"),
        ).toBeDefined();
    });

    it("10. If an isCompleted is not specified but the rest of the object is valid, a default of false is privided by validation.", () => {
        const { value } = taskSchema.validate(
            { title: "Buy groceries"},
            { abortEarly: false },
        );
        expect(value.isCompleted).toBe(false);
    });

    it("11. If isCompleted in the provided object has the value true, it remains true after validation.", () => {
        const { value } = taskSchema.validate(
            { title: "Buy groceries", isCompleted: true },
            { abortEarly: false },
        );
        expect(value.isCompleted).toBe(true);
    });
});

describe("patchTaskSchema object validation tests", () => {
    it("12. The patchTaskSchema does not require a title.", () => {
        const { error } = patchTaskSchema.validate(
            { isCompleted: true },
            { abortEarly: false },
        );
        expect(error).toBeFalsy();
    });
    it("13. If no value is provided for isCompleted this remains undefined in the returned value.", () => {
        const{ value } = patchTaskSchema.validate(
            {},
            { abortEarly: false },
        );
        expect(value.isCompleted).toBeUndefined();
    });
});