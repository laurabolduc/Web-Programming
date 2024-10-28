"use strict"

import express from "express";
import { getUser } from "../models/user.mjs";

const router = express.Router();

// TODO add any endpoints or middleware functions here
function isSignedIn(req) {
    return req.session._id !== undefined
}

router.get("/get.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed in to get user"
        });
        return;
    }

    const user_id = req.query.user_id;
    const user_name = req.query.screen_name;
    // if the user or the user_id is

    const get_user = await getUser(user_name, user_id);
    if (!get_user) {
        res.json(await getUser(req.session.username));
        return;
    }
    res.json(
        await getUser(user_name, user_id)
    );


    /**
     * FIXME: I am gettign back "get_user: false" but its not crashing/returning a 400 response code. 
     * I think the issue has to do with how i am accessing the user ID and username.
     */
});

export default router;