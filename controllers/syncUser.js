import express from 'express'
import {Webhook} from 'svix'
import 'dotenv/config'
import User from '../models/User.js';

export const syncUser = async (req, res) => {
  try {

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error("Critical configuration error: Missing CLERK_WEBHOOK_SIGNING_SECRET");
              return res.status(500).json({ error: "Missing signing configuration token." });
    }

    const headers = req.headers;
    const svix_id = headers["svix-id"]
    const svix_timestamp = headers["svix-timestamp"]
    const svix_signature = headers["svix-signature"]

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return res.status(400).json({ error: "Missing required validation headers." });
    }

    const payloadString = req.body.toString();
    const wh = new Webhook(WEBHOOK_SECRET)

    let verifiedEvent;

    try {

      verifiedEvent = wh.verify(payloadString, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature":svix_signature,
      })
    } catch (err) {
      console.error("Malicious payload rejected: Signature mismatch.");
      return res.status(400).json({ error: "Invalid webhook payload verification." });
    }


    const { id, email_addresses, first_name, last_name, image_url, name } = verifiedEvent.data;
    const eventType = verifiedEvent.type;

    if (eventType === 'user.created') {
      const primaryEmail = email_addresses?.[0]?.email_address || "";

      const newUser = await User.create({
        clerkId: id,
        email: primaryEmail,
        firstName: first_name ||name || "",
        lastName: last_name || "",
        imageUrl: image_url || "",
      });

      console.log(`🍃 Synced New Google/Email User: ${newUser.email} with avatar!`);
    }

    if (eventType === 'user.updated') {
      const primaryEmail = email_addresses?.[0]?.email_address || "";

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: primaryEmail,
          firstName: first_name || "",
          lastName: last_name || "",
          imageUrl: image_url || "",
        },
        { new: true }
      );
      console.log(`🔄 Updated profile image parameters for Clerk account: ${id}`);
    }

    if (eventType === 'user.deleted') {
            await User.findOneAndDelete({ clerkId: id });
            console.log(`🗑️ Removed user reference ${id} completely from MongoDB Atlas.`);
          }


          return res.status(200).json({ success: true, message: "Sync tracking processed successfully." });



  } catch (error) {

    console.error('Webhook execution pipeline failed:', error);
    return res.status(500).json({ error: "Internal webhook engine failure." });

  }
}