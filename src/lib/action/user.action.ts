"use server";

import User from "@/lib/modals/user.modals";
import {connect} from "@/lib/db";

export async function createUser(user: any) {
    try {
        await connect();
        const newUser = await User.create(user);
        return JSON.parse(JSON.stringify(newUser));
    }

    catch (error) {
        console.error("Error creating user:", error);
        // throw new Error("Error creating user");
    }
}