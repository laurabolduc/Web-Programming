"use strict";

import { getFavorites } from "../models/favorites.mjs";
import express from "express";
const router = express.Router();

// TODO add any endpoints or middleware functions here
function isSignedIn(req) {
    return req.session._id !== undefined
}

router.get("/list.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed in to get reslimes"
        });
        return;
    }
    let user_id = req.query.user_id;
    let user_name = req.query.screen_name;
    const count = req.query.count;

    if (!user_id && !user_name){
        user_id = req.session._id
        user_name= req.session.username
    }
    // FIXME: Make it so it works for the currently authenticated user if no params are specified
    const getFav = await getFavorites(req.session.username, user_id, user_name, count);
    //console.log("FAVVV",getFav)
    res.json(
        getFav
    );
});

export default router;